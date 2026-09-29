import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/api";
import { deleteTask, updateTask } from "@/lib/tasks";

export const PATCH = adminRoute<{ id: string }>(async (req, { params, session }) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const row = await updateTask(session, params.id, body);
  return NextResponse.json({ ok: true, row });
});

export const DELETE = adminRoute<{ id: string }>(async (_req, { params, session }) => {
  await deleteTask(session, params.id);
  return NextResponse.json({ ok: true });
});
