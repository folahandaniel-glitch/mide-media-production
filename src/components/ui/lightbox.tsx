"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { SmartImage } from "./smart-image";

export type LightboxImage = { url: string; alt: string; caption?: string };

/** Fullscreen image viewer: previous / next / close, image count, keyboard and swipe support. */
export function Lightbox({
  images,
  index,
  onIndex,
  onClose,
  title,
  footer,
}: {
  images: LightboxImage[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const open = index !== null && images.length > 0;
  const count = images.length;

  const prev = useCallback(() => index !== null && onIndex((index - 1 + count) % count), [index, count, onIndex]);
  const next = useCallback(() => index !== null && onIndex((index + 1) % count), [index, count, onIndex]);

  const handlers = useRef({ prev, next, onClose });
  useEffect(() => {
    handlers.current = { prev, next, onClose };
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handlers.current.onClose();
      if (e.key === "ArrowLeft") handlers.current.prev();
      if (e.key === "ArrowRight") handlers.current.next();
      if (e.key === "Tab") {
        // keep focus inside the viewer
        const root = closeRef.current?.closest("[role=dialog]");
        const f = root ? Array.from(root.querySelectorAll<HTMLElement>("button,a")) : [];
        if (f.length && !root?.contains(document.activeElement)) {
          e.preventDefault();
          f[0]!.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  const img = images[index!]!;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} — gallery` : "Image gallery"}
      className="fixed inset-0 z-[90] flex flex-col bg-black/[0.97] backdrop-blur"
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <p className="min-w-0 truncate font-display text-xs tracking-[0.25em] text-white/70 uppercase">{title}</p>
        <div className="flex items-center gap-4">
          <span className="font-display text-sm text-white/70 tabular-nums" aria-live="polite">
            <span className="text-white">{index! + 1}</span> / {count}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close gallery"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:border-brand hover:bg-brand hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1">
        <SmartImage key={img.url} src={img.url} alt={img.alt} fill sizes="100vw" className="animate-fade-up object-contain [animation-duration:0.6s]" />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-brand hover:text-black md:left-8"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute top-1/2 right-3 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-brand hover:text-black md:right-8"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 px-4 py-5 text-center md:flex-row md:justify-between md:px-8 md:text-left">
        <p className="text-sm text-white/65">{img.caption || img.alt}</p>
        {footer}
      </div>

      {count > 1 && (
        <div className="no-scrollbar hidden gap-2 overflow-x-auto px-8 pb-5 md:flex" aria-label="Thumbnails">
          {images.map((im, i) => (
            <button
              key={im.url + i}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={`relative h-14 w-24 shrink-0 overflow-hidden rounded-md border-2 transition ${i === index ? "border-brand" : "border-transparent opacity-50 hover:opacity-100"}`}
            >
              <SmartImage src={im.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
