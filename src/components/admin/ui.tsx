"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import { CONFIRM_EVENT, type ConfirmOptions } from "./client";

export function ConfirmHost() {
  const [req, setReq] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  useEffect(() => {
    const on = (e: Event) => setReq((e as CustomEvent).detail);
    window.addEventListener(CONFIRM_EVENT, on);
    return () => window.removeEventListener(CONFIRM_EVENT, on);
  }, []);
  const close = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };
  return (
    <Modal open={!!req} onClose={() => close(false)} title={req?.title ?? "Confirm"}>
      {req && (
        <div className="px-6 pt-3 pb-6">
          <div className="flex gap-4">
            {req.tone === "danger" && (
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-400">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            <p className="text-sm leading-relaxed text-white/70">{req.message}</p>
          </div>
          <div className="mt-7 flex justify-end gap-3">
            <button type="button" className="adm-btn" onClick={() => close(false)}>
              Cancel
            </button>
            <button type="button" className={cn("adm-btn", req.tone === "danger" ? "adm-btn-danger" : "adm-btn-primary")} onClick={() => close(true)} autoFocus>
              {req.confirmText ?? "Confirm"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-white md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-white/55">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const BADGE_TONES: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-300",
  approved: "bg-emerald-500/15 text-emerald-300",
  completed: "bg-emerald-500/15 text-emerald-300",
  draft: "bg-white/10 text-white/70",
  pending: "bg-amber-500/15 text-amber-300",
  new: "bg-brand/20 text-brand",
  contacted: "bg-sky-500/15 text-sky-300",
  in_progress: "bg-violet-500/15 text-violet-300",
  rejected: "bg-red-500/15 text-red-300",
  closed: "bg-white/10 text-white/60",
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium capitalize", BADGE_TONES[value] ?? "bg-white/10 text-white/75")}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors disabled:opacity-50",
        checked ? "border-brand bg-brand" : "border-white/15 bg-white/10",
      )}
    >
      <span className={cn("inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-[22px]" : "translate-x-[3px]")} />
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} aria-hidden="true" />;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-white/[0.08] bg-[#111113]", className)}>{children}</div>;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-label="Loading" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 rounded-lg" />
      ))}
    </div>
  );
}
