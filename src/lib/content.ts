import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { getAllSettings } from "./settings";
import { sanitizeCustomHtml, sanitizeRichText } from "./sanitize";
import { safeJson } from "./utils";
import type { PortfolioCategory, PortfolioProject, Section } from "@/db/schema";

export type ProjectCard = PortfolioProject & { category: PortfolioCategory | null };
export type SectionWithData = Section & { parsed: Record<string, unknown> };

/** Settings + chrome (nav, social, announcements) shared by every public page. */
export const getSiteChrome = cache(async () => {
  const [settings, nav, social, announcementRows] = await Promise.all([
    getAllSettings(),
    db.select().from(schema.navItems).where(eq(schema.navItems.visible, true)).orderBy(asc(schema.navItems.sortOrder)),
    db
      .select()
      .from(schema.socialLinks)
      .where(eq(schema.socialLinks.visible, true))
      .orderBy(asc(schema.socialLinks.sortOrder)),
    db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.active, true))
      .orderBy(asc(schema.announcements.sortOrder)),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const announcements = announcementRows.filter(
    (a) => (!a.startsAt || a.startsAt <= today) && (!a.endsAt || a.endsAt >= today),
  );
  return { settings, nav, social, announcements };
});

export type SiteChrome = Awaited<ReturnType<typeof getSiteChrome>>;

function withCategory(
  rows: Array<{ p: PortfolioProject; c: PortfolioCategory | null }>,
): ProjectCard[] {
  return rows.map(({ p, c }) => ({ ...p, category: c }));
}

export async function getCategories() {
  return db.select().from(schema.portfolioCategories).orderBy(asc(schema.portfolioCategories.sortOrder));
}

export async function getProjects(opts: { preview?: boolean; featuredOnly?: boolean } = {}) {
  const conds = [];
  if (!opts.preview) conds.push(eq(schema.portfolioProjects.status, "published"));
  if (opts.featuredOnly) conds.push(eq(schema.portfolioProjects.featured, true));
  const rows = await db
    .select({ p: schema.portfolioProjects, c: schema.portfolioCategories })
    .from(schema.portfolioProjects)
    .leftJoin(schema.portfolioCategories, eq(schema.portfolioProjects.categoryId, schema.portfolioCategories.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(schema.portfolioProjects.sortOrder), desc(schema.portfolioProjects.createdAt));
  return withCategory(rows);
}

export async function getProjectBySlug(slug: string, preview = false) {
  const conds = [eq(schema.portfolioProjects.slug, slug)];
  if (!preview) conds.push(eq(schema.portfolioProjects.status, "published"));
  const [row] = await db
    .select({ p: schema.portfolioProjects, c: schema.portfolioCategories })
    .from(schema.portfolioProjects)
    .leftJoin(schema.portfolioCategories, eq(schema.portfolioProjects.categoryId, schema.portfolioCategories.id))
    .where(and(...conds))
    .limit(1);
  if (!row) return null;
  const project = withCategory([row])[0]!;
  const media = await db
    .select()
    .from(schema.portfolioMedia)
    .where(eq(schema.portfolioMedia.projectId, project.id))
    .orderBy(asc(schema.portfolioMedia.sortOrder));
  const siblings = await db
    .select({ slug: schema.portfolioProjects.slug, title: schema.portfolioProjects.title, coverImage: schema.portfolioProjects.coverImage })
    .from(schema.portfolioProjects)
    .where(and(eq(schema.portfolioProjects.status, "published"), ne(schema.portfolioProjects.id, project.id)))
    .orderBy(asc(schema.portfolioProjects.sortOrder));
  return {
    project: { ...project, description: sanitizeRichText(project.description) },
    media,
    related: siblings.slice(0, 3),
  };
}

/** Everything the homepage needs, in one round of parallel queries. */
export async function getHomeData(preview = false) {
  const sectionConds = preview ? [] : [eq(schema.sections.status, "published"), eq(schema.sections.visible, true)];
  const [sections, slides, services, projects, categories, team, testimonials, why, instagram] = await Promise.all([
    db
      .select()
      .from(schema.sections)
      .where(sectionConds.length ? and(...sectionConds) : undefined)
      .orderBy(asc(schema.sections.sortOrder)),
    db
      .select()
      .from(schema.heroSlides)
      .where(preview ? undefined : eq(schema.heroSlides.published, true))
      .orderBy(asc(schema.heroSlides.sortOrder)),
    db.select().from(schema.services).where(eq(schema.services.enabled, true)).orderBy(asc(schema.services.sortOrder)),
    getProjects({ preview }),
    getCategories(),
    db
      .select()
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.published, true))
      .orderBy(asc(schema.teamMembers.sortOrder)),
    db
      .select()
      .from(schema.testimonials)
      .where(eq(schema.testimonials.status, "approved"))
      .orderBy(desc(schema.testimonials.featured), desc(schema.testimonials.createdAt)),
    db.select().from(schema.whyItems).where(eq(schema.whyItems.visible, true)).orderBy(asc(schema.whyItems.sortOrder)),
    db
      .select()
      .from(schema.instagramPosts)
      .where(eq(schema.instagramPosts.visible, true))
      .orderBy(asc(schema.instagramPosts.sortOrder)),
  ]);

  const visibleSections: SectionWithData[] = sections
    .filter((s) => preview || s.visible)
    .map((s) => {
      const parsed = safeJson<Record<string, unknown>>(s.data, {});
      if (typeof parsed.html === "string") parsed.html = sanitizeCustomHtml(parsed.html);
      return { ...s, body: sanitizeRichText(s.body), parsed };
    });

  return {
    sections: visibleSections,
    slides,
    services: services.map((s) => ({ ...s, description: sanitizeRichText(s.description) })),
    projects,
    categories,
    team: team.map((t) => ({ ...t, bio: sanitizeRichText(t.bio) })),
    // Public shape only — never send customer email/phone to the browser.
    testimonials: testimonials.map((t) => ({
      id: t.id,
      name: t.name,
      service: t.service,
      rating: t.rating,
      message: t.message,
      photo: t.photo,
      featured: t.featured,
    })),
    why,
    instagram,
  };
}

export type PublicTestimonial = HomeData["testimonials"][number];

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
