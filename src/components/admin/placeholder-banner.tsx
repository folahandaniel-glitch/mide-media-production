"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Info, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { api, confirmAction } from "./client";
import { Spinner } from "./ui";

export function PlaceholderBanner({ projects, team }: { projects: number; team: number }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function removeAll() {
    const ok = await confirmAction({
      title: "Remove all placeholders?",
      message: `This deletes ${projects} sample portfolio project(s) and ${team} placeholder team profile(s). Your real content is not affected.`,
      confirmText: "Remove placeholders",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api("/api/admin/placeholders", { method: "DELETE" });
      toast("All placeholder content removed.");
      router.refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand/40 bg-brand/[0.08] p-5 md:flex-row md:items-center md:justify-between">
      <div className="flex gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-white">Your website still contains placeholder content</p>
          <p className="mt-1 text-sm text-white/65">
            {projects} sample project(s) and {team} placeholder team profile(s) are labelled “Sample” on the website. Replace them with real work, or remove them all at once.
          </p>
        </div>
      </div>
      <button type="button" className="adm-btn adm-btn-danger shrink-0" onClick={removeAll} disabled={busy}>
        {busy ? <Spinner /> : <Trash2 className="h-4 w-4" />} Remove all placeholders
      </button>
    </div>
  );
}
