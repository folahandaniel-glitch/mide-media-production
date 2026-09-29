import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/api";
import { createTask, listTasks } from "@/lib/tasks";

export const GET = adminRoute(async (req, { session }) => {
  const url = new URL(req.url);
  const rows = await listTasks(session, {
    status: url.searchParams.get("status") ?? undefined,
    assigneeId: url.searchParams.get("assignee") ?? undefined,
    open: url.searchParams.get("open") === "1",
  });
  return NextResponse.json({ ok: true, rows });
});

export const POST = adminRoute(async (req, { session }) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const row = await createTask(session, body);
  return NextResponse.json({ ok: true, row }, { status: 201 });
});
