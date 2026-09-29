"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Modal } from "@/components/ui/modal";
import { SocialIcon, WhatsAppIcon } from "@/components/ui/icon";
import { ApertureMark } from "@/components/site/logo";
import { cn, whatsappLink } from "@/lib/utils";
import type { TeamMember } from "@/db/schema";

const SOCIALS = ["instagram", "facebook", "linkedin", "x", "youtube", "tiktok", "website"] as const;

export function TeamGrid({ members, teamMessage }: { members: TeamMember[]; teamMessage: string }) {
  const [open, setOpen] = useState<TeamMember | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {members.map((m, i) => (
          <li key={m.id} className="reveal" style={{ ["--reveal-delay" as string]: `${(i % 4) * 90}ms` }}>
            <button
              type="button"
              onClick={() => setOpen(m)}
              className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl bg-charcoal text-left"
              aria-label={`View profile: ${m.name}${m.position ? `, ${m.position}` : ""}`}
            >
              {m.photo ? (
                <SmartImage
                  src={m.photo}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover grayscale transition-all duration-[1.2s] ease-[var(--ease-cinema)] group-hover:scale-105 group-hover:grayscale-0"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-graphite to-charcoal">
                  <svg viewBox="0 0 100 120" className="h-3/5 text-white/[0.07]" aria-hidden="true">
                    <circle cx="50" cy="38" r="22" fill="currentColor" />
                    <path d="M8 120c0-26 19-44 42-44s42 18 42 44Z" fill="currentColor" />
                  </svg>
                  <ApertureMark className="absolute top-5 right-5 h-7 w-7 text-white/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
              {m.isPlaceholder && (
                <span className="absolute top-3 left-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-1 font-display text-[0.58rem] tracking-[0.2em] text-white/75 uppercase backdrop-blur">
                  Profile coming soon
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <p className="font-display text-base font-semibold text-white md:text-xl">{m.name}</p>
                {m.position && <p className="mt-1 font-display text-[0.62rem] tracking-[0.22em] text-brand uppercase md:text-xs">{m.position}</p>}
              </div>
              <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-brand transition-transform duration-700 group-hover:scale-x-100" />
            </button>
          </li>
        ))}
      </ul>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.name ?? "Team member"} wide hideTitle>
        {open && (
          <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="relative aspect-[4/5] bg-charcoal md:aspect-auto md:min-h-[520px]">
              {open.photo ? (
                <SmartImage src={open.photo} alt={`${open.name}${open.position ? `, ${open.position}` : ""}`} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
              ) : (
                <div className="light-leak absolute inset-0 flex items-center justify-center">
                  <ApertureMark className="h-20 w-20 text-white/25" />
                </div>
              )}
            </div>
            <div className="p-7 pt-10 md:p-10">
              {open.position && <p className="eyebrow">{open.position}</p>}
              <h3 className="display-title mt-4 text-4xl text-white">{open.name}</h3>
              {open.bio && <div className="prose-cinema mt-6" dangerouslySetInnerHTML={{ __html: open.bio }} />}
              {open.skills && (
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Skills">
                  {open.skills
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((s) => (
                      <li key={s} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75">
                        {s}
                      </li>
                    ))}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {open.whatsapp && (
                  <a href={whatsappLink(open.whatsapp, teamMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp !min-h-11">
                    <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                  </a>
                )}
                {open.email && (
                  <a href={`mailto:${open.email}`} className="btn btn-ghost !min-h-11">
                    <Mail className="h-4 w-4" aria-hidden="true" /> Email
                  </a>
                )}
                {SOCIALS.filter((k) => open[k]).map((k) => (
                  <a
                    key={k}
                    href={open[k]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${open.name} on ${k}`}
                    className={cn("grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white/70 transition hover:border-brand hover:text-brand")}
                  >
                    <SocialIcon platform={k} className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
