"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; message: string; kind: ToastKind };

const EVENT = "mmp:toast";
let counter = 0;

export function toast(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastItem>(EVENT, { detail: { id: ++counter, message, kind } }));
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = (e as CustomEvent<ToastItem>).detail;
      setItems((prev) => [...prev.slice(-3), t]);
      window.setTimeout(() => setItems((prev) => prev.filter((p) => p.id !== t.id)), t.kind === "error" ? 7000 : 4500);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
      role="region"
      aria-label="Notifications"
    >
      {items.map((t) => {
        const IconCmp = t.kind === "success" ? CheckCircle2 : t.kind === "error" ? AlertTriangle : Info;
        return (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={cn(
              "animate-fade-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-[#141416]/95 px-4 py-3.5 text-sm text-white shadow-2xl backdrop-blur",
              t.kind === "success" && "border-emerald-500/40",
              t.kind === "error" && "border-red-500/50",
              t.kind === "info" && "border-white/15",
            )}
          >
            <IconCmp
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0",
                t.kind === "success" && "text-emerald-400",
                t.kind === "error" && "text-red-400",
                t.kind === "info" && "text-brand",
              )}
              aria-hidden="true"
            />
            <p className="flex-1 leading-relaxed">{t.message}</p>
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((p) => p.id !== t.id))}
              className="text-white/50 hover:text-white"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
