import { NextResponse } from "next/server";
import { adminRoute, revalidateSite } from "@/lib/api";
import { createRow, listRows } from "@/lib/admin/server";

export const GET = adminRoute<{ resource: string }>(async (req, { params }) => {
  const url = new URL(req.url);
  const rows = await listRows(params.resource, {
    q: url.searchParams.get("q") ?? undefined,
    filter: url.searchParams.get("filter") ?? undefined,
  });
  return NextResponse.json({ ok: true, rows });
});

export const POST = adminRoute<{ resource: string }>(async (req, { params }) => {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Invalid data" }, { status: 400 });
  const row = await createRow(params.resource, body);
  revalidateSite();
  return NextResponse.json({ ok: true, row }, { status: 201 });
});
