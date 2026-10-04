/**
 * One-time content update: replaces untouched stock placeholders with real
 * MIDE MEDIA PRODUCTION work taken from the public @midemediaproduction
 * Instagram posts, and adds the "ticker" and "How it works" sections.
 *
 * Safety rule: only rows that still hold the original stock (Unsplash) image or
 * are untouched sample projects are changed. Anything edited in the backend is kept.
 * Everything inserted here is ordinary content — fully editable and deletable in /admin.
 */
import { asc, eq, gt, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema";

type Db = LibSQLDatabase<typeof schema>;

const img = (name: string) => `/instagram/${name}.webp`;
const isStock = (url: string) => url.includes("images.unsplash.com");
const IG = "https://www.instagram.com/midemediaproduction";

const POSTS: Array<{ image: string; caption: string; path: string }> = [
  { image: "director-mide-cinema-camera", caption: "On set — behind the camera.", path: "p/DdQqBywDICN" },
  { image: "traditional-wedding-couple", caption: "#YemnuelExperience25 — traditional wedding.", path: "reel/DGebMpBBnBR" },
  { image: "interview-behind-the-scenes", caption: "Behind the scenes on an interview shoot.", path: "p/DdDvkhkjPCW" },
  { image: "wedding-couple-portrait", caption: "#TOBIWIN24 — wedding day.", path: "reel/DENK14hBpJX" },
  { image: "corporate-event-eko-hotel", caption: "A day at Eko Hotel with our German client — corporate event.", path: "reel/Dduop_uMyAu" },
  { image: "wedding-morning-preparation", caption: "#YemnuelExperience25 — wedding day preparation.", path: "reel/DGfBNiZh9gJ" },
  { image: "ileya-fiesta-livestream", caption: "Livestreaming the 2026 Ileya Fiesta.", path: "reel/DdNsE6QMpyC" },
  { image: "director-mide-portrait", caption: "Director Mide.", path: "p/DdKtBFgDIr-" },
  { image: "conference-stage-setup", caption: "Our setup at the Yes You Can Africa conference.", path: "reel/Dd909l5MHY9" },
  { image: "october-event-coverage", caption: "Welcome to a new month from all of us at MIDE MEDIA PRODUCTION.", path: "reel/Dd_mGaQMKxV" },
  { image: "brand-strategy-graphic", caption: "Don't let your brand get stuck.", path: "p/DdMw9kAMmAC" },
  { image: "client-communication-tips", caption: "5 things you should not do when talking to your client.", path: "reel/DdL1G0VsQ_3" },
];

const watch = (path: string) =>
  `<p><a href="${IG}/${path}/" target="_blank" rel="noopener noreferrer">Watch this on Instagram</a></p>`;

const PROJECTS: Array<{
  slug: string;
  title: string;
  category: string;
  type: string;
  summary: string;
  description: string;
  cover: string;
  coverAlt: string;
  gallery: string[];
  date: string;
  location?: string;
}> = [
  {
    slug: "yemnuel-experience-25",
    title: "The Yemnuel Experience ’25",
    category: "weddings",
    type: "Wedding film",
    summary: "A traditional wedding celebration, filmed by MIDE MEDIA.",
    description: `<p>Moments from #YemnuelExperience25 — the colour of the traditional ceremony and the quiet preparation before it.</p>${watch("reel/DGebMpBBnBR")}`,
    cover: "traditional-wedding-couple",
    coverAlt: "Couple in traditional Yoruba wedding attire sharing a quiet moment",
    gallery: ["traditional-wedding-couple", "wedding-morning-preparation"],
    date: "2025-02-24",
  },
  {
    slug: "tobiwin-24-wedding",
    title: "TobiWin ’24",
    category: "weddings",
    type: "Wedding film",
    summary: "A wedding day captured on the ground and from the air.",
    description: `<p>Highlights from #TOBIWIN24, including aerial drone coverage.</p>${watch("reel/DENK14hBpJX")}`,
    cover: "wedding-couple-portrait",
    coverAlt: "Bride and groom posing together on their wedding day",
    gallery: ["wedding-couple-portrait"],
    date: "2024-12-30",
  },
  {
    slug: "corporate-event-eko-hotel",
    title: "Corporate Event at Eko Hotel",
    category: "corporate",
    type: "Corporate event coverage",
    summary: "Event coverage for an international client at Eko Hotel.",
    description: `<p>A day at Eko Hotel covering a corporate event for our German client.</p>${watch("reel/Dduop_uMyAu")}`,
    cover: "corporate-event-eko-hotel",
    coverAlt: "MIDE MEDIA crew member working with a client at a corporate event",
    gallery: ["corporate-event-eko-hotel"],
    date: "2026-09-25",
    location: "Eko Hotel, Lagos",
  },
  {
    slug: "ileya-fiesta-2026-livestream",
    title: "Ileya Fiesta 2026 — Live Stream",
    category: "events",
    type: "Live streaming",
    summary: "Live streaming the 2026 Ileya Fiesta.",
    description: `<p>We livestreamed the 2026 Ileya Fiesta at De Williams Place.</p>${watch("reel/DdNsE6QMpyC")}`,
    cover: "ileya-fiesta-livestream",
    coverAlt: "Two men shaking hands at the Ileya Fiesta venue",
    gallery: ["ileya-fiesta-livestream"],
    date: "2026-09-12",
    location: "De Williams Place",
  },
  {
    slug: "yes-you-can-africa-conference",
    title: "Yes You Can Africa Conference",
    category: "events",
    type: "Conference production",
    summary: "Our production setup at the Yes You Can Africa conference.",
    description: `<p>A look at our setup at the Yes You Can Africa conference.</p>${watch("reel/Dd909l5MHY9")}`,
    cover: "conference-stage-setup",
    coverAlt: "Branded conference backdrop at the Yes You Can Africa event",
    gallery: ["conference-stage-setup", "october-event-coverage"],
    date: "2026-10-01",
  },
  {
    slug: "interview-production-behind-the-scenes",
    title: "Interview Production — Behind the Scenes",
    category: "creative",
    type: "Interview production",
    summary: "On set filming a sit-down interview.",
    description: `<p>Behind the scenes on an interview shoot — camera on a gimbal, working close with the guest.</p>${watch("p/DdDvkhkjPCW")}`,
    cover: "interview-behind-the-scenes",
    coverAlt: "Director Mide filming an interview with a camera on a gimbal",
    gallery: ["interview-behind-the-scenes", "director-mide-cinema-camera"],
    date: "2026-09-09",
  },
];

export async function applyInstagramContent(db: Db) {
  /* Hero slides — framed layout keeps these portrait photos sharp */
  const heroImages: Array<[string, string]> = [
    ["director-mide-cinema-camera", "Director Mide operating a cinema camera on a tripod"],
    ["traditional-wedding-couple", "Couple in traditional Yoruba wedding attire sharing a quiet moment"],
    ["interview-behind-the-scenes", "Director Mide filming an interview with a camera on a gimbal"],
  ];
  const slides = await db.select().from(schema.heroSlides).orderBy(asc(schema.heroSlides.sortOrder));
  let h = 0;
  for (const slide of slides) {
    if (!isStock(slide.image) || h >= heroImages.length) continue;
    const [name, alt] = heroImages[h++]!;
    await db.update(schema.heroSlides).set({ image: img(name), imageAlt: alt, layout: "framed" }).where(eq(schema.heroSlides.id, slide.id));
  }

  /* About image */
  const [intro] = await db.select().from(schema.sections).where(eq(schema.sections.key, "intro"));
  if (intro && isStock(intro.image)) {
    await db
      .update(schema.sections)
      .set({ image: img("director-mide-portrait"), imageAlt: "Director Mide of MIDE MEDIA PRODUCTION" })
      .where(eq(schema.sections.id, intro.id));
  }

  /* Showcase: drop the stock backdrop — the film strip of real work carries this section now */
  const [showcase] = await db.select().from(schema.sections).where(eq(schema.sections.key, "showcase"));
  if (showcase && isStock(showcase.image)) {
    await db.update(schema.sections).set({ image: "", imageAlt: "" }).where(eq(schema.sections.id, showcase.id));
  }

  /* Services: real image for the primary service + services shown on the Instagram profile */
  const services = await db.select().from(schema.services);
  const primary = services.find((s) => s.slug === "cinematography");
  if (primary && isStock(primary.image)) {
    await db.update(schema.services).set({ image: img("interview-behind-the-scenes") }).where(eq(schema.services.id, primary.id));
  }
  const maxOrder = Math.max(0, ...services.map((s) => s.sortOrder));
  const extra = [
    { slug: "livestreaming", title: "Livestreaming", icon: "radio", summary: "Reliable multi-camera live streams for events, conferences, church programmes and celebrations." },
    { slug: "podcast-production", title: "Podcast Production", icon: "mic", summary: "Video podcasts filmed and recorded with clean sound, good lighting and a polished look." },
    { slug: "live-recording", title: "Live Recording", icon: "music", summary: "Live music and ministration recordings captured with multiple cameras and quality audio." },
  ].filter((e) => !services.some((s) => s.slug === e.slug || s.title.toLowerCase() === e.title.toLowerCase()));
  if (extra.length) await db.insert(schema.services).values(extra.map((e, i) => ({ ...e, sortOrder: maxOrder + 1 + i })));

  /* Portfolio: swap untouched stock samples for real work */
  const projects = await db.select().from(schema.portfolioProjects);
  for (const p of projects) {
    if (p.isPlaceholder && isStock(p.coverImage)) await db.delete(schema.portfolioProjects).where(eq(schema.portfolioProjects.id, p.id));
  }
  const kept = projects.filter((p) => !(p.isPlaceholder && isStock(p.coverImage)));
  const cats = await db.select().from(schema.portfolioCategories);
  let order = 0;
  for (const p of PROJECTS) {
    if (kept.some((k) => k.slug === p.slug)) continue;
    const [row] = await db
      .insert(schema.portfolioProjects)
      .values({
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        description: p.description,
        categoryId: cats.find((c) => c.slug === p.category)?.id ?? null,
        coverImage: img(p.cover),
        coverAlt: p.coverAlt,
        projectType: p.type,
        projectDate: p.date,
        location: p.location ?? "",
        featured: true,
        status: "published",
        isPlaceholder: false,
        sortOrder: order++,
      })
      .returning();
    await db.insert(schema.portfolioMedia).values(p.gallery.map((g, i) => ({ projectId: row!.id, url: img(g), alt: `${p.title} — photo ${i + 1}`, sortOrder: i })));
  }
  // Keep any projects the admin created after the new ones.
  for (const k of kept) await db.update(schema.portfolioProjects).set({ sortOrder: order++ }).where(eq(schema.portfolioProjects.id, k.id));

  /* Instagram showcase */
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.instagramPosts);
  if (Number(n) === 0) {
    await db.insert(schema.instagramPosts).values(POSTS.map((p, i) => ({ image: img(p.image), caption: p.caption, postUrl: `${IG}/${p.path}/`, sortOrder: i })));
  }

  /* Team: give Mide his portrait if his profile has no photo yet */
  const team = await db.select().from(schema.teamMembers);
  const mide = team.find((t) => /\bmide\b/i.test(t.name) && !t.photo);
  if (mide) await db.update(schema.teamMembers).set({ photo: img("director-mide-portrait"), isPlaceholder: false }).where(eq(schema.teamMembers.id, mide.id));

  /* New homepage sections */
  const sections = await db.select().from(schema.sections).orderBy(asc(schema.sections.sortOrder));
  const insertAfter = async (afterKey: string, values: typeof schema.sections.$inferInsert) => {
    const anchor = sections.find((s) => s.key === afterKey);
    const at = anchor ? anchor.sortOrder + 1 : sections.length;
    if (anchor) {
      await db
        .update(schema.sections)
        .set({ sortOrder: sql`${schema.sections.sortOrder} + 1` })
        .where(gt(schema.sections.sortOrder, anchor.sortOrder));
      for (const s of sections) if (s.sortOrder > anchor.sortOrder) s.sortOrder += 1;
    }
    await db.insert(schema.sections).values({ ...values, sortOrder: at });
  };

  if (!sections.some((s) => s.type === "steps")) {
    await insertAfter("why", {
      type: "steps",
      label: "How it works",
      anchor: "how-it-works",
      eyebrow: "A simple process",
      title: "HOW IT WORKS",
      subtitle: "From your first message to the final film — four clear steps.",
      buttonText: "START YOUR PROJECT",
      buttonUrl: "/#contact",
      data: JSON.stringify({
        stepItems: [
          { title: "Tell us your story", text: "Send your date, location and what you have in mind — on WhatsApp or through the enquiry form." },
          { title: "We plan the shoot", text: "We agree the coverage, crew and style that fit your occasion and your budget." },
          { title: "We capture it", text: "Our crew films your day with professional cameras, sound and lighting." },
          { title: "You receive your film", text: "We edit, colour and deliver a polished film that is ready to share." },
        ],
      }),
    });
  }
  if (!sections.some((s) => s.type === "ticker")) {
    await insertAfter("hero", {
      type: "ticker",
      label: "Capabilities ticker",
      anchor: "what-we-cover",
      title: "What we cover",
      data: JSON.stringify({
        tickerItems: ["Weddings", "Livestreaming", "Corporate Events", "Documentary", "Podcast", "Live Recording", "Music Videos", "Conferences"].map((text) => ({ text })),
      }),
    });
  }
}
