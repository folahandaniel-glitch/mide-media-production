"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, ExternalLink, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { cn, formatDate } from "@/lib/utils";
import { api, confirmAction } from "./client";
import { Card, PageHeader, SkeletonRows, Spinner } from "./ui";

type Status = "todo" | "in_progress" | "review" | "done";
type Priority = "low" | "normal" | "high" | "urgent";
type Task = {
  id: string;
  title: string;
  description: string;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
  creatorName: string | null;
  priority: Priority;
  status: Status;
  dueDate: string;
  link: string;
  notes: string;
  completedAt: string | number | null;
  createdAt: string | number;
};
type AdminUser = { id: string; name: string; email: string; role: string; active: boolean };

const STATUS_LABEL: Record<Status, string> = { todo: "To do", in_progress: "In progress", review: "Ready for review", done: "Done" };
const STATUS_TONE: Record<Status, string> = {
  todo: "bg-white/10 text-white/75",
  in_progress: "bg-sky-500/15 text-sky-300",
  review: "bg-violet-500/15 text-violet-300",
  done: "bg-emerald-500/15 text-emerald-300",
};
const PRIORITY_TONE: Record<Priority, string> = {
  low: "text-white/45",
  normal: "text-white/70",
  high: "text-amber-300",
  urgent: "text-red-400",
};

const today = () => new Date().toISOString().slice(0, 10);
const isOverdue = (t: Task) => t.status !== "done" && t.dueDate !== "" && t.dueDate < today();

export function TasksManager({
  isSuper,
  currentUserId,
  initialAssignee,
  openNew,
}: {
  isSuper: boolean;
  currentUserId: string;
  initialAssignee?: string;
  openNew?: boolean;
}) {
  const [rows, setRows] = useState<Task[] | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState<"open" | Status | "all">("open");
  const [assignee, setAssignee] = useState(initialAssignee ?? "");
  const [editing, setEditing] = useState<Task | "new" | null>(openNew ? "new" : null);
  const [viewing, setViewing] = useState<Task | null>(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (status === "open") p.set("open", "1");
    else if (status !== "all") p.set("status", status);
    if (assignee) p.set("assignee", assignee);
    try {
      setRows((await api<{ rows: Task[] }>(`/api/admin/tasks?${p}`)).rows);
    } catch (e) {
      toast((e as Error).message, "error");
      setRows([]);
    }
  }, [status, assignee]);

  useEffect(() => {
    const t = window.setTimeout(load, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!isSuper) return;
    let cancelled = false;
    api<{ rows: AdminUser[] }>("/api/admin/users")
      .then((r) => !cancelled && setUsers(r.rows.filter((u) => u.active)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSuper]);

  async function patch(task: Task, body: Partial<Task>, message = "Task updated.") {
    try {
      await api(`/api/admin/tasks/${task.id}`, { method: "PATCH", body });
      toast(message);
      await load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function remove(task: Task) {
    const ok = await confirmAction({ title: "Delete task?", message: `“${task.title}” will be permanently deleted.`, confirmText: "Delete", tone: "danger" });
    if (!ok) return;
    try {
      await api(`/api/admin/tasks/${task.id}`, { method: "DELETE" });
      toast("Task deleted.");
      setViewing(null);
      await load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const summary = useMemo(() => {
    const list = rows ?? [];
    return { open: list.filter((t) => t.status !== "done").length, overdue: list.filter(isOverdue).length };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title={isSuper ? "Tasks" : "My Tasks"}
        description={
          isSuper
            ? "Assign work to your administrators and follow their progress. Admins see only the tasks assigned to them."
            : "Tasks assigned to you by a Super Admin. Update the status and leave progress notes as you work."
        }
        actions={
          isSuper && (
            <button type="button" className="adm-btn adm-btn-primary" onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> Assign task
            </button>
          )
        }
      />

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] p-3">
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
            {(["open", "todo", "in_progress", "review", "done", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={status === s}
                onClick={() => setStatus(s)}
                className={cn("rounded-lg px-3 py-1.5 text-xs transition", status === s ? "bg-brand font-semibold text-black" : "text-white/65 hover:bg-white/5 hover:text-white")}
              >
                {s === "open" ? "Open" : s === "all" ? "All" : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {isSuper && (
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="field !w-auto !py-1.5 text-sm" aria-label="Filter by administrator">
              <option value="">Everyone</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                  {u.id === currentUserId ? " (you)" : ""}
                </option>
              ))}
            </select>
          )}
          <span className="ml-auto px-2 text-xs text-white/45">
            {summary.open} open{summary.overdue > 0 && <span className="text-red-400"> · {summary.overdue} overdue</span>}
          </span>
        </div>

        {rows === null ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-white/55">{isSuper ? "No tasks here yet." : "You have no tasks in this view."}</p>
            {isSuper && (
              <button type="button" className="adm-btn adm-btn-primary mt-5" onClick={() => setEditing("new")}>
                <Plus className="h-4 w-4" /> Assign the first task
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {rows.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 px-4 py-4 transition hover:bg-white/[0.025] md:flex-row md:items-center">
                <button type="button" onClick={() => setViewing(t)} className="min-w-0 flex-1 text-left">
                  <span className={cn("block font-medium text-white", t.status === "done" && "text-white/50 line-through")}>{t.title}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
                    {isSuper && (
                      <span className="flex items-center gap-1">
                        <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> {t.assigneeName || t.assigneeEmail || "Unassigned"}
                      </span>
                    )}
                    <span className={cn("font-semibold uppercase tracking-wider", PRIORITY_TONE[t.priority])}>{t.priority}</span>
                    {t.dueDate && (
                      <span className={cn("flex items-center gap-1", isOverdue(t) && "font-semibold text-red-400")}>
                        {isOverdue(t) ? <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> : <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
                        {isOverdue(t) ? "Overdue · " : "Due "}
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                    {t.notes && <span className="truncate text-white/40">Note: {t.notes.slice(0, 60)}</span>}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`st-${t.id}`}>Status of {t.title}</label>
                  <select
                    id={`st-${t.id}`}
                    value={t.status}
                    onChange={(e) => patch(t, { status: e.target.value as Status }, `Marked as ${STATUS_LABEL[e.target.value as Status].toLowerCase()}.`)}
                    className={cn("rounded-lg border-0 px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-brand", STATUS_TONE[t.status])}
                    disabled={!isSuper && t.assigneeId !== currentUserId}
                  >
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <option key={s} value={s} className="bg-[#141416] text-white">
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  {isSuper && (
                    <>
                      <button type="button" className="adm-icon-btn" onClick={() => setEditing(t)} aria-label={`Edit ${t.title}`} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className="adm-icon-btn hover:!text-red-400" onClick={() => remove(t)} aria-label={`Delete ${t.title}`} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isSuper && (
        <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Assign a task" : "Edit task"}>
          {editing !== null && (
            <TaskForm
              task={editing === "new" ? null : editing}
              users={users}
              defaultAssignee={assignee}
              onDone={async () => {
                setEditing(null);
                await load();
              }}
            />
          )}
        </Modal>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title ?? "Task"}>
        {viewing && (
          <TaskDetail
            key={viewing.id}
            task={viewing}
            isSuper={isSuper}
            canUpdate={isSuper || viewing.assigneeId === currentUserId}
            onSave={async (body) => {
              await patch(viewing, body, "Progress saved.");
              setViewing(null);
            }}
            onEdit={() => {
              setEditing(viewing);
              setViewing(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

function TaskForm({ task, users, defaultAssignee, onDone }: { task: Task | null; users: AdminUser[]; defaultAssignee: string; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    setBusy(true);
    try {
      if (task) await api(`/api/admin/tasks/${task.id}`, { method: "PATCH", body });
      else await api("/api/admin/tasks", { method: "POST", body });
      toast(task ? "Task updated." : "Task assigned.");
      await onDone();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 px-6 pt-3 pb-6">
      <div>
        <label className="field-label" htmlFor="t-title">Task <span className="text-brand">*</span></label>
        <input id="t-title" name="title" className="field" required maxLength={200} defaultValue={task?.title} placeholder="e.g. Upload photos from the Adeyemi wedding" />
      </div>
      <div>
        <label className="field-label" htmlFor="t-assignee">Assign to</label>
        <select id="t-assignee" name="assigneeId" className="field" defaultValue={task?.assigneeId ?? defaultAssignee}>
          <option value="">— Unassigned —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email} · {u.role === "super_admin" ? "Super Admin" : "Admin"}
            </option>
          ))}
        </select>
        {users.length <= 1 && <p className="mt-1.5 text-xs text-white/45">Add administrators under Admins &amp; Users to assign them tasks.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="t-priority">Priority</label>
          <select id="t-priority" name="priority" className="field" defaultValue={task?.priority ?? "normal"}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="t-due">Due date</label>
          <input id="t-due" name="dueDate" type="date" className="field [color-scheme:dark]" defaultValue={task?.dueDate} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="t-desc">Instructions</label>
        <textarea id="t-desc" name="description" rows={4} className="field resize-y" maxLength={5000} defaultValue={task?.description} placeholder="What needs to be done, and any details the admin should know." />
      </div>
      <div>
        <label className="field-label" htmlFor="t-link">Related page (optional)</label>
        <input id="t-link" name="link" className="field" defaultValue={task?.link} placeholder="/admin/r/portfolio or a full URL" />
        <p className="mt-1.5 text-xs text-white/40">Tip: paste the backend page where the work happens, e.g. /admin/r/team.</p>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>
          {busy && <Spinner />} {task ? "Save task" : "Assign task"}
        </button>
      </div>
    </form>
  );
}

function TaskDetail({
  task,
  isSuper,
  canUpdate,
  onSave,
  onEdit,
}: {
  task: Task;
  isSuper: boolean;
  canUpdate: boolean;
  onSave: (body: Partial<Task>) => Promise<void>;
  onEdit: () => void;
}) {
  const [status, setStatus] = useState<Status>(task.status);
  const [notes, setNotes] = useState(task.notes);
  const [busy, setBusy] = useState(false);
  const external = task.link && !task.link.startsWith("/");

  return (
    <div className="px-6 pt-2 pb-6">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={cn("rounded-full px-2.5 py-1 font-medium", STATUS_TONE[task.status])}>{STATUS_LABEL[task.status]}</span>
        <span className={cn("rounded-full bg-white/5 px-2.5 py-1 font-semibold uppercase tracking-wider", PRIORITY_TONE[task.priority])}>{task.priority}</span>
        {task.dueDate && (
          <span className={cn("rounded-full bg-white/5 px-2.5 py-1", isOverdue(task) ? "text-red-400" : "text-white/70")}>
            {isOverdue(task) ? "Overdue · " : "Due "}
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
      <dl className="mt-5 grid grid-cols-[100px_1fr] gap-y-2 text-sm">
        <dt className="text-white/45">Assigned to</dt>
        <dd className="text-white">{task.assigneeName || task.assigneeEmail || "Unassigned"}</dd>
        <dt className="text-white/45">Assigned by</dt>
        <dd className="text-white">{task.creatorName || "Super Admin"}</dd>
        <dt className="text-white/45">Created</dt>
        <dd className="text-white">{formatDate(task.createdAt)}</dd>
      </dl>
      {task.description && <p className="mt-5 rounded-xl bg-white/[0.03] p-4 text-sm leading-relaxed whitespace-pre-line text-white/80">{task.description}</p>}
      {task.link && (
        <a href={task.link} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="adm-btn adm-btn-sm mt-4">
          <ExternalLink className="h-3.5 w-3.5" /> Open related page
        </a>
      )}

      {canUpdate && (
        <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
          <div>
            <label className="field-label" htmlFor="d-status">Status</label>
            <select id="d-status" className="field" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="d-notes">Progress notes</label>
            <textarea id="d-notes" rows={3} className="field resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What has been done, blockers, questions…" />
          </div>
          <div className="flex justify-between gap-2">
            {isSuper ? (
              <button type="button" className="adm-btn" onClick={onEdit}>
                <Pencil className="h-4 w-4" /> Edit task
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="adm-btn adm-btn-primary"
              disabled={busy || (status === task.status && notes === task.notes)}
              onClick={async () => {
                setBusy(true);
                await onSave({ status, notes });
                setBusy(false);
              }}
            >
              {busy && <Spinner />} Save progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
