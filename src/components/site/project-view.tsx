import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Info } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { VideoPlayer } from "@/components/ui/video-player";
import { WhatsAppIcon } from "@/components/ui/icon";
import { GalleryGrid } from "@/components/sections/gallery";
import { ViewfinderCorners } from "@/components/sections/shell";
import { EnquireButton } from "./client-helpers";
import { formatDate, whatsappLink } from "@/lib/utils";
import type { SiteChrome } from "@/lib/content";
import type { getProjectBySlug } from "@/lib/content";

type Data = NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>;

export function ProjectView({ data, chrome, basePath = "/portfolio" }: { data: Data; chrome: SiteChrome; basePath?: string }) {
  const { project: p, media, related } = data;
  const s = chrome.settings;
  const video = p.videoUrl || p.youtubeUrl || p.vimeoUrl;
  const gallery = media.map((m) => ({ url: m.url, alt: m.alt || `${p.title} — photo` }));
  const waMessage = `${s.whatsapp.portfolioMessage.replace(/\.$/, "")} (Project: ${p.title}).`;
  const meta = [
    { label: "Client", value: p.client },
    { label: "Category", value: p.category?.name ?? "" },
    { label: "Date", value: p.projectDate ? formatDate(p.projectDate, { month: "long", year: "numeric" }) : "" },
    { label: "Location", value: p.location },
  ].filter((m) => m.value);

  return (
    <article>
      {/* Hero */}
      <header className="grain relative isolate flex min-h-[78svh] items-end overflow-hidden bg-black">
        {p.coverImage && <SmartImage src={p.coverImage} alt={p.coverAlt || p.title} fill preload sizes="100vw" className="animate-kenburns -z-20 object-cover" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-black/50 to-black/40" />
        <div className="vignette absolute inset-0 -z-10" />
        <div className="container-cinema pt-40 pb-16 md:pb-20">
          <Link href={basePath} className="inline-flex items-center gap-2 font-display text-xs tracking-[0.25em] text-white/70 uppercase hover:text-brand">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All projects
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {p.category && <span className="eyebrow">{p.category.name}</span>}
            {p.isPlaceholder && (
              <span className="rounded-full border border-white/25 px-3 py-1 font-display text-[0.62rem] tracking-[0.2em] text-white/80 uppercase">Sample project</span>
            )}
          </div>
          <h1 className="display-title animate-fade-up mt-5 max-w-5xl text-[clamp(2.6rem,7vw,6rem)] text-white">{p.title}</h1>
          {p.projectType && <p className="mt-5 text-lg text-white/70">{p.projectType}</p>}
        </div>
      </header>

      {/* Meta */}
      {meta.length > 0 && (
        <div className="border-y border-white/10 bg-night">
          <dl className="container-cinema grid grid-cols-2 gap-px md:grid-cols-4">
            {meta.map((m) => (
              <div key={m.label} className="py-7">
                <dt className="font-display text-[0.68rem] tracking-[0.3em] text-brand uppercase">{m.label}</dt>
                <dd className="mt-2 text-white">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="container-cinema py-20 md:py-28">
        {p.isPlaceholder && (
          <div className="mb-12 flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-5 text-sm text-white/80" role="note">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            This is a sample placeholder used to preview the portfolio layout. It is not a real MIDE MEDIA PRODUCTION project.
          </div>
        )}

        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="eyebrow">Project description</h2>
            {p.summary && <p className="mt-6 font-display text-2xl leading-snug text-white md:text-3xl">{p.summary}</p>}
            {p.description && <div className="prose-cinema mt-8" dangerouslySetInnerHTML={{ __html: p.description }} />}
          </div>
          <aside className="lg:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 lg:sticky lg:top-32">
              <p className="font-display text-2xl leading-tight text-white">Want us to create something like this for you?</p>
              <p className="mt-3 text-white/60">Tell us about your project and we’ll get back to you quickly.</p>
              <div className="mt-7 grid gap-3">
                <a href={whatsappLink(s.site.whatsappNumber, waMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
                  <WhatsAppIcon className="h-4 w-4" /> Chat with MIDE MEDIA PRODUCTION
                </a>
                <EnquireButton project={p.title} service={p.category?.name} className="btn btn-ghost w-full">
                  Enquire about this project
                </EnquireButton>
              </div>
            </div>
          </aside>
        </div>

        {video && (
          <section className="mt-24" aria-labelledby="video-heading">
            <h2 id="video-heading" className="eyebrow">Video</h2>
            <div className="relative mt-8">
              <VideoPlayer url={video} poster={p.coverImage} title={p.title} aspect="aspect-video" className="shadow-2xl ring-1 ring-white/10" />
              <ViewfinderCorners className="-inset-3 hidden md:block" />
            </div>
          </section>
        )}

        {gallery.length > 0 && (
          <section className="mt-24" aria-labelledby="gallery-heading">
            <div className="mb-8 flex items-end justify-between">
              <h2 id="gallery-heading" className="eyebrow">Photo gallery</h2>
              <span className="font-display text-xs tracking-[0.2em] text-white/50">{gallery.length} images</span>
            </div>
            <GalleryGrid
              images={gallery}
              title={p.title}
              footer={
                <EnquireButton project={p.title} service={p.category?.name} className="btn btn-primary !min-h-10 !py-2">
                  Enquire about this project
                </EnquireButton>
              }
            />
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section className="border-t border-white/10 bg-night py-20" aria-labelledby="more-heading">
          <div className="container-cinema">
            <h2 id="more-heading" className="display-title text-3xl text-white md:text-4xl">More stories</h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`${basePath}/${r.slug}`} className="group relative block aspect-[16/10] overflow-hidden rounded-2xl bg-charcoal">
                    {r.coverImage && (
                      <SmartImage src={r.coverImage} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                    )}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                      <span className="font-display text-lg font-semibold text-white">{r.title}</span>
                      <ArrowUpRight className="h-5 w-5 text-brand transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </article>
  );
}
