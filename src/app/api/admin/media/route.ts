import { NextResponse } from "next/server";
import { and, desc, eq, like, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminRoute, jsonError } from "@/lib/api";
import { plainText, safeUrl } from "@/lib/sanitize";
import { blobClientUploadsEnabled } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export const GET = adminRoute(async (req) => {
  const url = new URL(req.url);
  // `blob` here means "browser-direct uploads available" (used for large videos).
  if (url.searchParams.get("meta") === "1") return NextResponse.json({ ok: true, blob: blobClientUploadsEnabled() });
  const q = url.searchParams.get("q")?.slice(0, 100);
  const kind = url.searchParams.get("kind");
  const category = url.searchParams.get("category");
  const where: SQL[] = [];
  if (q) where.push(like(schema.mediaAssets.name, `%${q}%`));
  if (kind === "image" || kind === "video" || kind === "file") where.push(eq(schema.mediaAssets.kind, kind));
  if (category) where.push(eq(schema.mediaAssets.category, category));
  const rows = await db
    .select()
    .from(schema.mediaAssets)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(schema.mediaAssets.featured), desc(schema.mediaAssets.createdAt))
    .limit(1000);
  const categories = await db.selectDistinct({ c: schema.mediaAssets.category }).from(schema.mediaAssets);
  return NextResponse.json({ ok: true, rows, categories: categories.map((c) => c.c).filter(Boolean), blob: blobClientUploadsEnabled() });
});

/** Registers an asset that is already hosted (Blob client upload, or an external URL). */
export const POST = adminRoute(async (req) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const url = safeUrl(body.url);
  if (!url || !/^https?:\/\//.test(url)) return jsonError("Enter a valid https:// URL.", 422);
  const isVideo = /\.(mp4|webm)(\?|$)/i.test(url) || body.kind === "video";
  const [row] = await db
    .insert(schema.mediaAssets)
    .values({
      url,
      storageKey: typeof body.storageKey === "string" ? body.storageKey.slice(0, 500) : "",
      name: plainText(body.name, 200) || url.split("/").pop()?.split("?")[0] || "media",
      kind: isVideo ? "video" : "image",
      mime: plainText(body.mime, 80),
      size: Math.max(0, Number(body.size) || 0),
      category: slugify(plainText(body.category, 60) || "general"),
    })
    .returning();
  return NextResponse.json({ ok: true, row }, { status: 201 });
});
