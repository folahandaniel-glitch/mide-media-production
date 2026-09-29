/**
 * Initial content. Everything here is editable/removable in the backend.
 * Sample portfolio projects and team profiles are flagged `isPlaceholder`
 * and labelled "Sample" on the public site — they are NOT real client work.
 * Stock imagery: Unsplash (free to use under the Unsplash License).
 */
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

const img = (id: string, w = 1920) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const SAMPLE_NOTE =
  "<p>This is a <strong>sample placeholder project</strong> used to demonstrate how portfolio work is presented. It is not a real MIDE MEDIA PRODUCTION project. Replace it with genuine work — title, story, photographs and video — from the backend.</p>";

export async function seedDatabase(db: LibSQLDatabase<typeof schema>) {
  /* Sections — homepage order */
  const builtIns: Array<Partial<typeof schema.sections.$inferInsert> & { key: string; type: string }> = [
    { key: "hero", type: "hero", label: "Hero carousel", anchor: "home" },
    {
      key: "intro",
      type: "intro",
      label: "Introduction / About",
      anchor: "about",
      eyebrow: "About MIDE MEDIA PRODUCTION",
      title: "WE TELL STORIES THROUGH THE LENS",
      subtitle: "Cinematography and visual storytelling, crafted with intention.",
      body:
        "<p>MIDE MEDIA PRODUCTION is a cinematography and media production company dedicated to one craft: turning real moments, ideas and experiences into visual stories worth watching again.</p><p>Every project begins with listening. We take time to understand the people, the purpose and the feeling behind the story — then we plan the shots, the light and the movement that will carry it. On set, we pay close attention to composition, detail and timing. In the edit, we shape the footage into a film that feels considered, honest and memorable.</p><p>Whether it is a wedding, a conference, a church programme, a brand campaign or a documentary, our goal is the same: professional camera work, thoughtful storytelling and a finished film you are proud to share.</p>",
      image: img("1516035069371-29a1b244cc32", 1400),
      imageAlt: "Close-up of a professional camera lens",
      buttonText: "LET'S CREATE SOMETHING GREAT",
      buttonUrl: "/#contact",
      data: JSON.stringify({
        imagePosition: "right",
        highlights: [
          { text: "Professional camera work" },
          { text: "Creative storytelling" },
          { text: "Attention to detail" },
          { text: "Cinematic composition" },
          { text: "High-quality production" },
          { text: "Client satisfaction at the centre" },
        ],
      }),
    },
    {
      key: "services",
      type: "services",
      label: "Services",
      anchor: "services",
      eyebrow: "What we do",
      title: "SERVICES",
      subtitle: "Cinematography at the core — shaped around your occasion, your brand and your story.",
      data: JSON.stringify({ limit: 24 }),
    },
    {
      key: "portfolio",
      type: "portfolio",
      label: "Featured portfolio",
      anchor: "portfolio",
      eyebrow: "Selected work",
      title: "OUR PORTFOLIO",
      subtitle: "Selected Visual Stories by MIDE MEDIA PRODUCTION",
      buttonText: "SEE ALL OUR WORK",
      buttonUrl: "/portfolio",
      data: JSON.stringify({ limit: 6 }),
    },
    {
      key: "why",
      type: "why",
      label: "Why choose us",
      anchor: "why-us",
      eyebrow: "Our approach",
      title: "WHY MIDE MEDIA PRODUCTION?",
      subtitle: "What you can expect from every project we take on.",
    },
    {
      key: "showcase",
      type: "showcase",
      label: "Cinematography showcase",
      anchor: "showcase",
      eyebrow: "The craft",
      title: "EVERY FRAME, INTENTIONALLY CRAFTED.",
      subtitle:
        "Light, movement, sound and timing — composed with care so your story feels as powerful on screen as it did in the moment.",
      image: img("1485846234645-a62644f84728"),
      imageAlt: "Clapperboard held up on location before a take",
      buttonText: "START YOUR PROJECT",
      buttonUrl: "/#contact",
    },
    {
      key: "team",
      type: "team",
      label: "Team",
      anchor: "team",
      eyebrow: "The people behind the camera",
      title: "MEET THE TEAM",
      subtitle: "The creative professionals who bring every production to life.",
      data: JSON.stringify({ limit: 12 }),
    },
    {
      key: "testimonials",
      type: "testimonials",
      label: "Testimonials",
      anchor: "testimonials",
      eyebrow: "Client voices",
      title: "WHAT OUR CLIENTS SAY",
      subtitle: "Honest words from the people we have worked with.",
      data: JSON.stringify({ limit: 12 }),
    },
    {
      key: "instagram",
      type: "instagram",
      label: "Instagram",
      anchor: "instagram",
      eyebrow: "@midemediaproduction",
      title: "FOLLOW OUR JOURNEY",
      subtitle: "Behind the scenes, recent shoots and fresh visual stories — straight from our Instagram.",
      buttonText: "VIEW US ON INSTAGRAM",
      buttonUrl: "https://www.instagram.com/midemediaproduction",
      data: JSON.stringify({ limit: 8 }),
    },
    {
      key: "feedback",
      type: "feedback",
      label: "Customer feedback CTA",
      anchor: "feedback",
      eyebrow: "Worked with us?",
      title: "SHARE YOUR EXPERIENCE",
      subtitle: "Your feedback helps us grow and helps future clients choose with confidence.",
      buttonText: "LEAVE A TESTIMONIAL",
      background: "gradient",
    },
    {
      key: "contact",
      type: "contact",
      label: "Contact / WhatsApp",
      anchor: "contact",
      eyebrow: "Book a project",
      title: "LET'S CREATE SOMETHING MEMORABLE",
      subtitle:
        "Tell us about your event, brand or idea. Send an enquiry below or chat with us directly on WhatsApp — we respond as quickly as we can.",
    },
  ];
  await db.insert(schema.sections).values(
    builtIns.map((s, i) => ({ builtIn: true, sortOrder: i, status: "published" as const, visible: true, ...s })),
  );

  /* Hero slides */
  await db.insert(schema.heroSlides).values([
    {
      eyebrow: "MIDE MEDIA PRODUCTION",
      title: "CINEMATIC STORIES. POWERFUL VISUALS.",
      subtitle:
        "We transform moments, ideas and experiences into compelling visual stories through professional cinematography and media production.",
      image: img("1601506521793-dc748fc80b67"),
      imageAlt: "Videographer filming with a stabilised cinema camera",
      sortOrder: 0,
    },
    {
      eyebrow: "WEDDINGS · EVENTS · CELEBRATIONS",
      title: "MOMENTS WORTH REMEMBERING, BEAUTIFULLY FILMED.",
      subtitle: "Honest emotion, elegant composition and a film you will want to watch again and again.",
      image: img("1519741497674-611481863552"),
      imageAlt: "Wedding couple holding hands",
      sortOrder: 1,
    },
    {
      eyebrow: "BRANDS · ORGANISATIONS · CREATORS",
      title: "VISUALS THAT MOVE PEOPLE TO ACT.",
      subtitle: "Corporate films, commercials and content crafted to communicate clearly and look exceptional.",
      image: img("1478720568477-152d9b164e26"),
      imageAlt: "Film projector casting a beam of light",
      sortOrder: 2,
    },
  ]);

  /* Services */
  const svc = (
    title: string,
    summary: string,
    icon: string,
    extra: Partial<typeof schema.services.$inferInsert> = {},
  ) => ({ title, summary, icon, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, ""), ...extra });
  const serviceRows = [
    svc(
      "Cinematography",
      "Professional cinematography designed to transform real moments, events, ideas and stories into compelling visual experiences.",
      "aperture",
      { highlighted: true, image: img("1542038784456-1ea8e935640e", 1400) },
    ),
    svc("Wedding Cinematography", "Elegant, emotional wedding films that preserve every vow, glance and celebration.", "heart", {
      whatsappMessage: "Hello MIDE MEDIA PRODUCTION, I would like to enquire about wedding cinematography.",
    }),
    svc("Event Cinematography", "Complete coverage of conferences, launches, birthdays, concerts and special occasions.", "sparkles"),
    svc("Corporate Video Production", "Company profiles, training films and executive messages that communicate with clarity.", "briefcase", {
      whatsappMessage: "Hello MIDE MEDIA PRODUCTION, I would like to discuss corporate video production.",
    }),
    svc("Documentary Production", "Research-led storytelling that captures real people, places and issues with depth.", "film"),
    svc("Music Video Production", "Bold, stylised visuals that match the rhythm, mood and identity of the music.", "music"),
    svc("Commercial Video Production", "Advertising films and product videos built to capture attention and drive action.", "megaphone"),
    svc("Brand Storytelling", "Films that reveal the people, purpose and values behind your brand.", "gem"),
    svc("Social Media Video Production", "Scroll-stopping short-form content formatted for Instagram, TikTok and YouTube.", "smartphone"),
    svc("Interview Production", "Well-lit, well-framed interviews with clean audio for documentaries and brand films.", "mic"),
    svc("Promotional Videos", "Energetic promos for events, launches, programmes and campaigns.", "play"),
    svc("Church and Ministry Coverage", "Respectful coverage of services, conferences, crusades and ministry programmes.", "church"),
    svc("Live Event Coverage", "Multi-camera event coverage with dependable crew and equipment.", "radio"),
    svc("Creative Content Production", "Concept-driven content for artists, creators and agencies with a distinctive vision.", "palette"),
  ];
  await db.insert(schema.services).values(serviceRows.map((s, i) => ({ ...s, sortOrder: i })));

  /* Portfolio categories */
  const categoryNames = ["Weddings", "Events", "Corporate", "Documentary", "Music", "Commercial", "Church", "Creative", "Other"];
  const cats = await db
    .insert(schema.portfolioCategories)
    .values(categoryNames.map((name, i) => ({ name, slug: name.toLowerCase(), sortOrder: i })))
    .returning();
  const catId = (name: string) => cats.find((c) => c.name === name)!.id;

  /* Sample portfolio projects (clearly marked placeholders) */
  const samples: Array<{ title: string; cat: string; type: string; cover: string; gallery: string[] }> = [
    {
      title: "Sample Wedding Film",
      cat: "Weddings",
      type: "Wedding film",
      cover: "1511285560929-80b456fea0bc",
      gallery: ["1519741497674-611481863552", "1465495976277-4387d4b0b4c6", "1520854221256-17451cc331bf"],
    },
    {
      title: "Sample Event Coverage",
      cat: "Events",
      type: "Event highlight film",
      cover: "1540575467063-178a50c2df87",
      gallery: ["1505373877841-8d25f7d46678", "1515169067868-5387ec356754", "1533174072545-7a4b6ad7a6c3"],
    },
    {
      title: "Sample Corporate Brand Film",
      cat: "Corporate",
      type: "Corporate video",
      cover: "1551836022-d5d88e9218df",
      gallery: ["1522202176988-66273c2fd55f", "1505373877841-8d25f7d46678"],
    },
    {
      title: "Sample Music Video",
      cat: "Music",
      type: "Music video",
      cover: "1493225457124-a3eb161ffa5f",
      gallery: ["1470229722913-7c0e2dbbafd3", "1501281668745-f7f57925c3b4", "1459749411175-04bf5292ceea"],
    },
    {
      title: "Sample Documentary",
      cat: "Documentary",
      type: "Short documentary",
      cover: "1500530855697-b586d89ba3ee",
      gallery: ["1492691527719-9d1e07e534b4", "1485846234645-a62644f84728"],
    },
    {
      title: "Sample Commercial Spot",
      cat: "Commercial",
      type: "Commercial",
      cover: "1502982720700-bfff97f2ecac",
      gallery: ["1574717024653-61fd2cf4d44d", "1585951237318-9ea5e175b891"],
    },
    {
      title: "Sample Ministry Coverage",
      cat: "Church",
      type: "Church programme coverage",
      cover: "1438232992991-995b7058bbb3",
      gallery: ["1506157786151-b8491531f063", "1459749411175-04bf5292ceea"],
    },
    {
      title: "Sample Creative Short",
      cat: "Creative",
      type: "Creative short film",
      cover: "1535016120720-40c646be5580",
      gallery: ["1489599849927-2ee91cede3ba", "1524712245354-2c4e5e7121c0"],
    },
  ];
  for (const [i, s] of samples.entries()) {
    const [p] = await db
      .insert(schema.portfolioProjects)
      .values({
        slug: s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: s.title,
        summary: "Sample placeholder project — replace with real work from the backend.",
        description: SAMPLE_NOTE,
        categoryId: catId(s.cat),
        coverImage: img(s.cover),
        coverAlt: `${s.type} — sample placeholder image`,
        projectType: s.type,
        featured: i < 6,
        status: "published",
        isPlaceholder: true,
        sortOrder: i,
      })
      .returning();
    await db.insert(schema.portfolioMedia).values(
      [s.cover, ...s.gallery].map((g, j) => ({
        projectId: p.id,
        url: img(g, 2000),
        alt: `${s.type} — sample placeholder image ${j + 1}`,
        sortOrder: j,
      })),
    );
  }

  /* Placeholder team profiles — names intentionally generic */
  const roles = ["Cinematographer", "Director", "Video Editor", "Camera Operator"];
  await db.insert(schema.teamMembers).values(
    roles.map((position, i) => ({
      name: "Team Member",
      position,
      bio: "<p>Placeholder profile. Add the real team member’s name, photograph and biography from the backend.</p>",
      skills: "",
      isPlaceholder: true,
      published: true,
      sortOrder: i,
    })),
  );

  /* Why choose us */
  await db.insert(schema.whyItems).values([
    { title: "CREATIVE VISION", text: "Every frame should communicate something meaningful.", icon: "eye", sortOrder: 0 },
    { title: "PROFESSIONAL PRODUCTION", text: "Attention to composition, lighting, movement and storytelling.", icon: "clapperboard", sortOrder: 1 },
    { title: "CLIENT FOCUSED", text: "We listen carefully to the client's vision and translate it into visual content.", icon: "handshake", sortOrder: 2 },
    { title: "VISUAL STORYTELLING", text: "We focus on creating visuals that people remember.", icon: "film", sortOrder: 3 },
  ]);

  /* Navigation */
  await db.insert(schema.navItems).values(
    [
      ["HOME", "/#home"],
      ["ABOUT", "/#about"],
      ["SERVICES", "/#services"],
      ["PORTFOLIO", "/portfolio"],
      ["TEAM", "/#team"],
      ["TESTIMONIALS", "/#testimonials"],
      ["CONTACT", "/#contact"],
    ].map(([label, href], i) => ({ label, href, sortOrder: i })),
  );

  /* Social — only the account supplied by the client */
  await db.insert(schema.socialLinks).values({
    platform: "instagram",
    label: "@midemediaproduction",
    url: "https://www.instagram.com/midemediaproduction",
    sortOrder: 0,
  });
}
