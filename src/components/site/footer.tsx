import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import { SocialIcon, WhatsAppIcon } from "@/components/ui/icon";
import { telLink, whatsappLink } from "@/lib/utils";
import type { SiteChrome } from "@/lib/content";

export function Footer({ chrome }: { chrome: SiteChrome }) {
  const { settings, nav, social } = chrome;
  const site = settings.site;
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-night" aria-labelledby="footer-heading">
      <div className="light-leak pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      {/* Oversized brand strip */}
      <div className="relative border-b border-white/[0.06]">
        <div className="container-cinema flex flex-col items-start justify-between gap-8 py-14 md:flex-row md:items-center md:py-16">
          <p className="display-title max-w-3xl text-[clamp(2rem,5vw,3.8rem)] text-white">
            Have a story to tell? <span className="text-brand">Let&apos;s film it.</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/#contact" className="btn btn-primary">
              Start your project
            </Link>
            <a
              href={whatsappLink(site.whatsappNumber, settings.whatsapp.defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="container-cinema relative grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Logo logoUrl={site.logo} alt={site.logoAlt} />
          <p className="mt-2 font-display text-xs tracking-[0.3em] text-white/50 uppercase">{site.tagline}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/60">{site.footerText}</p>
          {social.length > 0 && (
            <ul className="mt-7 flex gap-3" aria-label="Social media">
              {social.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.platform}${s.label ? ` — ${s.label}` : ""}`}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-white/70 transition hover:border-brand hover:bg-brand hover:text-black"
                  >
                    <SocialIcon platform={s.platform} className="h-[18px] w-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="lg:col-span-3" aria-label="Quick links">
          <h3 className="font-display text-xs font-semibold tracking-[0.3em] text-brand uppercase">Quick Links</h3>
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm lg:grid-cols-1">
            {nav.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className="link-underline text-white/70 capitalize hover:text-white">
                  {n.label.toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <h3 className="font-display text-xs font-semibold tracking-[0.3em] text-brand uppercase">Contact</h3>
          <ul className="mt-6 space-y-4 text-sm text-white/70">
            <li>
              <a href={telLink(site.phone)} className="flex items-center gap-3 hover:text-white">
                <Phone className="h-4 w-4 text-brand" aria-hidden="true" />
                {site.phone}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink(site.whatsappNumber, settings.whatsapp.defaultMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-white"
              >
                <WhatsAppIcon className="h-4 w-4 text-brand" />
                WhatsApp: {site.whatsappNumber}
              </a>
            </li>
            <li>
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white">
                <SocialIcon platform="instagram" className="h-4 w-4 text-brand" />
                Instagram: {site.instagramHandle}
              </a>
            </li>
            {site.email && (
              <li>
                <a href={`mailto:${site.email}`} className="flex items-center gap-3 hover:text-white">
                  <Mail className="h-4 w-4 text-brand" aria-hidden="true" />
                  {site.email}
                </a>
              </li>
            )}
            <li className="flex items-center gap-3">
              <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              {site.address || site.locationText}
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/[0.06]">
        <div className="container-cinema flex flex-col items-center gap-4 py-8 text-center text-xs text-white/45 md:flex-row md:justify-between md:text-left">
          <p>
            © {year} {site.copyright}
          </p>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-[0.8rem] text-white/70">
              Powered by{" "}
              <a href="tel:+2348067578112" className="font-semibold text-white hover:text-brand">
                Fodan Softnet Inc (08067578112)
              </a>
            </p>
            <Link
              href="/admin"
              rel="nofollow"
              className="mt-1.5 rounded px-1.5 py-0.5 text-[0.58rem] tracking-[0.3em] text-white/35 transition-colors hover:text-white/60 focus-visible:text-white"
            >
              BACKEND
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
