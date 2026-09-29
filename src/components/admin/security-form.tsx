"use client";

import { useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { api, confirmAction } from "./client";
import { Card, PageHeader, Spinner } from "./ui";

export function SecurityForm({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (fd.get("newPassword") !== fd.get("confirm")) {
      toast("The new passwords do not match.", "error");
      return;
    }
    setBusy(true);
    try {
      await api("/api/admin/security", { method: "POST", body: { currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") } });
      toast("Password changed. Other devices have been signed out.");
      form.reset();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function signOutAll() {
    const ok = await confirmAction({ title: "Sign out other devices?", message: "Every other browser signed in to this account will be signed out. You will stay signed in here.", confirmText: "Sign out others" });
    if (!ok) return;
    try {
      await api("/api/admin/security", { method: "POST", body: { action: "signout-all" } });
      toast("All other sessions have been signed out.");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Admin Security" description={`Signed in as ${email}.`} />
      <Card className="p-6 md:p-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <ShieldCheck className="h-5 w-5 text-brand" aria-hidden="true" /> Change password
        </h2>
        <form onSubmit={changePassword} className="mt-6 grid gap-4 md:grid-cols-2">
          <input type="text" name="username" autoComplete="username" defaultValue={email} className="sr-only" tabIndex={-1} aria-hidden="true" readOnly />
          <div className="md:col-span-2">
            <label htmlFor="currentPassword" className="field-label">Current password</label>
            <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className="field" />
          </div>
          <div>
            <label htmlFor="newPassword" className="field-label">New password</label>
            <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={10} required className="field" />
          </div>
          <div>
            <label htmlFor="confirm" className="field-label">Confirm new password</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required className="field" />
          </div>
          <p className="text-xs text-white/45 md:col-span-2">Use at least 10 characters including letters and numbers. Passwords are stored as secure bcrypt hashes.</p>
          <div className="md:col-span-2">
            <button type="submit" className="adm-btn adm-btn-primary" disabled={busy}>
              {busy && <Spinner />} Update password
            </button>
          </div>
        </form>
      </Card>
      <Card className="mt-6 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Active sessions</h2>
          <p className="mt-1 text-sm text-white/55">Sessions expire automatically after 8 hours. Sign out every other device if you suspect unauthorised access.</p>
        </div>
        <button type="button" className="adm-btn shrink-0" onClick={signOutAll}>
          <LogOut className="h-4 w-4" /> Sign out other devices
        </button>
      </Card>
    </div>
  );
}
