"use client";

import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import { SmartImage } from "@/components/ui/smart-image";
import { Modal } from "@/components/ui/modal";
import { VideoPlayer } from "@/components/ui/video-player";
import { useEnquire } from "@/components/site/client-helpers";
import { whatsappLink } from "@/lib/utils";
import type { Service } from "@/db/schema";
import { ViewfinderCorners } from "./shell";

export function ServicesList({
  services,
  whatsappNumber,
  defaultMessage,
}: {
  services: Service[];
  whatsappNumber: string;
  defaultMessage: string;
}) {
  const [open, setOpen] = useState<Service | null>(null);
  const enquire = useEnquire();
  const main = services.find((s) => s.highlighted) ?? null;
  const rest = services.filter((s) => s !== main);
  const waFor = (s: Service) =>
    whatsappLink(whatsappNumber, s.whatsappMessage || `${defaultMessage.replace(/\.$/, "")} — ${s.title}.`);

  return (
    <>
      {main && (
        <article className="reveal group relative mb-5 grid overflow-hidden rounded-3xl border border-white/10 bg-charcoal lg:grid-cols-2">
          <div className="relative min-h-[300px] overflow-hidden lg:min-h-[480px]">
            {main.image ? (
              <SmartImage src={main.image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-[1.6s] group-hover:scale-105" />
            ) : (
              <div className="light-leak absolute inset-0" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-charcoal/60 lg:to-charcoal" />
            <ViewfinderCorners className="inset-6" />
          </div>
          <div className="relative flex flex-col justify-center p-8 md:p-12">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-black">
              <Icon name={main.icon} className="h-7 w-7" />
            </span>
            <p className="mt-8 font-display text-xs tracking-[0.3em] text-brand uppercase">Primary service</p>
            <h3 className="display-title mt-3 text-4xl text-white md:text-5xl">{main.title}</h3>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/70">{main.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="btn btn-primary" onClick={() => enquire({ service: main.title })}>
                Book a project
              </button>
              <a href={waFor(main)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
              </a>
              {(main.description || main.video) && (
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(main)}>
                  Learn more
                </button>
              )}
            </div>
          </div>
        </article>
      )}

      <ul className="grid overflow-hidden rounded-3xl border border-white/10 bg-ink sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((s, i) => (
          <li key={s.id} className="reveal bg-ink [box-shadow:0_0_0_0.5px_rgba(255,255,255,0.1)]" style={{ ["--reveal-delay" as string]: `${(i % 3) * 90}ms` }}>
            <article className="group relative flex h-full flex-col p-7 transition-colors duration-500 hover:bg-charcoal md:p-9">
              <div className="flex items-start justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 text-brand transition-all duration-500 group-hover:border-brand group-hover:bg-brand group-hover:text-black">
                  <Icon name={s.icon} className="h-6 w-6" />
                </span>
                <span className="font-display text-xs text-white/30 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-7 font-display text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-3 flex-1 text-[0.95rem] leading-relaxed text-white/60">{s.summary}</p>
              <div className="mt-7 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => enquire({ service: s.title })}
                  className="inline-flex items-center gap-1.5 font-display text-xs font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:text-brand"
                >
                  Enquire <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <a
                  href={waFor(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ask about ${s.title} on WhatsApp`}
                  className="text-white/45 transition-colors hover:text-[#25d366]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
                {(s.description || s.video || s.image) && (
                  <button
                    type="button"
                    onClick={() => setOpen(s)}
                    aria-label={`More about ${s.title}`}
                    className="ml-auto grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition hover:border-brand hover:text-brand"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
              <span className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-brand transition-transform duration-700 group-hover:scale-x-100" />
            </article>
          </li>
        ))}
      </ul>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? "Service"} wide={!!open?.video}>
        {open && (
          <div className="px-6 pt-4 pb-8">
            {open.video ? (
              <VideoPlayer url={open.video} poster={open.image} title={open.title} className="mb-6" />
            ) : open.image ? (
              <div className="relative mb-6 aspect-video overflow-hidden rounded-xl">
                <SmartImage src={open.image} alt="" fill sizes="600px" className="object-cover" />
              </div>
            ) : null}
            <p className="text-lg text-white/75">{open.summary}</p>
            {open.description && <div className="prose-cinema mt-4" dangerouslySetInnerHTML={{ __html: open.description }} />}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const title = open.title;
                  setOpen(null);
                  window.setTimeout(() => enquire({ service: title }), 150);
                }}
              >
                Book this service
              </button>
              <a href={waFor(open)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon className="h-4 w-4" /> WhatsApp
              </a>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
