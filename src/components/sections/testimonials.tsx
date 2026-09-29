"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { openFeedback } from "@/components/site/client-helpers";
import { initials } from "@/lib/utils";
import type { PublicTestimonial } from "@/lib/content";
import { EmptyState } from "./shell";

export function TestimonialsCarousel({ items }: { items: PublicTestimonial[] }) {
  const track = useRef<HTMLUListElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 360) + 20), behavior: "smooth" });
  };

  if (!items.length) {
    return (
      <EmptyState message="No testimonials have been published yet.">
        <button type="button" className="btn btn-primary" onClick={openFeedback}>
          Be the first to leave a testimonial
        </button>
      </EmptyState>
    );
  }

  return (
    <div className="reveal">
      <ul
        ref={track}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-5 pb-2 md:mx-0 md:px-0"
        aria-label="Client testimonials"
        tabIndex={0}
      >
        {items.map((t) => (
          <li key={t.id} className="w-[86%] shrink-0 snap-start sm:w-[60%] lg:w-[calc((100%-2.5rem)/3)]">
            <figure className="relative flex h-full flex-col rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-7 md:p-9">
              <Quote className="h-9 w-9 text-brand" aria-hidden="true" />
              <div className="mt-5 flex gap-1" aria-label={`Rated ${t.rating} out of 5`} role="img">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={n <= t.rating ? "h-4 w-4 fill-brand text-brand" : "h-4 w-4 text-white/20"} aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 text-[1.05rem] leading-relaxed text-white/80">“{t.message}”</blockquote>
              <figcaption className="mt-8 flex items-center gap-4 border-t border-white/10 pt-6">
                {t.photo ? (
                  <span className="relative h-12 w-12 overflow-hidden rounded-full">
                    <SmartImage src={t.photo} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/15 font-display text-sm font-semibold text-brand" aria-hidden="true">
                    {initials(t.name)}
                  </span>
                )}
                <span>
                  <span className="block font-display font-semibold text-white">{t.name}</span>
                  {t.service && <span className="block text-sm text-white/50">{t.service}</span>}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex items-center justify-between gap-4">
        <button type="button" className="btn btn-ghost" onClick={openFeedback}>
          Share your experience
        </button>
        {items.length > 1 && (
          <div className="flex gap-2">
            <button type="button" onClick={() => scroll(-1)} aria-label="Previous testimonials" className="grid h-12 w-12 place-items-center rounded-full border border-white/20 text-white transition hover:border-brand hover:text-brand">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Next testimonials" className="grid h-12 w-12 place-items-center rounded-full border border-white/20 text-white transition hover:border-brand hover:text-brand">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
