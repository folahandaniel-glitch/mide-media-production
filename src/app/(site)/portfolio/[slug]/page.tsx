import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getProjectBySlug, getSiteChrome } from "@/lib/content";
import { JsonLd, siteUrl } from "@/lib/seo";
import { ProjectView } from "@/components/site/project-view";

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const rows = await db
      .select({ slug: schema.portfolioProjects.slug })
      .from(schema.portfolioProjects)
      .where(eq(schema.portfolioProjects.status, "published"));
    return rows.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProjectBySlug(slug);
  if (!data) return { title: "Project not found" };
  const p = data.project;
  const description = p.summary || `${p.title} — ${p.projectType || "a visual story"} by MIDE MEDIA PRODUCTION.`;
  return {
    title: p.title,
    description,
    alternates: { canonical: `/portfolio/${p.slug}` },
    openGraph: { title: p.title, description, images: p.coverImage ? [{ url: p.coverImage, alt: p.coverAlt || p.title }] : undefined },
    robots: p.isPlaceholder ? { index: false, follow: true } : undefined,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, chrome] = await Promise.all([getProjectBySlug(slug), getSiteChrome()]);
  if (!data) notFound();
  const url = await siteUrl();
  const p = data.project;
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: p.title,
          description: p.summary || undefined,
          image: p.coverImage || undefined,
          url: `${url}/portfolio/${p.slug}`,
          genre: p.category?.name,
          creator: { "@type": "Organization", name: chrome.settings.site.companyName, url },
        }}
      />
      <ProjectView data={data} chrome={chrome} />
    </>
  );
}
