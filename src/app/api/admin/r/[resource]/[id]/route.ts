import { NextResponse } from "next/server";
import { adminRoute, revalidateSite } from "@/lib/api";
import { deleteRow, getRow, updateRow } from "@/lib/admin/server";

type P = { resource: string; id: string };

export const GET = adminRoute<P>(async (_req, { params }) => {
  const row = await getRow(params.resource, params.id);
  return NextResponse.json({ ok: true, row });
});

/** Full update from the edit form. */
export const PUT = adminRoute<P>(async (req, { params }) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
  const row = await updateRow(params.resource, params.id, body, false);
  revalidateSite();
  return NextResponse.json({ ok: true, row });
});

/** Partial update (quick actions: publish, approve, toggle visibility…). */
export const PATCH = adminRoute<P>(async (req, { params }) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
  const row = await updateRow(params.resource, params.id, body, true);
  revalidateSite();
  return NextResponse.json({ ok: true, row });
});

export const DELETE = adminRoute<P>(async (_req, { params }) => {
  await deleteRow(params.resource, params.id);
  revalidateSite();
  return NextResponse.json({ ok: true });
});
