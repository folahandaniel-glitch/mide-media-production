import Link from "next/link";
import { Check, MapPin, Phone, Plus } from "lucide-react";
import type { HomeData, SiteChrome, SectionWithData } from "@/lib/content";
import { splitLines } from "@/lib/settings-defaults";
import { cn, telLink, whatsappLink } from "@/lib/utils";
import { SmartImage } from "@/components/ui/smart-image";
import { VideoPlayer } from "@/components/ui/video-player";
import { Icon, InstagramIcon, WhatsAppIcon } from "@/components/ui/icon";
import { ContactForm } from "@/components/site/contact-form";
import { FeedbackButton } from "@/components/site/client-helpers";
import { EmptyState, SectionButton, SectionHeading, SectionShell, ViewfinderCorners, sectionAnchor } from "./shell";
import { HeroCarousel } from "./hero";
import { PortfolioGrid, type PortfolioCardData } from "./portfolio-grid";
import { ServicesList } from "./services";
import { TeamGrid } from "./team";
import { TestimonialsCarousel } from "./testimonials";
import { GalleryGrid } from "./gallery";

type Ctx = { data: HomeData; chrome: SiteChrome; preview: boolean };
type Item = Record<string, string>;

function limitOf(section: SectionWithData, fallback: number) {
  const n = Number(section.parsed.limit);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function items(section: SectionWithData, key: string): Item[] {
  const v = section.parsed[key];
  return Array.isArray(v) ? (v as Item[]) : [];
}

export function toCard(p: HomeData["projects"][number]): PortfolioCardData {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    coverImage: p.coverImage,
    coverAlt: p.coverAlt,
    projectType: p.projectType,
    isPlaceholder: p.isPlaceholder,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
  };
}

export function SectionRenderer({ ctx }: { ctx: Ctx }) {
  let n = 0;
  return (
    <>
      {ctx.data.sections.map((section) => {
        const index = section.type === "hero" || section.type === "ticker" ? undefined : ++n;
        return (
          <div key={section.id} className={cn(ctx.preview && (section.status === "draft" || !section.visible) && "relative outline-2 outline-dashed outline-brand/70")}>
            {ctx.preview && (section.status === "draft" || !section.visible) && (
              <span className="absolute top-3 left-3 z-30 rounded bg-brand px-2 py-1 font-display text-[0.65rem] font-bold tracking-widest text-black uppercase">
                {section.status === "draft" ? "Draft" : "Hidden"} section
              </span>
            )}
            <Section section={section} index={index} ctx={ctx} />
          </div>
        );
      })}
    </>
  );
}

function Section({ section, index, ctx }: { section: SectionWithData; index?: number; ctx: Ctx }) {
  const { data, chrome } = ctx;
  const s = chrome.settings;
  const light = section.background === "light";

  switch (section.type) {
    /* ------------------------------------------------------------------ */
    case "hero":
      return (
        <HeroCarousel
          slides={data.slides}
          anchor={sectionAnchor(section)}
          animatedWords={s.hero.animatedWords}
          primaryText={s.hero.primaryButtonText}
          primaryUrl={s.hero.primaryButtonUrl}
          secondaryText={s.hero.secondaryButtonText}
          whatsappNumber={s.site.whatsappNumber}
          whatsappMessage={s.whatsapp.heroMessage}
          autoplaySeconds={s.hero.autoplaySeconds}
          showRec={s.hero.showRecIndicator}
        />
      );

    /* ------------------------------------------------------------------ */
    case "intro": {
      const highlights = items(section, "highlights").filter((h) => h.text);
      const imageLeft = section.parsed.imagePosition === "left";
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <div className={cn("reveal", imageLeft && "lg:order-2")}>
              <p className="eyebrow">
                <span className="tabular-nums">{String(index).padStart(2, "0")}</span>
                {section.eyebrow}
              </p>
              <h2 id={`${sectionAnchor(section)}-title`} className={cn("display-title mt-5 text-[clamp(2.2rem,5vw,4.2rem)]", light ? "text-neutral-950" : "text-white")}>
                {section.title}
              </h2>
              {section.subtitle && <p className="mt-6 text-lg text-brand/90">{section.subtitle}</p>}
              {section.body && <div className={cn("prose-cinema mt-6", light && "prose-light")} dangerouslySetInnerHTML={{ __html: section.body }} />}
              {highlights.length > 0 && (
                <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                  {highlights.map((h) => (
                    <li key={h.text} className={cn("flex items-center gap-3 text-sm", light ? "text-neutral-800" : "text-white/85")}>
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {h.text}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-10">
                <SectionButton text={section.buttonText} url={section.buttonUrl} />
              </div>
            </div>
            {section.image && (
              <div className={cn("reveal relative", imageLeft && "lg:order-1")} style={{ ["--reveal-delay" as string]: "150ms" }}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
                  <SmartImage src={section.image} alt={section.imageAlt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <ViewfinderCorners className="inset-5" />
                </div>
                <div className="absolute -bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-black/80 p-5 backdrop-blur-xl md:-left-8 md:right-auto md:max-w-xs">
                  <p className="font-display text-xs tracking-[0.25em] text-brand uppercase">{s.site.tagline}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-white/75">
                    <MapPin className="h-4 w-4 text-brand" aria-hidden="true" /> {s.site.locationText}
                  </p>
                </div>
              </div>
            )}
          </div>
        </SectionShell>
      );
    }

    /* ------------------------------------------------------------------ */
    case "services": {
      const list = data.services.slice(0, limitOf(section, 24));
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} />
            {list.length ? (
              <ServicesList services={list} whatsappNumber={s.site.whatsappNumber} defaultMessage={s.whatsapp.defaultMessage} />
            ) : (
              <EmptyState message="No services have been added yet." />
            )}
          </div>
          {list.length > 3 && (
            <div className="mt-20 overflow-hidden border-y border-white/10 py-6" aria-hidden="true">
              <div className="animate-marquee flex w-max gap-10 whitespace-nowrap">
                {[...list, ...list].map((sv, i) => (
                  <span key={i} className="flex items-center gap-10 font-display text-3xl font-bold tracking-tight text-white/[0.12] uppercase md:text-5xl">
                    {sv.title}
                    <span className="h-3 w-3 rounded-full bg-brand/60" />
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionShell>
      );
    }

    /* ------------------------------------------------------------------ */
    case "portfolio": {
      const featured = data.projects.filter((p) => p.featured);
      const pool = featured.length ? featured : data.projects;
      const list = pool.slice(0, limitOf(section, 6)).map(toCard);
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading
              section={section}
              index={index}
              action={
                section.buttonText ? (
                  <div className="shrink-0">
                    <SectionButton text={section.buttonText} url={section.buttonUrl || "/portfolio"} variant="ghost" />
                  </div>
                ) : undefined
              }
            />
            {list.length ? (
              <PortfolioGrid projects={list} categories={data.categories} />
            ) : (
              <EmptyState message="No portfolio projects available yet." />
            )}
            <div className="reveal mt-14 flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center md:flex-row md:justify-between md:text-left">
              <p className="font-display text-xl text-white md:text-2xl">Want us to create something like this for you?</p>
              <a href={whatsappLink(s.site.whatsappNumber, s.whatsapp.portfolioMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon className="h-4 w-4" /> Chat with MIDE MEDIA PRODUCTION
              </a>
            </div>
          </div>
        </SectionShell>
      );
    }

    /* ------------------------------------------------------------------ */
    case "why":
      return (
        <SectionShell section={{ ...section, background: section.background === "dark" ? "charcoal" : section.background }} index={index}>
          <div className="container-cinema grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-32">
                <SectionHeading section={section} index={index} />
                {section.body && <div className="prose-cinema -mt-6" dangerouslySetInnerHTML={{ __html: section.body }} />}
                <div className="mt-8">
                  <SectionButton text={section.buttonText} url={section.buttonUrl} />
                </div>
              </div>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {data.why.map((w, i) => (
                <li
                  key={w.id}
                  className={cn("reveal group relative overflow-hidden rounded-3xl border border-white/10 bg-ink p-8 transition-colors duration-500 hover:border-brand/50", i % 2 === 1 && "sm:translate-y-10")}
                  style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}
                >
                  <span className="absolute -top-6 -right-2 font-display text-[7rem] leading-none font-bold text-white/[0.03] transition-colors duration-500 group-hover:text-brand/10" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/12 text-brand">
                    <Icon name={w.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-8 font-display text-lg font-semibold tracking-[0.08em] text-white">{w.title}</h3>
                  <p className="mt-3 leading-relaxed text-white/60">{w.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </SectionShell>
      );

    /* ------------------------------------------------------------------ */
    case "showcase":
      return (
        <SectionShell section={section} index={index} padded={false} className="grain">
          <div className={cn("relative flex items-center py-28", section.image ? "min-h-[80svh]" : "min-h-[56svh]")}>
            {section.image ? (
              <SmartImage src={section.image} alt={section.imageAlt} fill sizes="100vw" className="-z-20 object-cover" />
            ) : (
              <div className="light-leak absolute inset-0 -z-20" aria-hidden="true" />
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/55 to-black/15" aria-hidden="true" />
            <div className="vignette absolute inset-0 -z-10" aria-hidden="true" />
            {/* letterbox bars */}
            <div className="absolute inset-x-0 top-0 h-[8%] bg-black" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 h-[8%] bg-black" aria-hidden="true" />
            <div className="container-cinema grid items-center gap-12 lg:grid-cols-2">
              <div className="reveal">
                <p className="eyebrow">
                  <span className="tabular-nums">{String(index).padStart(2, "0")}</span>
                  {section.eyebrow}
                </p>
                <h2 id={`${sectionAnchor(section)}-title`} className="display-title mt-5 text-[clamp(2.4rem,6vw,5.2rem)] text-white">
                  {section.title}
                </h2>
                {section.subtitle && <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">{section.subtitle}</p>}
                {section.body && <div className="prose-cinema mt-4 max-w-xl" dangerouslySetInnerHTML={{ __html: section.body }} />}
                <div className="mt-10">
                  <SectionButton text={section.buttonText} url={section.buttonUrl} />
                </div>
              </div>
              {section.video && (
                <div className="reveal" style={{ ["--reveal-delay" as string]: "150ms" }}>
                  <VideoPlayer url={section.video} poster={section.image} title={section.title || "Showreel"} className="shadow-2xl ring-1 ring-white/10" />
                </div>
              )}
            </div>
          </div>
          {data.instagram.length >= 4 && <FilmStrip images={data.instagram.slice(0, 12).map((p) => p.image)} />}
        </SectionShell>
      );

    /* ------------------------------------------------------------------ */
    case "team": {
      const list = data.team.slice(0, limitOf(section, 12));
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} />
            {list.length ? <TeamGrid members={list} teamMessage={s.whatsapp.teamMessage} /> : <EmptyState message="No team members have been added yet." />}
          </div>
        </SectionShell>
      );
    }

    /* ------------------------------------------------------------------ */
    case "testimonials":
      return (
        <SectionShell section={{ ...section, background: section.background === "dark" ? "charcoal" : section.background }} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} />
            <TestimonialsCarousel items={data.testimonials.slice(0, limitOf(section, 12))} />
          </div>
        </SectionShell>
      );

    /* ------------------------------------------------------------------ */
    case "instagram": {
      const posts = data.instagram.slice(0, limitOf(section, 8));
      const url = section.buttonUrl || s.site.instagramUrl;
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <div className="reveal mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div>
                <p className="eyebrow">
                  <span className="tabular-nums">{String(index).padStart(2, "0")}</span>
                  {section.eyebrow || s.site.instagramHandle}
                </p>
                <h2 id={`${sectionAnchor(section)}-title`} className="display-title mt-5 text-[clamp(2.2rem,5.6vw,4.6rem)] text-white">
                  {section.title}
                </h2>
                {section.subtitle && <p className="mt-5 max-w-xl text-lg text-white/60">{section.subtitle}</p>}
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-primary shrink-0">
                <InstagramIcon className="h-4 w-4" /> {section.buttonText || "View us on Instagram"}
              </a>
            </div>
            {posts.length ? (
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                {posts.map((p, i) => (
                  <li key={p.id} className="reveal" style={{ ["--reveal-delay" as string]: `${(i % 4) * 70}ms` }}>
                    <a
                      href={p.postUrl || url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block aspect-square overflow-hidden rounded-xl bg-charcoal"
                      aria-label={p.caption ? `Instagram post: ${p.caption.slice(0, 80)}` : "View Instagram post"}
                    >
                      <SmartImage src={p.image} alt={p.caption.slice(0, 120)} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      <span className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 to-transparent p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <span className="line-clamp-3 text-xs text-white/90">{p.caption}</span>
                      </span>
                      <InstagramIcon className="absolute top-3 right-3 h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-night px-6 py-20 text-center"
              >
                <span className="light-leak absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-100" aria-hidden="true" />
                <InstagramIcon className="relative h-14 w-14 text-white" />
                <span className="relative mt-6 font-display text-3xl font-bold text-white md:text-5xl">{s.site.instagramHandle}</span>
                <span className="relative mt-3 text-white/65">See our latest work and behind-the-scenes moments on Instagram.</span>
              </a>
            )}
          </div>
        </SectionShell>
      );
    }

    /* ------------------------------------------------------------------ */
    case "feedback":
      return (
        <SectionShell section={section} index={index} className="!py-20 md:!py-24">
          <div className="container-cinema">
            <div className="reveal flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl">
                {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
                <h2 id={`${sectionAnchor(section)}-title`} className={cn("display-title mt-4 text-[clamp(2rem,4.6vw,3.6rem)]", light ? "text-neutral-950" : "text-white")}>
                  {section.title}
                </h2>
                {section.subtitle && <p className={cn("mt-4 text-lg", light ? "text-neutral-600" : "text-white/65")}>{section.subtitle}</p>}
              </div>
              <FeedbackButton>{section.buttonText || "Leave a testimonial"}</FeedbackButton>
            </div>
          </div>
        </SectionShell>
      );

    /* ------------------------------------------------------------------ */
    case "contact": {
      const f = s.forms;
      return (
        <SectionShell section={section} index={index}>
          <div className="light-leak pointer-events-none absolute inset-0 -z-10 opacity-50" aria-hidden="true" />
          <div className="container-cinema grid gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="reveal lg:col-span-5">
              <p className="eyebrow">
                <span className="tabular-nums">{String(index).padStart(2, "0")}</span>
                {section.eyebrow}
              </p>
              <h2 id={`${sectionAnchor(section)}-title`} className="display-title mt-5 text-[clamp(2.2rem,5vw,4.2rem)] text-white">
                {section.title}
              </h2>
              {section.subtitle && <p className="mt-6 text-lg leading-relaxed text-white/65">{section.subtitle}</p>}
              {section.body && <div className="prose-cinema mt-4" dangerouslySetInnerHTML={{ __html: section.body }} />}

              <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <p className="font-display text-lg font-bold tracking-[0.12em] text-white">{s.site.companyName}</p>
                <p className="mt-1 text-sm text-white/55">{s.site.tagline}</p>
                <dl className="mt-6 space-y-4 text-sm">
                  <div className="flex items-center gap-4">
                    <dt className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/12 text-brand">
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Phone</span>
                    </dt>
                    <dd>
                      <a href={telLink(s.site.phone)} className="text-white hover:text-brand">{s.site.phone}</a>
                    </dd>
                  </div>
                  <div className="flex items-center gap-4">
                    <dt className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/12 text-brand">
                      <WhatsAppIcon className="h-4 w-4" />
                      <span className="sr-only">WhatsApp</span>
                    </dt>
                    <dd>
                      <a href={whatsappLink(s.site.whatsappNumber, s.whatsapp.contactMessage)} target="_blank" rel="noopener noreferrer" className="text-white hover:text-brand">
                        {s.site.whatsappNumber}
                      </a>
                    </dd>
                  </div>
                  <div className="flex items-center gap-4">
                    <dt className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/12 text-brand">
                      <InstagramIcon className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </dt>
                    <dd>
                      <a href={s.site.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-brand">
                        {s.site.instagramHandle}
                      </a>
                    </dd>
                  </div>
                  <div className="flex items-center gap-4">
                    <dt className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/12 text-brand">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Location</span>
                    </dt>
                    <dd className="text-white">{s.site.address || s.site.locationText}</dd>
                  </div>
                </dl>
                <a
                  href={whatsappLink(s.site.whatsappNumber, s.whatsapp.contactMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp mt-8 w-full"
                >
                  <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
                </a>
              </div>
            </div>
            <div className="reveal lg:col-span-7" style={{ ["--reveal-delay" as string]: "120ms" }}>
              <ContactForm
                serviceOptions={splitLines(f.serviceOptions)}
                budgetOptions={splitLines(f.budgetOptions)}
                referralOptions={splitLines(f.referralOptions)}
                successMessage={f.contactSuccessMessage}
                whatsappNumber={s.site.whatsappNumber}
                whatsappMessage={s.whatsapp.contactMessage}
              />
            </div>
          </div>
        </SectionShell>
      );
    }

    /* ------------------------------------------------------------------ */
    case "ticker": {
      const words = items(section, "tickerItems").map((t) => t.text).filter(Boolean);
      if (!words.length) return null;
      return (
        <section id={sectionAnchor(section)} aria-label={section.title || "What we cover"} className="relative overflow-hidden border-y border-white/10 bg-night py-5">
          <ul className="sr-only">
            {words.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap" aria-hidden="true">
            {[...words, ...words, ...words, ...words].map((w, i) => (
              <span key={i} className="flex items-center gap-10 font-display text-sm font-semibold tracking-[0.3em] text-white/85 uppercase md:text-base">
                {w}
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand" fill="currentColor">
                  <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
                </svg>
              </span>
            ))}
          </div>
        </section>
      );
    }

    /* ------------------------------------------------------------------ */
    case "steps": {
      const steps = items(section, "stepItems").filter((x) => x.title);
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} align="center" />
            <ol className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <span className="absolute top-9 right-[12%] left-[12%] hidden h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent lg:block" aria-hidden="true" />
              {steps.map((st, i) => (
                <li
                  key={i}
                  className="reveal relative rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition-colors duration-500 hover:border-brand/50"
                  style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}
                >
                  <span className="relative grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full border border-brand/40 bg-ink font-display text-xl font-bold text-brand">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className={cn("mt-6 font-display text-lg font-semibold", light ? "text-neutral-900" : "text-white")}>{st.title}</h3>
                  <p className={cn("mt-3 text-[0.95rem] leading-relaxed", light ? "text-neutral-600" : "text-white/60")}>{st.text}</p>
                </li>
              ))}
            </ol>
            {section.buttonText && (
              <div className="reveal mt-12 flex flex-wrap justify-center gap-3">
                <SectionButton text={section.buttonText} url={section.buttonUrl || "/#contact"} />
                <a href={whatsappLink(s.site.whatsappNumber, s.whatsapp.defaultMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <WhatsAppIcon className="h-4 w-4" /> Chat on WhatsApp
                </a>
              </div>
            )}
          </div>
        </SectionShell>
      );
    }

    /* ======================= Custom section types ======================= */
    case "text":
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema max-w-4xl">
            <SectionHeading section={section} index={index} />
            {section.body && <div className={cn("reveal prose-cinema -mt-6", light && "prose-light")} dangerouslySetInnerHTML={{ __html: section.body }} />}
            {section.buttonText && (
              <div className="mt-10">
                <SectionButton text={section.buttonText} url={section.buttonUrl} />
              </div>
            )}
          </div>
        </SectionShell>
      );

    case "image":
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} />
            {section.image && (
              <figure className="reveal">
                <div className="relative aspect-[21/9] overflow-hidden rounded-3xl">
                  <SmartImage src={section.image} alt={section.imageAlt} fill sizes="100vw" className="object-cover" />
                </div>
                {section.body && <figcaption className={cn("prose-cinema mt-6 max-w-3xl", light && "prose-light")} dangerouslySetInnerHTML={{ __html: section.body }} />}
              </figure>
            )}
            {section.buttonText && (
              <div className="mt-10">
                <SectionButton text={section.buttonText} url={section.buttonUrl} />
              </div>
            )}
          </div>
        </SectionShell>
      );

    case "image_text": {
      const left = section.parsed.imagePosition === "left";
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className={cn("reveal", left && "lg:order-2")}>
              {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
              {section.title && (
                <h2 id={`${sectionAnchor(section)}-title`} className={cn("display-title mt-5 text-[clamp(2rem,4.6vw,3.8rem)]", light ? "text-neutral-950" : "text-white")}>
                  {section.title}
                </h2>
              )}
              {section.subtitle && <p className={cn("mt-5 text-lg", light ? "text-neutral-600" : "text-white/65")}>{section.subtitle}</p>}
              {section.body && <div className={cn("prose-cinema mt-5", light && "prose-light")} dangerouslySetInnerHTML={{ __html: section.body }} />}
              <div className="mt-9">
                <SectionButton text={section.buttonText} url={section.buttonUrl} />
              </div>
            </div>
            <div className={cn("reveal", left && "lg:order-1")}>
              {section.video ? (
                <VideoPlayer url={section.video} poster={section.image} title={section.title || "Video"} />
              ) : section.image ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                  <SmartImage src={section.image} alt={section.imageAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                  <ViewfinderCorners className="inset-5" />
                </div>
              ) : null}
            </div>
          </div>
        </SectionShell>
      );
    }

    case "video":
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} align="center" />
            {section.video ? (
              <div className="reveal mx-auto max-w-6xl">
                <VideoPlayer url={section.video} poster={section.image} title={section.title || "Video"} className="shadow-2xl ring-1 ring-white/10" />
              </div>
            ) : (
              <EmptyState message="No video has been added to this section yet." />
            )}
            {section.body && <div className={cn("prose-cinema mx-auto mt-10 max-w-3xl text-center", light && "prose-light")} dangerouslySetInnerHTML={{ __html: section.body }} />}
          </div>
        </SectionShell>
      );

    case "gallery": {
      const imgs = items(section, "galleryItems")
        .filter((g) => g.image)
        .map((g) => ({ url: g.image!, alt: g.alt || g.caption || section.title || "Gallery image", caption: g.caption }));
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} />
            {imgs.length ? <GalleryGrid images={imgs} title={section.title} /> : <EmptyState message="No images have been added to this gallery yet." />}
          </div>
        </SectionShell>
      );
    }

    case "faq": {
      const faqs = items(section, "faqItems").filter((q) => q.question);
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeading section={section} index={index} />
            </div>
            <div className="reveal lg:col-span-7">
              {faqs.map((q) => (
                <details key={q.question} className={cn("group border-b py-6", light ? "border-black/10" : "border-white/10")}>
                  <summary className={cn("flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-medium [&::-webkit-details-marker]:hidden", light ? "text-neutral-900" : "text-white")}>
                    {q.question}
                    <Plus className="h-5 w-5 shrink-0 text-brand transition-transform duration-300 group-open:rotate-45" aria-hidden="true" />
                  </summary>
                  <p className={cn("mt-4 leading-relaxed whitespace-pre-line", light ? "text-neutral-600" : "text-white/65")}>{q.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </SectionShell>
      );
    }

    case "cta":
    case "announcement":
      return (
        <SectionShell section={{ ...section, background: section.background === "dark" && section.type === "cta" ? "gradient" : section.background }} index={index} className="!py-20 md:!py-28">
          <div className="container-cinema">
            <div className={cn("reveal relative overflow-hidden rounded-[2rem] border p-8 md:p-14", light ? "border-black/10 bg-white" : "border-white/10 bg-black/40 backdrop-blur")}>
              {section.image && (
                <>
                  <SmartImage src={section.image} alt="" fill sizes="100vw" className="-z-10 object-cover opacity-30" />
                </>
              )}
              <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
                  {section.title && (
                    <h2 id={`${sectionAnchor(section)}-title`} className={cn("display-title mt-4 text-[clamp(1.9rem,4.2vw,3.4rem)]", light ? "text-neutral-950" : "text-white")}>
                      {section.title}
                    </h2>
                  )}
                  {section.subtitle && <p className={cn("mt-4 text-lg", light ? "text-neutral-600" : "text-white/70")}>{section.subtitle}</p>}
                  {section.body && <div className={cn("prose-cinema mt-3", light && "prose-light")} dangerouslySetInnerHTML={{ __html: section.body }} />}
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  {section.buttonText ? (
                    <SectionButton text={section.buttonText} url={section.buttonUrl || "/#contact"} />
                  ) : (
                    <Link href="/#contact" className="btn btn-primary">Start your project</Link>
                  )}
                  {section.type === "cta" && (
                    <a href={whatsappLink(s.site.whatsappNumber, s.whatsapp.defaultMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                      <WhatsAppIcon className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionShell>
      );

    case "stats": {
      const stats = items(section, "statItems").filter((x) => x.value);
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} align="center" />
            <dl className={cn("grid grid-cols-2 gap-px overflow-hidden rounded-3xl border md:grid-cols-4", light ? "border-black/10 bg-black/10" : "border-white/10 bg-white/10")}>
              {stats.map((st, i) => (
                <div key={i} className={cn("reveal flex flex-col-reverse items-center p-8 text-center md:p-12", light ? "bg-paper" : "bg-ink")}>
                  <dt className={cn("mt-3 text-sm tracking-wide uppercase", light ? "text-neutral-600" : "text-white/55")}>{st.label}</dt>
                  <dd className="font-display text-5xl font-bold text-brand md:text-6xl">{st.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </SectionShell>
      );
    }

    case "html":
      return (
        <SectionShell section={section} index={index}>
          <div className="container-cinema">
            <SectionHeading section={section} index={index} />
            {typeof section.parsed.html === "string" && section.parsed.html && (
              <div className={cn("prose-cinema", light && "prose-light")} dangerouslySetInnerHTML={{ __html: section.parsed.html }} />
            )}
          </div>
        </SectionShell>
      );

    default:
      return null;
  }
}

/** A moving strip of film frames showing recent work. Decorative — the same photos are in the Instagram section. */
function FilmStrip({ images }: { images: string[] }) {
  const holes = "h-3 bg-[radial-gradient(circle,rgba(255,255,255,0.55)_2.5px,transparent_3px)] [background-size:22px_12px]";
  return (
    <div className="relative -mt-4 overflow-hidden bg-black pb-10" aria-hidden="true">
      <div className="animate-marquee flex w-max [animation-duration:60s]">
        {[...images, ...images].map((src, i) => (
          <div key={i} className="w-40 shrink-0 bg-[#0d0d0e] px-1.5 md:w-52">
            <div className={holes} />
            <div className="relative my-1.5 aspect-[3/4] overflow-hidden rounded-sm">
              <SmartImage src={src} alt="" fill sizes="208px" className="object-cover" />
            </div>
            <div className={holes} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent" />
    </div>
  );
}
