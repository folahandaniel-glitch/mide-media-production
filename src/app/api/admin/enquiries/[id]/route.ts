import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminRoute, jsonError } from "@/lib/api";
import { plainText } from "@/lib/sanitize";

const STATUSES = ["new", "contacted", "in_progress", "completed", "closed"] as const;
type Status = (typeof STATUSES)[number];

export const PATCH = adminRoute<{ id: string }>(async (req, { params }) => {
  const body = (await req.json().catch(() => ({}))) as { status?: string; notes?: string; isRead?: boolean };
  const patch: Partial<typeof schema.enquiries.$inferInsert> = {};
  if (body.status !== undefined) {
    if (!(STATUSES as readonly string[]).includes(body.status)) return jsonError("Invalid status.");
    patch.status = body.status as Status;
    patch.isRead = true;
  }
  if (body.notes !== undefined) patch.notes = plainText(body.notes, 4000);
  if (body.isRead !== undefined) patch.isRead = Boolean(body.isRead);
  if (!Object.keys(patch).length) return jsonError("Nothing to update.");
  const [row] = await db.update(schema.enquiries).set(patch).where(eq(schema.enquiries.id, params.id)).returning();
  if (!row) return jsonError("Not found", 404);
  return NextResponse.json({ ok: true, row });
});

export const DELETE = adminRoute<{ id: string }>(async (_req, { params }) => {
  await db.delete(schema.enquiries).where(eq(schema.enquiries.id, params.id));
  return NextResponse.json({ ok: true });
});
