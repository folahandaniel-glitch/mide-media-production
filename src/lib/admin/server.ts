import "server-only";
import { and, asc, desc, eq, like, ne, or, type SQL } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTableWithColumns } from "drizzle-orm/sqlite-core";
import { db, schema } from "@/db";
import { plainText, safeUrl, sanitizeCustomHtml, sanitizeRichText } from "@/lib/sanitize";
import { slugify, safeJson } from "@/lib/utils";
import { HttpError } from "@/lib/api";
import { getResource, isFieldVisible, type Field, type Resource, type ResourceKey } from "./resources";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = SQLiteTableWithColumns<any>;

export const resourceTables: Record<ResourceKey, AnyTable> = {
  slides: schema.heroSlides,
  sections: schema.sections,
  services: schema.services,
  portfolio: schema.portfolioProjects,
  categories: schema.portfolioCategories,
  team: schema.teamMembers,
  testimonials: schema.testimonials,
  why: schema.whyItems,
  instagram: schema.instagramPosts,
  nav: schema.navItems,
  social: schema.socialLinks,
  announcements: schema.announcements,
};

export function loadResource(key: string) {
  const resource = getResource(key);
  if (!resource) throw new HttpError(404, "Unknown collection");
  const table = resourceTables[key as ResourceKey];
  return { resource, table };
}

function col(table: AnyTable, name: string): SQLiteColumn {
  const c = (table as unknown as Record<string, SQLiteColumn>)[name];
  if (!c) throw new Error(`Unknown column ${name}`);
  return c;
}

export async function listRows(key: string, opts: { q?: string; filter?: string }) {
  const { resource, table } = loadResource(key);
  const where: SQL[] = [];
  if (opts.q && resource.searchFields?.length) {
    const term = `%${opts.q.slice(0, 100)}%`;
    const conds = resource.searchFields.map((f) => like(col(table, f), term));
    where.push(or(...conds)!);
  }
  if (opts.filter && resource.filter) where.push(eq(col(table, resource.filter.field), opts.filter));
  const order =
    resource.orderBy === "sort"
      ? [asc(col(table, "sortOrder")), asc(col(table, "id"))]
      : [desc(col(table, "createdAt"))];
  return db
    .select()
    .from(table)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...order)
    .limit(500);
}

export async function getRow(key: string, id: string) {
  const { table } = loadResource(key);
  const [row] = await db.select().from(table).where(eq(col(table, "id"), id)).limit(1);
  if (!row) throw new HttpError(404, "Not found");
  const out: Record<string, unknown> = { ...row };
  if (key === "sections") Object.assign(out, safeJson(row.data as string, {}));
  if (key === "portfolio") {
    out.gallery = await db
      .select()
      .from(schema.portfolioMedia)
      .where(eq(schema.portfolioMedia.projectId, id))
      .orderBy(asc(schema.portfolioMedia.sortOrder));
  }
  if (key === "testimonials") out.rating = String(out.rating ?? 5);
  return out;
}

/* ------------------------------- Validation -------------------------------- */

type GalleryItem = { url: string; alt: string };

function cleanValue(field: Field, raw: unknown): unknown {
  if (field.name === "html") return sanitizeCustomHtml(typeof raw === "string" ? raw.slice(0, field.max ?? 20000) : "");
  switch (field.type) {
    case "boolean":
      return raw === true || raw === "true" || raw === 1 || raw === "on";
    case "number": {
      const n = Number(raw);
      if (!Number.isFinite(n)) return field.default ?? 0;
      const min = field.min ?? -Infinity;
      const max = field.max ?? Infinity;
      return Math.round(Math.min(max, Math.max(min, n)));
    }
    case "richtext":
      return sanitizeRichText(typeof raw === "string" ? raw : "");
    case "url":
    case "image":
    case "video":
      return safeUrl(raw);
    case "email": {
      const s = plainText(raw, 200).toLowerCase();
      if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new HttpError(422, `${field.label} is not a valid email address.`);
      return s;
    }
    case "select":
    case "icon": {
      const s = String(raw ?? field.default ?? "");
      if (field.options && !field.options.some((o) => o.value === s)) {
        return String(field.default ?? field.options[0]?.value ?? "");
      }
      return s;
    }
    case "relation":
      return typeof raw === "string" && raw ? raw : null;
    case "repeater": {
      if (!Array.isArray(raw)) return [];
      return raw.slice(0, 100).map((item) => {
        const o: Record<string, unknown> = {};
        for (const sf of field.subfields ?? []) o[sf.name] = cleanValue(sf, (item as Record<string, unknown>)?.[sf.name]);
        return o;
      });
    }
    case "gallery": {
      if (!Array.isArray(raw)) return [];
      return raw
        .slice(0, 200)
        .map((g) => ({ url: safeUrl((g as GalleryItem)?.url), alt: plainText((g as GalleryItem)?.alt, 200) }))
        .filter((g) => g.url);
    }
    case "textarea":
    case "text":
    case "tags":
    case "date":
    default: {
      const s = typeof raw === "string" ? raw.replace(/<\s*\/?\s*script[^>]*>/gi, "").trim() : raw == null ? "" : String(raw);
      return s.slice(0, field.max ?? 5000);
    }
  }
}

async function uniqueSlug(table: AnyTable, base: string, excludeId?: string) {
  let candidate = base;
  for (let i = 2; i < 200; i++) {
    const conds = [eq(col(table, "slug"), candidate)];
    if (excludeId) conds.push(ne(col(table, "id"), excludeId));
    const [hit] = await db.select({ id: col(table, "id") }).from(table).where(and(...conds)).limit(1);
    if (!hit) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now()}`;
}

/**
 * Builds a DB-ready record from user input. Only fields declared in the resource
 * are accepted; everything is validated and sanitised on the server.
 */
async function buildRecord(
  resource: Resource,
  table: AnyTable,
  input: Record<string, unknown>,
  opts: { partial: boolean; existing?: Record<string, unknown> },
) {
  const values: Record<string, unknown> = {};
  const data: Record<string, unknown> = opts.existing ? safeJson(opts.existing.data as string, {}) : {};
  let gallery: GalleryItem[] | undefined;
  const merged = { ...(opts.existing ?? {}), ...input };

  for (const field of resource.fields) {
    const has = Object.prototype.hasOwnProperty.call(input, field.name);
    if (opts.partial && !has) continue;
    if (field.lockedBy && opts.existing?.[field.lockedBy]) continue;
    if (!isFieldVisible(field, merged) && !field.inData) continue;

    const raw = has ? input[field.name] : field.default;
    const value = cleanValue(field, raw);

    if (field.required && !opts.partial && (value === "" || value == null)) {
      throw new HttpError(422, `${field.label} is required.`);
    }
    if (field.required && opts.partial && has && (value === "" || value == null)) {
      throw new HttpError(422, `${field.label} is required.`);
    }

    if (field.type === "gallery") gallery = value as GalleryItem[];
    else if (field.inData) data[field.name] = value;
    else values[field.name] = field.type === "select" && field.name === "rating" ? Number(value) : value;
  }

  // Slugs
  for (const field of resource.fields.filter((f) => f.slugFrom)) {
    if (opts.partial && !(field.name in values) && !(field.slugFrom! in values)) continue;
    const base = slugify(String(values[field.name] || merged[field.slugFrom!] || "item"));
    values[field.name] = await uniqueSlug(table, base, opts.existing?.id as string | undefined);
  }

  if (resource.key === "sections") {
    values.data = JSON.stringify(data);
    if (!opts.partial || "anchor" in values || "label" in values) {
      const anchor = slugify(String(values.anchor || merged.anchor || merged.label || "section"));
      values.anchor = anchor;
    }
  }

  if (resource.key === "testimonials" && "status" in values) values.reviewedAt = new Date();

  return { values, gallery };
}

async function saveGallery(projectId: string, gallery: GalleryItem[] | undefined) {
  if (!gallery) return;
  await db.delete(schema.portfolioMedia).where(eq(schema.portfolioMedia.projectId, projectId));
  if (gallery.length) {
    await db
      .insert(schema.portfolioMedia)
      .values(gallery.map((g, i) => ({ projectId, url: g.url, alt: g.alt, sortOrder: i })));
  }
}

export async function createRow(key: string, input: Record<string, unknown>) {
  const { resource, table } = loadResource(key);
  if (resource.canCreate === false) throw new HttpError(403, "Items cannot be created here.");
  const { values, gallery } = await buildRecord(resource, table, input, { partial: false });
  if (resource.sortable) {
    const rows = await db.select({ s: col(table, "sortOrder") }).from(table).orderBy(desc(col(table, "sortOrder"))).limit(1);
    values.sortOrder = ((rows[0]?.s as number) ?? -1) + 1;
  }
  if (key === "testimonials") values.source = "admin";
  const [row] = await db.insert(table).values(values).returning();
  if (key === "portfolio") await saveGallery(row.id as string, gallery);
  return row;
}

export async function updateRow(key: string, id: string, input: Record<string, unknown>, partial: boolean) {
  const { resource, table } = loadResource(key);
  const [existing] = await db.select().from(table).where(eq(col(table, "id"), id)).limit(1);
  if (!existing) throw new HttpError(404, "Not found");
  const { values, gallery } = await buildRecord(resource, table, input, { partial, existing });
  let row = existing;
  if (Object.keys(values).length) {
    [row] = await db.update(table).set(values).where(eq(col(table, "id"), id)).returning();
  }
  if (key === "portfolio") await saveGallery(id, gallery);
  return row;
}

export async function deleteRow(key: string, id: string) {
  const { resource, table } = loadResource(key);
  const [existing] = await db.select().from(table).where(eq(col(table, "id"), id)).limit(1);
  if (!existing) throw new HttpError(404, "Not found");
  if (resource.canDelete && !resource.canDelete(existing as never)) {
    throw new HttpError(403, resource.deleteBlockedReason ?? "This item cannot be deleted.");
  }
  await db.delete(table).where(eq(col(table, "id"), id));
}

export async function reorderRows(key: string, ids: string[]) {
  const { resource, table } = loadResource(key);
  if (!resource.sortable) throw new HttpError(400, "This collection cannot be reordered.");
  if (!ids.length) return;
  await db.batch(
    ids.slice(0, 1000).map((id, index) => db.update(table).set({ sortOrder: index }).where(eq(col(table, "id"), id))) as never,
  );
}
