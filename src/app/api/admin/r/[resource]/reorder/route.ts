import { NextResponse } from "next/server";
import { adminRoute, revalidateSite } from "@/lib/api";
import { reorderRows } from "@/lib/admin/server";

export const PUT = adminRoute<{ resource: string }>(async (req, { params }) => {
  const body = (await req.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  await reorderRows(params.resource, ids);
  revalidateSite();
  return NextResponse.json({ ok: true });
});
