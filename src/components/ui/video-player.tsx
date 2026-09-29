"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { SmartImage } from "./smart-image";
import { cn, parseVideo } from "@/lib/utils";

/**
 * Click-to-play video. Nothing heavy (iframe / video bytes) loads until the
 * visitor presses play, which keeps pages fast and saves mobile data.
 */
export function VideoPlayer({
  url,
  poster,
  title,
  className,
  aspect = "aspect-video",
}: {
  url: string;
  poster?: string;
  title: string;
  className?: string;
  aspect?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const source = parseVideo(url);
  if (!source) return null;
  const thumb = poster || (source.kind === "youtube" ? source.thumb : "");

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl bg-black", aspect, className)}>
      {playing ? (
        source.kind === "file" ? (
          <video src={source.src} poster={thumb || undefined} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-contain">
            <track kind="captions" />
          </video>
        ) : (
          <iframe
            src={source.embed}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        )
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="absolute inset-0 h-full w-full cursor-pointer" aria-label={`Play video: ${title}`}>
          {thumb ? (
            <SmartImage src={thumb} alt="" fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover transition-transform duration-[1.2s] ease-[var(--ease-cinema)] group-hover:scale-105" />
          ) : (
            <span className="light-leak absolute inset-0 bg-charcoal" />
          )}
          <span className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/20" />
          <span className="absolute top-1/2 left-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-black shadow-[0_0_0_12px_rgba(255,122,26,0.18)] transition-transform duration-500 group-hover:scale-110 md:h-24 md:w-24">
            <Play className="ml-1 h-8 w-8 fill-current" aria-hidden="true" />
          </span>
          <span className="absolute bottom-5 left-5 font-display text-xs tracking-[0.3em] text-white/80 uppercase">Play film</span>
        </button>
      )}
    </div>
  );
}
