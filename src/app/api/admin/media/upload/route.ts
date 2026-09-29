import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { adminRoute, jsonError } from "@/lib/api";
import { plainText } from "@/lib/sanitize";
import { saveUpload } from "@/lib/storage";
import { slugify } from "@/lib/utils";

export const maxDuration = 60;

/** Server-side upload: validates, optimises (images → WebP) and stores the file. */
export const POST = adminRoute(async (req) => {
  const form = await req.formData().catch(() => null);
  if (!form) return jsonError("Invalid upload.");
  const files = form.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return jsonError("Choose at least one file.");
  const category = slugify(plainText(form.get("category"), 60) || "general");

  const rows = [];
  for (const file of files.slice(0, 20)) {
    const stored = await saveUpload(file, category);
    const [row] = await db
      .insert(schema.mediaAssets)
      .values({
        url: stored.url,
        storageKey: stored.storageKey,
        name: plainText(file.name, 200) || "upload",
        kind: stored.kind,
        mime: stored.mime,
        size: stored.size,
        width: stored.width,
        height: stored.height,
        category,
        alt: plainText(form.get("alt"), 200),
      })
      .returning();
    rows.push(row);
  }
  return NextResponse.json({ ok: true, rows }, { status: 201 });
});
