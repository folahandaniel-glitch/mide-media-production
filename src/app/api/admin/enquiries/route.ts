import { NextResponse } from "next/server";
import { and, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminRoute } from "@/lib/api";

const STATUSES = ["new", "contacted", "in_progress", "completed", "closed"] as const;

export const GET = adminRoute(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.slice(0, 100);
  const status = url.searchParams.get("status");
  const unread = url.searchParams.get("unread") === "1";
  const where: SQL[] = [];
  if (q) {
    const t = `%${q}%`;
    where.push(
      or(
        like(schema.enquiries.name, t),
        like(schema.enquiries.email, t),
        like(schema.enquiries.phone, t),
        like(schema.enquiries.service, t),
        like(schema.enquiries.message, t),
      )!,
    );
  }
  if (status && (STATUSES as readonly string[]).includes(status)) where.push(eq(schema.enquiries.status, status as (typeof STATUSES)[number]));
  if (unread) where.push(eq(schema.enquiries.isRead, false));
  const rows = await db
    .select()
    .from(schema.enquiries)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(schema.enquiries.createdAt))
    .limit(500);
  return NextResponse.json({ ok: true, rows });
});
