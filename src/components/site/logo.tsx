import { cn } from "@/lib/utils";

/** The aperture mark used when no logo has been uploaded in Settings. */
export function ApertureMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <g fill="var(--brand)">
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <path key={deg} d="M24 8.5 31.5 12 27 24 Z" transform={`rotate(${deg} 24 24)`} opacity={deg === 0 ? 1 : 0.9} />
        ))}
      </g>
      <circle cx="24" cy="24" r="5.2" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  logoUrl,
  alt,
  className,
  compact = false,
}: {
  logoUrl?: string;
  alt: string;
  className?: string;
  compact?: boolean;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- admin-supplied logo of unknown aspect ratio/format
      <img src={logoUrl} alt={alt} className={cn("h-14 w-auto object-contain md:h-16", className)} />
    );
  }
  return (
    <span className={cn("flex items-center gap-3 text-white", className)}>
      <ApertureMark className="h-10 w-10 shrink-0 md:h-11 md:w-11" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.02rem] font-bold tracking-[0.18em]">MIDE MEDIA</span>
          <span className="mt-1 font-display text-[0.58rem] font-medium tracking-[0.52em] text-brand">PRODUCTION</span>
        </span>
      )}
      <span className="sr-only">{alt}</span>
    </span>
  );
}
