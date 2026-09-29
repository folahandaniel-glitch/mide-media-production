import "server-only";
import { and, asc, desc, eq, ne, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db, schema } from "@/db";
import { HttpError } from "./api";
import { plainText, safeUrl } from "./sanitize";
import type { AdminSession } from "./auth";

export const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
type Status = (typeof TASK_STATUSES)[number];
type Priority = (typeof TASK_PRIORITIES)[number];

const assignee = alias(schema.adminUsers, "assignee");
const creator = alias(schema.adminUsers, "creator");

export async function listTasks(session: AdminSession, opts: { status?: string; assigneeId?: string; open?: boolean }) {
  const where: SQL[] = [];
  // Admins only ever see their own tasks.
  if (session.role !== "super_admin") where.push(eq(schema.adminTasks.assigneeId, session.id));
  else if (opts.assigneeId) where.push(eq(schema.adminTasks.assigneeId, opts.assigneeId));
  if (opts.status && (TASK_STATUSES as readonly string[]).includes(opts.status)) {
    where.push(eq(schema.adminTasks.status, opts.status as Status));
  } else if (opts.open) where.push(ne(schema.adminTasks.status, "done"));

  const rows = await db
    .select({
      task: schema.adminTasks,
      assigneeName: assignee.name,
      assigneeEmail: assignee.email,
      creatorName: creator.name,
    })
    .from(schema.adminTasks)
    .leftJoin(assignee, eq(schema.adminTasks.assigneeId, assignee.id))
    .leftJoin(creator, eq(schema.adminTasks.createdById, creator.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(
      // open first, then by urgency and due date
      sql`case when ${schema.adminTasks.status} = 'done' then 1 else 0 end`,
      sql`case ${schema.adminTasks.priority} when 'urgent' then 0 when 'high' then 1 when 'normal' then 2 else 3 end`,
      sql`case when ${schema.adminTasks.dueDate} = '' then 1 else 0 end`,
      asc(schema.adminTasks.dueDate),
      desc(schema.adminTasks.createdAt),
    )
    .limit(500);
  return rows.map((r) => ({ ...r.task, assigneeName: r.assigneeName, assigneeEmail: r.assigneeEmail, creatorName: r.creatorName }));
}

async function assertAssignable(id: string | null) {
  if (!id) return null;
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, id) });
  if (!user || !user.active) throw new HttpError(422, "Choose an active administrator to assign this task to.");
  return id;
}

function cleanFields(input: Record<string, unknown>) {
  const out: Partial<typeof schema.adminTasks.$inferInsert> = {};
  if ("title" in input) {
    const title = plainText(input.title, 200);
    if (!title) throw new HttpError(422, "Task title is required.");
    out.title = title;
  }
  if ("description" in input) out.description = plainText(input.description, 5000);
  if ("priority" in input) {
    if (!(TASK_PRIORITIES as readonly string[]).includes(String(input.priority))) throw new HttpError(422, "Invalid priority.");
    out.priority = input.priority as Priority;
  }
  if ("status" in input) {
    if (!(TASK_STATUSES as readonly string[]).includes(String(input.status))) throw new HttpError(422, "Invalid status.");
    out.status = input.status as Status;
    out.completedAt = input.status === "done" ? new Date() : null;
  }
  if ("dueDate" in input) {
    const d = plainText(input.dueDate, 10);
    out.dueDate = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
  }
  if ("link" in input) out.link = safeUrl(input.link);
  if ("notes" in input) out.notes = plainText(input.notes, 5000);
  return out;
}

export async function createTask(session: AdminSession, input: Record<string, unknown>) {
  if (session.role !== "super_admin") throw new HttpError(403, "Only a Super Admin can assign tasks.");
  const fields = cleanFields({ title: "", ...input });
  const assigneeId = await assertAssignable(typeof input.assigneeId === "string" && input.assigneeId ? input.assigneeId : null);
  const [row] = await db
    .insert(schema.adminTasks)
    .values({ ...fields, title: fields.title!, assigneeId, createdById: session.id })
    .returning();
  return row;
}

export async function updateTask(session: AdminSession, id: string, input: Record<string, unknown>) {
  const task = await db.query.adminTasks.findFirst({ where: eq(schema.adminTasks.id, id) });
  if (!task) throw new HttpError(404, "Task not found.");
  const isSuper = session.role === "super_admin";
  if (!isSuper && task.assigneeId !== session.id) throw new HttpError(403, "This task is not assigned to you.");

  // Assignees may only move the status and write progress notes.
  const allowed = isSuper ? input : Object.fromEntries(Object.entries(input).filter(([k]) => k === "status" || k === "notes"));
  const fields = cleanFields(allowed);
  if (isSuper && "assigneeId" in input) {
    fields.assigneeId = await assertAssignable(typeof input.assigneeId === "string" && input.assigneeId ? input.assigneeId : null);
  }
  if (!Object.keys(fields).length) throw new HttpError(400, "Nothing to update.");
  const [row] = await db.update(schema.adminTasks).set(fields).where(eq(schema.adminTasks.id, id)).returning();
  return row;
}

export async function deleteTask(session: AdminSession, id: string) {
  if (session.role !== "super_admin") throw new HttpError(403, "Only a Super Admin can delete tasks.");
  await db.delete(schema.adminTasks).where(eq(schema.adminTasks.id, id));
}

export async function countOpenTasks(userId: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.adminTasks)
    .where(and(eq(schema.adminTasks.assigneeId, userId), ne(schema.adminTasks.status, "done")));
  return Number(r?.n ?? 0);
}
