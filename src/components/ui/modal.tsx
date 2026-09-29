"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Accessible modal built on the native <dialog> element (focus trap + Escape for free). */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  hideTitle = false,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  hideTitle?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={cn(
        "m-auto max-h-[92vh] w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-white/10 bg-charcoal p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm",
        wide ? "max-w-5xl" : "max-w-xl",
        className,
      )}
    >
      {open && (
        <div className="relative max-h-[92vh] overflow-y-auto">
          <div className={cn("sticky top-0 z-10 flex items-center justify-between gap-4 px-6 pt-5", hideTitle && "absolute inset-x-0")}>
            <h2 id="modal-title" className={cn("font-display text-lg font-semibold", hideTitle && "sr-only")}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white/80 backdrop-blur transition hover:bg-brand hover:text-black"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
