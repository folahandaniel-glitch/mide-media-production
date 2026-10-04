import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdateFn(() => new Date());
const sortOrder = () => integer("sort_order").notNull().default(0);
const bool = (name: string, def: boolean) => integer(name, { mode: "boolean" }).notNull().default(def);

/* ---------------------------------- Admin --------------------------------- */

export const adminUsers = sqliteTable("admin_users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["super_admin", "editor"] }).notNull().default("editor"),
  active: bool("active", true),
  tokenVersion: integer("token_version").notNull().default(0),
  lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

/** Key/value JSON store for SiteSettings, WhatsAppSettings, SEOSettings, etc. */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default("{}"),
  updatedAt: updatedAt(),
});

/* --------------------------------- Content -------------------------------- */

export const heroSlides = sqliteTable("hero_slides", {
  id: id(),
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  image: text("image").notNull().default(""),
  imageAlt: text("image_alt").notNull().default(""),
  video: text("video").notNull().default(""),
  /** "full" = edge-to-edge background; "framed" = photo in a frame over a blurred backdrop. */
  layout: text("layout").notNull().default("full"),
  sortOrder: sortOrder(),
  published: bool("published", true),
  createdAt: createdAt(),
});

/** Homepage sections: built-in blocks and administrator-created custom sections. */
export const sections = sqliteTable(
  "sections",
  {
    id: id(),
    key: text("key"),
    builtIn: bool("built_in", false),
    type: text("type").notNull(),
    anchor: text("anchor").notNull().default(""),
    label: text("label").notNull().default(""),
    eyebrow: text("eyebrow").notNull().default(""),
    title: text("title").notNull().default(""),
    subtitle: text("subtitle").notNull().default(""),
    body: text("body").notNull().default(""),
    image: text("image").notNull().default(""),
    imageAlt: text("image_alt").notNull().default(""),
    video: text("video").notNull().default(""),
    buttonText: text("button_text").notNull().default(""),
    buttonUrl: text("button_url").notNull().default(""),
    background: text("background").notNull().default("dark"),
    data: text("data").notNull().default("{}"),
    visible: bool("visible", true),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("published"),
    sortOrder: sortOrder(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("sections_key_idx").on(t.key)],
);

export const services = sqliteTable("services", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("film"),
  image: text("image").notNull().default(""),
  video: text("video").notNull().default(""),
  whatsappMessage: text("whatsapp_message").notNull().default(""),
  highlighted: bool("highlighted", false),
  enabled: bool("enabled", true),
  sortOrder: sortOrder(),
  createdAt: createdAt(),
});

export const portfolioCategories = sqliteTable("portfolio_categories", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: sortOrder(),
  createdAt: createdAt(),
});

export const portfolioProjects = sqliteTable(
  "portfolio_projects",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    categoryId: text("category_id").references(() => portfolioCategories.id, { onDelete: "set null" }),
    coverImage: text("cover_image").notNull().default(""),
    coverAlt: text("cover_alt").notNull().default(""),
    videoUrl: text("video_url").notNull().default(""),
    youtubeUrl: text("youtube_url").notNull().default(""),
    vimeoUrl: text("vimeo_url").notNull().default(""),
    projectDate: text("project_date").notNull().default(""),
    client: text("client").notNull().default(""),
    location: text("location").notNull().default(""),
    projectType: text("project_type").notNull().default(""),
    featured: bool("featured", false),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    isPlaceholder: bool("is_placeholder", false),
    sortOrder: sortOrder(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("projects_status_idx").on(t.status)],
);

export const portfolioMedia = sqliteTable("portfolio_media", {
  id: id(),
  projectId: text("project_id")
    .notNull()
    .references(() => portfolioProjects.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  sortOrder: sortOrder(),
});

export const teamMembers = sqliteTable("team_members", {
  id: id(),
  name: text("name").notNull(),
  position: text("position").notNull().default(""),
  bio: text("bio").notNull().default(""),
  photo: text("photo").notNull().default(""),
  skills: text("skills").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  facebook: text("facebook").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  x: text("x").notNull().default(""),
  youtube: text("youtube").notNull().default(""),
  tiktok: text("tiktok").notNull().default(""),
  website: text("website").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  email: text("email").notNull().default(""),
  featured: bool("featured", false),
  published: bool("published", true),
  isPlaceholder: bool("is_placeholder", false),
  sortOrder: sortOrder(),
  createdAt: createdAt(),
});

/** Customer feedback submissions. Approved rows are the public testimonials. */
export const testimonials = sqliteTable(
  "testimonials",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    service: text("service").notNull().default(""),
    rating: integer("rating").notNull().default(5),
    message: text("message").notNull(),
    photo: text("photo").notNull().default(""),
    consent: bool("consent", false),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    featured: bool("featured", false),
    source: text("source").notNull().default("website"),
    sortOrder: sortOrder(),
    createdAt: createdAt(),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("testimonials_status_idx").on(t.status)],
);

export const enquiries = sqliteTable(
  "enquiries",
  {
    id: id(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    service: text("service").notNull().default(""),
    preferredDate: text("preferred_date").notNull().default(""),
    budget: text("budget").notNull().default(""),
    message: text("message").notNull(),
    referral: text("referral").notNull().default(""),
    project: text("project").notNull().default(""),
    status: text("status", { enum: ["new", "contacted", "in_progress", "completed", "closed"] })
      .notNull()
      .default("new"),
    isRead: bool("is_read", false),
    notes: text("notes").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("enquiries_status_idx").on(t.status)],
);

export const mediaAssets = sqliteTable("media_assets", {
  id: id(),
  url: text("url").notNull(),
  storageKey: text("storage_key").notNull().default(""),
  name: text("name").notNull(),
  kind: text("kind", { enum: ["image", "video", "file"] }).notNull().default("image"),
  mime: text("mime").notNull().default(""),
  size: integer("size").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  category: text("category").notNull().default("general"),
  alt: text("alt").notNull().default(""),
  featured: bool("featured", false),
  createdAt: createdAt(),
});

export const whyItems = sqliteTable("why_items", {
  id: id(),
  title: text("title").notNull(),
  text: text("text").notNull().default(""),
  icon: text("icon").notNull().default("aperture"),
  visible: bool("visible", true),
  sortOrder: sortOrder(),
});

export const instagramPosts = sqliteTable("instagram_posts", {
  id: id(),
  image: text("image").notNull(),
  caption: text("caption").notNull().default(""),
  postUrl: text("post_url").notNull().default(""),
  visible: bool("visible", true),
  sortOrder: sortOrder(),
  createdAt: createdAt(),
});

export const navItems = sqliteTable("navigation_items", {
  id: id(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  visible: bool("visible", true),
  sortOrder: sortOrder(),
});

export const socialLinks = sqliteTable("social_links", {
  id: id(),
  platform: text("platform").notNull(),
  label: text("label").notNull().default(""),
  url: text("url").notNull(),
  visible: bool("visible", true),
  sortOrder: sortOrder(),
});

export const announcements = sqliteTable("announcements", {
  id: id(),
  message: text("message").notNull(),
  linkText: text("link_text").notNull().default(""),
  linkUrl: text("link_url").notNull().default(""),
  active: bool("active", true),
  startsAt: text("starts_at").notNull().default(""),
  endsAt: text("ends_at").notNull().default(""),
  sortOrder: sortOrder(),
  createdAt: createdAt(),
});

/** Work assigned by a Super Admin to an administrator. */
export const adminTasks = sqliteTable(
  "admin_tasks",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    assigneeId: text("assignee_id").references(() => adminUsers.id, { onDelete: "set null" }),
    createdById: text("created_by_id").references(() => adminUsers.id, { onDelete: "set null" }),
    priority: text("priority", { enum: ["low", "normal", "high", "urgent"] }).notNull().default("normal"),
    status: text("status", { enum: ["todo", "in_progress", "review", "done"] }).notNull().default("todo"),
    dueDate: text("due_date").notNull().default(""),
    link: text("link").notNull().default(""),
    notes: text("notes").notNull().default(""),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("tasks_assignee_idx").on(t.assigneeId), index("tasks_status_idx").on(t.status)],
);

export type AdminTask = typeof adminTasks.$inferSelect;
export type Section = typeof sections.$inferSelect;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type Service = typeof services.$inferSelect;
export type PortfolioCategory = typeof portfolioCategories.$inferSelect;
export type PortfolioProject = typeof portfolioProjects.$inferSelect;
export type PortfolioMedia = typeof portfolioMedia.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type WhyItem = typeof whyItems.$inferSelect;
export type InstagramPost = typeof instagramPosts.$inferSelect;
export type NavItem = typeof navItems.$inferSelect;
export type SocialLink = typeof socialLinks.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
