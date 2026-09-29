"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, ListPlus, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { api, confirmAction } from "./client";
import { Card, PageHeader, SkeletonRows, Spinner, Switch } from "./ui";

type User = { id: string; email: string; name: string; role: "super_admin" | "editor"; active: boolean; lastLoginAt: string | null; createdAt: string };

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [rows, setRows] = useState<User[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows((await api<{ rows: User[] }>("/api/admin/users")).rows);
    } catch (e) {
      toast((e as Error).message, "error");
      setRows([]);
    }
  }, []);
  useEffect(() => {
    let cancelled = false;
    api<{ rows: User[] }>("/api/admin/users")
      .then((r) => !cancelled && setRows(r.rows))
      .catch((e) => {
        toast((e as Error).message, "error");
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function patch(u: User, body: Record<string, unknown>, msg: string) {
    try {
      await api(`/api/admin/users/${u.id}`, { method: "PATCH", body });
      toast(msg);
      await load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function remove(u: User) {
    const ok = await confirmAction({ title: "Delete administrator?", message: `${u.email} will lose access to the backend immediately.`, confirmText: "Delete", tone: "danger" });
    if (!ok) return;
    try {
      await api(`/api/admin/users/${u.id}`, { method: "DELETE" });
      toast("Administrator removed.");
      await load();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api("/api/admin/users", { method: "POST", body: Object.fromEntries(fd.entries()) });
      toast("Administrator added.");
      setAdding(false);
      await load();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pw = String(new FormData(e.currentTarget).get("password") ?? "");
    setBusy(true);
    await patch(resetFor!, { password: pw }, "Password updated. The user has been signed out everywhere.");
    setBusy(false);
    setResetFor(null);
  }

  return (
    <div>
      <PageHeader
        title="Admins & Users"
        description="Super Admins can manage everything, add admins and assign them tasks. Admins manage website content and work on the tasks assigned to them, but cannot change settings or users."
        actions={
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add admin
          </button>
        }
      />
      <Card>
        {rows === null ? (
          <SkeletonRows rows={3} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left text-[0.7rem] tracking-[0.12em] text-white/45 uppercase">
                  <th className="px-4 py-3 font-medium" scope="col">User</th>
                  <th className="px-4 py-3 font-medium" scope="col">Role</th>
                  <th className="px-4 py-3 font-medium" scope="col">Last sign-in</th>
                  <th className="px-4 py-3 font-medium" scope="col">Active</th>
                  <th className="px-4 py-3 text-right font-medium" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {u.name || "—"} {u.id === currentUserId && <span className="ml-1 text-xs text-brand">(you)</span>}
                      </p>
                      <p className="text-xs text-white/50">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="field !w-auto !py-1.5 text-sm"
                        value={u.role}
                        aria-label={`Role for ${u.email}`}
                        onChange={(e) => patch(u, { role: e.target.value }, "Role updated.")}
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="editor">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-white/60">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}</td>
                    <td className="px-4 py-3">
                      <Switch checked={u.active} onChange={(v) => patch(u, { active: v }, v ? "Account activated." : "Account deactivated.")} label={`Active: ${u.email}`} disabled={u.id === currentUserId} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {u.active && (
                          <Link href={`/admin/tasks?new=1&assignee=${u.id}`} className="adm-btn adm-btn-sm" title="Assign a task">
                            <ListPlus className="h-3.5 w-3.5" /> Assign task
                          </Link>
                        )}
                        <button type="button" className="adm-icon-btn" onClick={() => setResetFor(u)} aria-label={`Reset password for ${u.email}`} title="Reset password">
                          <KeyRound className="h-4 w-4" />
                        </button>
                        {u.id !== currentUserId && (
                          <button type="button" className="adm-icon-btn hover:!text-red-400" onClick={() => remove(u)} aria-label={`Delete ${u.email}`} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add administrator">
        <form onSubmit={create} className="space-y-4 px-6 pt-3 pb-6">
          <div>
            <label className="field-label" htmlFor="u-name">Full name</label>
            <input id="u-name" name="name" className="field" required />
          </div>
          <div>
            <label className="field-label" htmlFor="u-email">Email</label>
            <input id="u-email" name="email" type="email" className="field" required autoComplete="off" />
          </div>
          <div>
            <label className="field-label" htmlFor="u-password">Temporary password</label>
            <input id="u-password" name="password" type="password" className="field" required minLength={10} autoComplete="new-password" />
            <p className="mt-1 text-xs text-white/40">At least 10 characters with letters and numbers.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="u-role">Role</label>
            <select id="u-role" name="role" className="field" defaultValue="editor">
              <option value="editor">Admin — manages content &amp; assigned tasks</option>
              <option value="super_admin">Super Admin — full access</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="adm-btn" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>{busy && <Spinner />} Add administrator</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetFor} onClose={() => setResetFor(null)} title={`Reset password — ${resetFor?.email ?? ""}`}>
        <form onSubmit={resetPassword} className="space-y-4 px-6 pt-3 pb-6">
          <div>
            <label className="field-label" htmlFor="r-password">New password</label>
            <input id="r-password" name="password" type="password" className="field" required minLength={10} autoComplete="new-password" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="adm-btn" onClick={() => setResetFor(null)}>Cancel</button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>{busy && <Spinner />} Update password</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
