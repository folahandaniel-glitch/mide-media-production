"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { WhatsAppIcon } from "@/components/ui/icon";
import { cn, isInternalHref, whatsappLink } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks";
import type { HeroSlide } from "@/db/schema";

type Props = {
  slides: HeroSlide[];
  anchor: string;
  animatedWords: string;
  primaryText: string;
  primaryUrl: string;
  secondaryText: string;
  whatsappNumber: string;
  whatsappMessage: string;
  autoplaySeconds: number;
  showRec: boolean;
};

/** Camera-style timecode. Ticks once per second and only while the hero is on screen. */
function Timecode() {
  const [t, setT] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let id: number | undefined;
    const start = performance.now();
    const run = (on: boolean) => {
      window.clearInterval(id);
      if (on) id = window.setInterval(() => setT(performance.now() - start), 1000);
    };
    const io = new IntersectionObserver(([e]) => run(Boolean(e?.isIntersecting)));
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, []);
  const s = Math.floor(t / 1000);
  const f = Math.floor(((t % 1000) / 1000) * 24);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span ref={ref} className="tabular-nums">
      {pad(Math.floor(s / 3600))}:{pad(Math.floor(s / 60) % 60)}:{pad(s % 60)}:{pad(f)}
    </span>
  );
}

export function HeroCarousel(props: Props) {
  const { slides, anchor } = props;
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const [userPlaying, setPlaying] = useState(true);
  const playing = userPlaying && !reduced;
  const [wordIndex, setWordIndex] = useState(0);
  const hovering = useRef(false);
  const touchX = useRef<number | null>(null);
  const words = props.animatedWords
    .split(/[.·|,]/)
    .map((w) => w.trim())
    .filter(Boolean);
  const count = slides.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (!playing || count < 2) return;
    const id = window.setInterval(() => {
      if (!hovering.current && !document.hidden) setIndex((i) => (i + 1) % count);
    }, Math.max(3, props.autoplaySeconds) * 1000);
    return () => window.clearInterval(id);
  }, [playing, count, props.autoplaySeconds]);

  useEffect(() => {
    if (words.length < 2 || reduced) return;
    const id = window.setInterval(() => setWordIndex((i) => (i + 1) % words.length), 2200);
    return () => window.clearInterval(id);
  }, [words.length, reduced]);

  if (!count) {
    return (
      <section id={anchor} className="relative flex min-h-[70svh] items-center bg-ink">
        <div className="container-cinema pt-24">
          <h1 className="display-title text-5xl text-white">MIDE MEDIA PRODUCTION</h1>
        </div>
      </section>
    );
  }

  const slide = slides[index]!;
  const primaryExternal = props.primaryUrl && !isInternalHref(props.primaryUrl);

  return (
    <section
      id={anchor}
      aria-roledescription="carousel"
      aria-label="Featured stories"
      className="grain relative isolate flex h-[100svh] min-h-[640px] items-end overflow-hidden bg-black"
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {/* Slides */}
      {slides.map((s, i) => {
        const active = i === index;
        return (
          <div
            key={s.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={!active}
            className={cn("absolute inset-0 -z-20 transition-opacity duration-[1600ms] ease-out", active ? "opacity-100" : "opacity-0")}
          >
            {s.image && (
              <div key={active ? `on-${index}` : "off"} className={cn("absolute inset-0", active && !reduced && "animate-kenburns")}>
                <SmartImage
                  src={s.image}
                  alt={s.imageAlt || ""}
                  fill
                  sizes="100vw"
                  preload={i === 0}
                  loading={i === 0 ? "eager" : "lazy"}
                  quality={75}
                  className="object-cover"
                />
              </div>
            )}
            {s.video && active && (
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src={s.video}
                poster={s.image || undefined}
                autoPlay={!reduced}
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}

      {/* Cinematic overlays */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/45 to-black/30" aria-hidden="true" />
      <div className="vignette absolute inset-0 -z-10" aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 -z-10 w-2/3 bg-gradient-to-r from-black/70 to-transparent" aria-hidden="true" />

      {/* Viewfinder HUD */}
      {props.showRec && (
        <div className="pointer-events-none absolute top-[calc(var(--header-h)+var(--announce-h,0px)+1.25rem)] right-5 hidden items-center gap-4 font-display text-[0.7rem] tracking-[0.25em] text-white/70 md:right-10 md:flex" aria-hidden="true">
          <span className="flex items-center gap-2">
            <span className="animate-rec h-2.5 w-2.5 rounded-full bg-red-500" /> REC
          </span>
          <Timecode />
          <span className="text-white/40">4K · 24FPS</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-6 hidden md:block md:inset-10" aria-hidden="true">
        <span className="absolute top-[calc(var(--header-h)+var(--announce-h,0px))] left-0 h-8 w-8 border-t border-l border-white/30" />
        <span className="absolute top-[calc(var(--header-h)+var(--announce-h,0px))] right-0 h-8 w-8 border-t border-r border-white/30" />
        <span className="absolute bottom-0 left-0 h-8 w-8 border-b border-l border-white/30" />
        <span className="absolute right-0 bottom-0 h-8 w-8 border-r border-b border-white/30" />
      </div>

      {/* Content */}
      <div className="container-cinema relative pb-28 md:pb-32">
        <div key={slide.id} className="max-w-4xl">
          {slide.eyebrow && (
            <p className="eyebrow animate-fade-up" style={{ animationDelay: "100ms" }}>
              {slide.eyebrow}
            </p>
          )}
          {index === 0 ? (
            <h1 className="display-title animate-fade-up mt-6 text-[clamp(2.3rem,min(6.4vw,8.2vh),6.2rem)] text-white" style={{ animationDelay: "200ms" }}>
              {slide.title}
            </h1>
          ) : (
            <p className="display-title animate-fade-up mt-6 text-[clamp(2.3rem,min(6.4vw,8.2vh),6.2rem)] text-white" style={{ animationDelay: "200ms" }}>
              {slide.title}
            </p>
          )}
          {slide.subtitle && (
            <p className="animate-fade-up mt-7 max-w-2xl text-base leading-relaxed text-white/75 md:text-lg" style={{ animationDelay: "380ms" }}>
              {slide.subtitle}
            </p>
          )}
        </div>

        <div className="animate-fade-up mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "520ms" }}>
          {props.primaryText &&
            (primaryExternal ? (
              <a href={props.primaryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                {props.primaryText}
              </a>
            ) : (
              <Link href={props.primaryUrl || "/portfolio"} className="btn btn-primary">
                {props.primaryText}
              </Link>
            ))}
          {props.secondaryText && (
            <a href={whatsappLink(props.whatsappNumber, props.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <WhatsAppIcon className="h-4 w-4" /> {props.secondaryText}
            </a>
          )}
        </div>

        {words.length > 0 && (
          <p className="mt-12 flex h-6 items-center gap-3 font-display text-xs tracking-[0.5em] text-white/55 md:text-sm" aria-label={props.animatedWords}>
            <span className="h-px w-10 bg-brand" aria-hidden="true" />
            <span aria-hidden="true" className="relative inline-block overflow-hidden">
              {reduced || words.length < 2 ? (
                props.animatedWords
              ) : (
                <span key={wordIndex} className="animate-fade-up inline-block text-white [animation-duration:0.5s]">
                  {words[wordIndex]}.
                </span>
              )}
            </span>
          </p>
        )}
      </div>

      {/* Controls */}
      {count > 1 && (
        <div className="absolute right-24 bottom-8 left-5 flex items-center justify-between gap-4 sm:right-5 md:right-10 md:bottom-10 md:left-auto md:justify-end md:gap-6">
          <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show slide ${i + 1}`}
                onClick={() => go(i)}
                className="group relative h-8 w-10 md:w-14"
              >
                <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded bg-white/25">
                  <span
                    className={cn("block h-full bg-brand transition-[width] ease-linear", i === index ? "w-full" : i < index ? "w-full opacity-60" : "w-0")}
                    style={{ transitionDuration: i === index && playing ? `${Math.max(3, props.autoplaySeconds)}s` : "300ms" }}
                  />
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-2 font-display text-xs tracking-[0.2em] whitespace-nowrap text-white/60 tabular-nums">
              <span className="text-white">{String(index + 1).padStart(2, "0")}</span> / {String(count).padStart(2, "0")}
            </span>
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous slide" className="hidden h-10 w-10 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-brand hover:text-brand sm:grid">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause slideshow" : "Play slideshow"} className="hidden h-10 w-10 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-brand hover:text-brand sm:grid">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Next slide" className="hidden h-10 w-10 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-brand hover:text-brand sm:grid">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Scroll cue */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex" aria-hidden="true">
        <span className="font-display text-[0.6rem] tracking-[0.4em] text-white/50">SCROLL</span>
        <span className="relative h-10 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-brand [animation:scroll-cue_1.8s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  );
}
