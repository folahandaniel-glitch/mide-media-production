import type { Metadata } from "next";
import { getCategories, getProjects, getSiteChrome } from "@/lib/content";
import { PortfolioGrid } from "@/components/sections/portfolio-grid";
import { EmptyState } from "@/components/sections/shell";
import { toCard } from "@/components/sections/renderer";
import { WhatsAppIcon } from "@/components/ui/icon";
import { whatsappLink } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Selected visual stories by MIDE MEDIA PRODUCTION — weddings, events, corporate films, documentaries, music videos and more.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const [projects, categories, chrome] = await Promise.all([getProjects(), getCategories(), getSiteChrome()]);
  const s = chrome.settings;
  return (
    <>
      <section className="grain relative isolate overflow-hidden bg-night pt-44 pb-16 md:pt-52 md:pb-20">
        <div className="light-leak absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-cinema">
          <p className="eyebrow animate-fade-up">Selected work</p>
          <h1 className="display-title animate-fade-up mt-6 text-[clamp(3rem,9vw,8rem)] text-white" style={{ animationDelay: "120ms" }}>
            Our Portfolio
          </h1>
          <p className="animate-fade-up mt-6 max-w-2xl text-lg text-white/65" style={{ animationDelay: "240ms" }}>
            Selected Visual Stories by MIDE MEDIA PRODUCTION
          </p>
        </div>
      </section>

      <section className="bg-ink py-16 md:py-24" aria-label="Projects">
        <div className="container-cinema">
          {projects.length ? (
            <PortfolioGrid projects={projects.map(toCard)} categories={categories} />
          ) : (
            <EmptyState message="No portfolio projects available yet." />
          )}
        </div>
      </section>

      <section className="border-t border-white/10 bg-night py-20">
        <div className="container-cinema flex flex-col items-center gap-6 text-center">
          <p className="display-title max-w-3xl text-[clamp(2rem,4.5vw,3.5rem)] text-white">Want us to create something like this for you?</p>
          <a href={whatsappLink(s.site.whatsappNumber, s.whatsapp.portfolioMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
            <WhatsAppIcon className="h-4 w-4" /> Chat with MIDE MEDIA PRODUCTION
          </a>
        </div>
      </section>
    </>
  );
}
