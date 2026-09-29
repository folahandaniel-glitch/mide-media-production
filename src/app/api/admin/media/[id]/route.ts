import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminRoute, jsonError } from "@/lib/api";
import { plainText } from "@/lib/sanitize";
import { removeStoredFile } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export const PATCH = adminRoute<{ id: string }>(async (req, { params }) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Partial<typeof schema.mediaAssets.$inferInsert> = {};
  if (typeof body.name === "string") patch.name = plainText(body.name, 200) || "media";
  if (typeof body.alt === "string") patch.alt = plainText(body.alt, 200);
  if (typeof body.category === "string") patch.category = slugify(plainText(body.category, 60) || "general");
  if (typeof body.featured === "boolean") patch.featured = body.featured;
  if (!Object.keys(patch).length) return jsonError("Nothing to update.");
  const [row] = await db.update(schema.mediaAssets).set(patch).where(eq(schema.mediaAssets.id, params.id)).returning();
  if (!row) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true, row });
});

export const DELETE = adminRoute<{ id: string }>(async (_req, { params }) => {
  const [row] = await db.delete(schema.mediaAssets).where(eq(schema.mediaAssets.id, params.id)).returning();
  if (!row) return jsonError("Not found", 404);
  await removeStoredFile(row.storageKey, row.url);
  return NextResponse.json({ ok: true });
});
