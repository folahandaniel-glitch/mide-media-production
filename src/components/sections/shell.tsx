import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn, isInternalHref } from "@/lib/utils";
import type { SectionWithData } from "@/lib/content";

export function sectionAnchor(section: SectionWithData) {
  return section.anchor || `section-${section.id.slice(0, 8)}`;
}

export function SectionShell({
  section,
  index,
  children,
  className,
  padded = true,
}: {
  section: SectionWithData;
  index?: number;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  const bg = section.background;
  return (
    <section
      id={sectionAnchor(section)}
      aria-labelledby={section.title ? `${sectionAnchor(section)}-title` : undefined}
      data-index={index}
      className={cn(
        "relative isolate overflow-hidden",
        padded && "py-24 md:py-32",
        bg === "dark" && "bg-ink",
        bg === "charcoal" && "bg-charcoal",
        bg === "gradient" && "bg-night",
        bg === "light" && "bg-paper text-neutral-900",
        bg === "image" && "bg-black",
        className,
      )}
    >
      {bg === "gradient" && <div className="light-leak absolute inset-0 -z-10" aria-hidden="true" />}
      {bg === "image" && section.image && (
        <>
          <SmartImage src={section.image} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-40" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/85" aria-hidden="true" />
        </>
      )}
      {children}
    </section>
  );
}

export function SectionHeading({
  section,
  index,
  align = "left",
  light,
  action,
}: {
  section: SectionWithData;
  index?: number;
  align?: "left" | "center";
  light?: boolean;
  action?: React.ReactNode;
}) {
  const isLight = light ?? section.background === "light";
  if (!section.title && !section.eyebrow && !section.subtitle) return null;
  return (
    <div
      className={cn(
        "reveal mb-14 flex flex-col gap-8 md:mb-20",
        align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        {(section.eyebrow || index != null) && (
          <p className="eyebrow">
            {index != null && <span className="tabular-nums">{String(index).padStart(2, "0")}</span>}
            {section.eyebrow}
          </p>
        )}
        {section.title && (
          <h2
            id={`${sectionAnchor(section)}-title`}
            className={cn("display-title mt-5 text-[clamp(2.2rem,5.6vw,4.6rem)]", isLight ? "text-neutral-950" : "text-white")}
          >
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className={cn("mt-6 max-w-2xl text-lg leading-relaxed", isLight ? "text-neutral-600" : "text-white/60", align === "center" && "mx-auto")}>
            {section.subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function SectionButton({ text, url, variant = "primary" }: { text: string; url: string; variant?: "primary" | "ghost" }) {
  if (!text || !url) return null;
  const cls = cn("btn", variant === "primary" ? "btn-primary" : "btn-ghost");
  if (isInternalHref(url)) {
    return (
      <Link href={url} className={cls}>
        {text} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={cls}>
      {text} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
    </a>
  );
}

export function EmptyState({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div className="reveal flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
      <svg viewBox="0 0 48 48" className="h-12 w-12 text-white/25" aria-hidden="true">
        <rect x="4" y="10" width="40" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M4 16h40M4 32h40M10 10v6M18 10v6M26 10v6M34 10v6M10 32v6M18 32v6M26 32v6M34 32v6" stroke="currentColor" strokeWidth="2" />
      </svg>
      <p className="mt-5 text-white/60">{message}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

/** Corner brackets like a camera viewfinder. */
export function ViewfinderCorners({ className }: { className?: string }) {
  const c = "absolute h-6 w-6 border-brand";
  return (
    <div className={cn("pointer-events-none absolute inset-3 z-10", className)} aria-hidden="true">
      <span className={cn(c, "top-0 left-0 border-t-2 border-l-2")} />
      <span className={cn(c, "top-0 right-0 border-t-2 border-r-2")} />
      <span className={cn(c, "bottom-0 left-0 border-b-2 border-l-2")} />
      <span className={cn(c, "right-0 bottom-0 border-r-2 border-b-2")} />
    </div>
  );
}
