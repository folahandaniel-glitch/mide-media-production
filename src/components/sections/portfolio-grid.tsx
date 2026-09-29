"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { cn } from "@/lib/utils";

export type PortfolioCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string;
  coverAlt: string;
  projectType: string;
  isPlaceholder: boolean;
  category: { name: string; slug: string } | null;
};

const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

export function PortfolioGrid({
  projects,
  categories,
  showFilters = true,
  hrefPrefix = "/portfolio",
}: {
  projects: PortfolioCardData[];
  categories: { name: string; slug: string }[];
  showFilters?: boolean;
  hrefPrefix?: string;
}) {
  const [filter, setFilter] = useState("all");
  const usedCats = useMemo(() => {
    const used = new Set(projects.map((p) => p.category?.slug).filter(Boolean));
    return categories.filter((c) => used.has(c.slug));
  }, [projects, categories]);

  const visible = filter === "all" ? projects : projects.filter((p) => p.category?.slug === filter);

  return (
    <div>
      {showFilters && usedCats.length > 1 && (
        <div className="reveal no-scrollbar -mx-5 mb-10 overflow-x-auto px-5 md:mx-0 md:px-0">
          <div role="tablist" aria-label="Filter portfolio by category" className="flex w-max gap-2">
            {[{ name: "All", slug: "all" }, ...usedCats].map((c) => (
              <button
                key={c.slug}
                type="button"
                role="tab"
                aria-selected={filter === c.slug}
                onClick={() => setFilter(c.slug)}
                className={cn(
                  "rounded-full border px-5 py-2.5 font-display text-[0.7rem] font-semibold tracking-[0.2em] uppercase transition-all duration-300",
                  filter === c.slug
                    ? "border-brand bg-brand text-black"
                    : "border-white/15 text-white/70 hover:border-white/40 hover:text-white",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-center text-white/55">No projects in this category yet.</p>
      ) : (
        <ul key={filter} className="grid gap-4 md:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          {visible.map((p, i) => (
            <li key={p.id} className={cn("animate-fade-up", SPANS[i % 4])} style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
              <ProjectCard project={p} href={`${hrefPrefix}/${p.slug}`} priority={i < 2} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProjectCard({ project: p, href, priority }: { project: PortfolioCardData; href: string; priority?: boolean }) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-charcoal md:aspect-[16/11] lg:aspect-auto lg:h-[clamp(320px,33vw,500px)]"
    >
      {p.coverImage ? (
        <SmartImage
          src={p.coverImage}
          alt={p.coverAlt || p.title}
          fill
          sizes="(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw"
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-cinema)] group-hover:scale-[1.07]"
        />
      ) : (
        <div className="light-leak absolute inset-0" aria-hidden="true" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent transition-opacity duration-700 group-hover:opacity-90" />
      <div className="absolute inset-0 bg-brand/0 mix-blend-multiply transition-colors duration-700 group-hover:bg-brand/10" />

      <div className="absolute top-4 left-4 flex flex-wrap gap-2">
        {p.category && (
          <span className="rounded-full bg-black/55 px-3 py-1 font-display text-[0.62rem] font-semibold tracking-[0.2em] text-white uppercase backdrop-blur">
            {p.category.name}
          </span>
        )}
        {p.isPlaceholder && (
          <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 font-display text-[0.62rem] font-semibold tracking-[0.2em] text-white/85 uppercase backdrop-blur">
            Sample
          </span>
        )}
      </div>

      <span className="absolute top-4 right-4 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-brand text-black opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:opacity-100">
        <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
        {p.projectType && <p className="font-display text-[0.68rem] tracking-[0.25em] text-brand uppercase">{p.projectType}</p>}
        <h3 className="mt-2 font-display text-xl font-semibold text-white md:text-2xl">{p.title}</h3>
        {p.summary && (
          <p className="mt-2 line-clamp-2 max-w-lg text-sm text-white/65 transition-all duration-500 md:max-h-0 md:opacity-0 md:group-hover:max-h-16 md:group-hover:opacity-100">
            {p.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
