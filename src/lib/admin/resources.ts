/**
 * Declarative definitions for every CMS-managed collection.
 * Drives the admin list/edit screens (client) and validation (server),
 * so it must stay free of server-only imports.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "select"
  | "relation"
  | "image"
  | "video"
  | "url"
  | "email"
  | "date"
  | "tags"
  | "gallery"
  | "repeater"
  | "icon";

export type Option = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  help?: string;
  placeholder?: string;
  options?: Option[];
  relation?: string;
  default?: unknown;
  /** Only show (and save) this field when another field has one of these values. */
  showIf?: { field: string; in: string[] };
  half?: boolean;
  subfields?: Field[];
  /** Stored inside the JSON `data` column instead of a real column. */
  inData?: boolean;
  /** Field is read-only when this boolean column is true on the record (e.g. built-in sections). */
  lockedBy?: string;
  /** Auto-generate from another field when left empty. */
  slugFrom?: string;
  min?: number;
};

export type Column = {
  field: string;
  label: string;
  kind?: "image" | "badge" | "bool" | "date" | "stars" | "text" | "relation";
};

export type Row = Record<string, unknown> & { id: string };

export type QuickAction = {
  label: string;
  patch: Record<string, unknown>;
  when?: (row: Row) => boolean;
  tone?: "success" | "danger" | "default";
};

export type Resource = {
  key: string;
  label: string;
  singular: string;
  description?: string;
  fields: Field[];
  columns: Column[];
  titleField: string;
  sortable?: boolean;
  orderBy: "sort" | "newest";
  searchFields?: string[];
  filter?: { field: string; label: string; options: Option[] };
  toggle?: { field: string; on: string; off: string };
  quickActions?: QuickAction[];
  canCreate?: boolean;
  canDelete?: (row: Row) => boolean;
  deleteBlockedReason?: string;
  viewPath?: (row: Row) => string | null;
  emptyText?: string;
};

export const ICON_OPTIONS: Option[] = [
  "film",
  "camera",
  "video",
  "clapperboard",
  "aperture",
  "heart",
  "briefcase",
  "mic",
  "music",
  "church",
  "users",
  "sparkles",
  "megaphone",
  "radio",
  "star",
  "eye",
  "lightbulb",
  "target",
  "palette",
  "play",
  "gem",
  "handshake",
  "globe",
  "graduation-cap",
  "building",
  "smartphone",
  "scissors",
  "sun",
].map((v) => ({ value: v, label: v }));

const statusOptions: Option[] = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

export const BUILT_IN_SECTION_TYPES: Option[] = [
  { value: "hero", label: "Hero carousel" },
  { value: "intro", label: "Introduction / About" },
  { value: "services", label: "Services" },
  { value: "portfolio", label: "Featured portfolio" },
  { value: "why", label: "Why choose us" },
  { value: "showcase", label: "Cinematography showcase" },
  { value: "team", label: "Team" },
  { value: "testimonials", label: "Testimonials" },
  { value: "instagram", label: "Instagram" },
  { value: "feedback", label: "Customer feedback CTA" },
  { value: "contact", label: "Contact / WhatsApp" },
];

export const CUSTOM_SECTION_TYPES: Option[] = [
  { value: "text", label: "Text section" },
  { value: "image", label: "Image section" },
  { value: "image_text", label: "Image + text" },
  { value: "video", label: "Video section" },
  { value: "gallery", label: "Gallery" },
  { value: "faq", label: "FAQ" },
  { value: "cta", label: "Contact CTA" },
  { value: "stats", label: "Statistics" },
  { value: "steps", label: "Process / How it works (numbered steps)" },
  { value: "ticker", label: "Scrolling ticker (keywords strip)" },
  { value: "announcement", label: "Announcement" },
  { value: "html", label: "Custom HTML (sanitised)" },
  { value: "portfolio", label: "Portfolio grid" },
  { value: "services", label: "Services list" },
  { value: "team", label: "Team grid" },
  { value: "testimonials", label: "Testimonials carousel" },
];

const ALL_SECTION_TYPES: Option[] = [
  ...BUILT_IN_SECTION_TYPES,
  ...CUSTOM_SECTION_TYPES.filter((c) => !BUILT_IN_SECTION_TYPES.some((b) => b.value === c.value)),
];

const bodyTypes = [
  "intro",
  "services",
  "portfolio",
  "why",
  "showcase",
  "team",
  "testimonials",
  "instagram",
  "feedback",
  "contact",
  "text",
  "image_text",
  "video",
  "cta",
  "announcement",
  "image",
  "gallery",
  "faq",
  "stats",
];

export const resources = {
  slides: {
    key: "slides",
    label: "Hero Carousel",
    singular: "Slide",
    description: "Full-screen slides at the very top of the homepage.",
    titleField: "title",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "published", on: "Published", off: "Hidden" },
    columns: [
      { field: "image", label: "", kind: "image" },
      { field: "title", label: "Heading" },
      { field: "eyebrow", label: "Eyebrow" },
      { field: "published", label: "Status", kind: "bool" },
    ],
    fields: [
      { name: "eyebrow", label: "Eyebrow (small text above heading)", type: "text", max: 120 },
      { name: "title", label: "Heading", type: "text", required: true, max: 160 },
      { name: "subtitle", label: "Supporting text", type: "textarea", max: 500 },
      { name: "image", label: "Background image", type: "image", help: "Landscape, at least 1920px wide." },
      { name: "imageAlt", label: "Image description (alt text)", type: "text", max: 200 },
      {
        name: "layout",
        label: "Image layout",
        type: "select",
        options: [
          { value: "full", label: "Full-screen background (large landscape photos, 1920px+)" },
          { value: "framed", label: "Framed photo over blurred backdrop (portrait or smaller photos)" },
        ],
        default: "full",
        help: "Choose “Framed” for phone or Instagram photos so they stay sharp.",
      },
      {
        name: "video",
        label: "Background video (optional, muted MP4)",
        type: "video",
        help: "Short, compressed MP4 (under 10MB). The image is used as the poster and on slow connections.",
      },
      { name: "published", label: "Published", type: "boolean", default: true },
    ],
  },

  sections: {
    key: "sections",
    label: "Homepage Sections",
    singular: "Section",
    description:
      "Drag to reorder the homepage. Built-in sections can be hidden but not deleted. Add new sections of any type.",
    titleField: "label",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "visible", on: "Visible", off: "Hidden" },
    columns: [
      { field: "label", label: "Section" },
      { field: "type", label: "Type", kind: "badge" },
      { field: "status", label: "Status", kind: "badge" },
      { field: "visible", label: "Visible", kind: "bool" },
    ],
    canDelete: (row) => !row.builtIn,
    deleteBlockedReason: "Built-in sections can be hidden but not deleted.",
    fields: [
      { name: "label", label: "Admin label", type: "text", required: true, max: 120, half: true },
      {
        name: "type",
        label: "Section type",
        type: "select",
        required: true,
        options: ALL_SECTION_TYPES,
        default: "text",
        lockedBy: "builtIn",
        half: true,
      },
      {
        name: "anchor",
        label: "Anchor ID",
        type: "text",
        max: 60,
        help: "Used for menu links, e.g. “faq” → /#faq. Leave empty to generate.",
        half: true,
      },
      {
        name: "background",
        label: "Background style",
        type: "select",
        options: [
          { value: "dark", label: "Cinematic black" },
          { value: "charcoal", label: "Dark charcoal" },
          { value: "gradient", label: "Orange light-leak gradient" },
          { value: "image", label: "Background image (uses image below)" },
          { value: "light", label: "Off-white" },
        ],
        default: "dark",
        half: true,
      },
      { name: "eyebrow", label: "Eyebrow", type: "text", max: 80, half: true },
      { name: "title", label: "Title", type: "text", max: 200, half: true },
      { name: "subtitle", label: "Subtitle", type: "textarea", max: 600 },
      { name: "body", label: "Description", type: "richtext", showIf: { field: "type", in: bodyTypes } },
      {
        name: "html",
        label: "Custom HTML",
        type: "textarea",
        inData: true,
        max: 20000,
        help: "Scripts, event handlers and unsafe tags are removed automatically. YouTube/Vimeo iframes are allowed.",
        showIf: { field: "type", in: ["html"] },
      },
      {
        name: "image",
        label: "Image",
        type: "image",
        showIf: { field: "type", in: ["intro", "image", "image_text", "showcase", "cta", "announcement", "feedback", "contact", "text", "why"] },
      },
      {
        name: "imageAlt",
        label: "Image description (alt text)",
        type: "text",
        max: 200,
        showIf: { field: "type", in: ["intro", "image", "image_text", "showcase", "cta", "announcement", "feedback", "contact", "text", "why"] },
      },
      {
        name: "imagePosition",
        label: "Image position",
        type: "select",
        inData: true,
        options: [
          { value: "left", label: "Image on the left" },
          { value: "right", label: "Image on the right" },
        ],
        default: "right",
        showIf: { field: "type", in: ["image_text", "intro"] },
      },
      {
        name: "video",
        label: "Video (MP4 upload, YouTube or Vimeo link)",
        type: "video",
        showIf: { field: "type", in: ["video", "showcase", "image_text"] },
      },
      { name: "buttonText", label: "Button text", type: "text", max: 60, half: true },
      { name: "buttonUrl", label: "Button link", type: "url", half: true, help: "e.g. /portfolio, /#contact, or a full URL." },
      {
        name: "highlights",
        label: "Highlights",
        type: "repeater",
        inData: true,
        showIf: { field: "type", in: ["intro"] },
        subfields: [{ name: "text", label: "Highlight", type: "text", max: 120 }],
      },
      {
        name: "faqItems",
        label: "Questions",
        type: "repeater",
        inData: true,
        showIf: { field: "type", in: ["faq"] },
        subfields: [
          { name: "question", label: "Question", type: "text", max: 300 },
          { name: "answer", label: "Answer", type: "textarea", max: 2000 },
        ],
      },
      {
        name: "statItems",
        label: "Statistics",
        type: "repeater",
        inData: true,
        help: "Only publish figures you can verify.",
        showIf: { field: "type", in: ["stats"] },
        subfields: [
          { name: "value", label: "Value (e.g. 120+)", type: "text", max: 20 },
          { name: "label", label: "Label", type: "text", max: 80 },
        ],
      },
      {
        name: "stepItems",
        label: "Steps",
        type: "repeater",
        inData: true,
        showIf: { field: "type", in: ["steps"] },
        subfields: [
          { name: "title", label: "Step title", type: "text", max: 80 },
          { name: "text", label: "Description", type: "textarea", max: 400 },
        ],
      },
      {
        name: "tickerItems",
        label: "Words / phrases",
        type: "repeater",
        inData: true,
        showIf: { field: "type", in: ["ticker"] },
        subfields: [{ name: "text", label: "Text", type: "text", max: 60 }],
      },
      {
        name: "galleryItems",
        label: "Gallery images",
        type: "repeater",
        inData: true,
        showIf: { field: "type", in: ["gallery"] },
        subfields: [
          { name: "image", label: "Image", type: "image" },
          { name: "alt", label: "Alt text", type: "text", max: 200 },
          { name: "caption", label: "Caption", type: "text", max: 200 },
        ],
      },
      {
        name: "limit",
        label: "Maximum items to show",
        type: "number",
        inData: true,
        min: 1,
        max: 48,
        default: 6,
        showIf: { field: "type", in: ["portfolio", "team", "testimonials", "services", "instagram"] },
      },
      { name: "visible", label: "Visible on the website", type: "boolean", default: true, half: true },
      { name: "status", label: "Publishing status", type: "select", options: statusOptions, default: "published", half: true },
    ],
  },

  services: {
    key: "services",
    label: "Services",
    singular: "Service",
    description: "Everything listed here is editable content. Enable only the services you currently offer.",
    titleField: "title",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "enabled", on: "Enabled", off: "Disabled" },
    searchFields: ["title", "summary"],
    columns: [
      { field: "image", label: "", kind: "image" },
      { field: "title", label: "Service" },
      { field: "highlighted", label: "Main", kind: "bool" },
      { field: "enabled", label: "Enabled", kind: "bool" },
    ],
    fields: [
      { name: "title", label: "Service name", type: "text", required: true, max: 120, half: true },
      { name: "slug", label: "URL slug", type: "text", max: 80, slugFrom: "title", half: true },
      { name: "summary", label: "Short description", type: "textarea", max: 400 },
      { name: "description", label: "Full description", type: "richtext" },
      { name: "icon", label: "Icon", type: "icon", options: ICON_OPTIONS, default: "film", half: true },
      { name: "highlighted", label: "Main / primary service", type: "boolean", half: true },
      { name: "image", label: "Service image", type: "image" },
      { name: "video", label: "Service video (MP4, YouTube or Vimeo)", type: "video" },
      {
        name: "whatsappMessage",
        label: "WhatsApp message for this service",
        type: "textarea",
        max: 500,
        help: "Pre-filled when a visitor taps “Enquire on WhatsApp” on this service.",
      },
      { name: "enabled", label: "Enabled", type: "boolean", default: true },
    ],
  },

  portfolio: {
    key: "portfolio",
    label: "Portfolio Projects",
    singular: "Project",
    titleField: "title",
    sortable: true,
    orderBy: "sort",
    searchFields: ["title", "client", "location", "projectType"],
    filter: {
      field: "status",
      label: "Status",
      options: [
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
      ],
    },
    columns: [
      { field: "coverImage", label: "", kind: "image" },
      { field: "title", label: "Project" },
      { field: "categoryId", label: "Category", kind: "relation" },
      { field: "featured", label: "Featured", kind: "bool" },
      { field: "status", label: "Status", kind: "badge" },
      { field: "isPlaceholder", label: "Sample", kind: "bool" },
    ],
    quickActions: [
      { label: "Publish", patch: { status: "published" }, when: (r) => r.status !== "published", tone: "success" },
      { label: "Unpublish", patch: { status: "draft" }, when: (r) => r.status === "published" },
      { label: "Feature", patch: { featured: true }, when: (r) => !r.featured },
      { label: "Unfeature", patch: { featured: false }, when: (r) => Boolean(r.featured) },
    ],
    viewPath: (r) => (r.status === "published" ? `/portfolio/${r.slug}` : `/preview/portfolio/${r.slug}`),
    fields: [
      { name: "title", label: "Project title", type: "text", required: true, max: 160, half: true },
      { name: "slug", label: "URL slug", type: "text", max: 80, slugFrom: "title", half: true },
      { name: "categoryId", label: "Category", type: "relation", relation: "categories", half: true },
      { name: "projectType", label: "Project type", type: "text", max: 100, half: true, placeholder: "e.g. Wedding film" },
      { name: "client", label: "Client name", type: "text", max: 120, half: true },
      { name: "location", label: "Location", type: "text", max: 120, half: true },
      { name: "projectDate", label: "Date", type: "date", half: true },
      { name: "status", label: "Status", type: "select", options: statusOptions, default: "draft", half: true },
      { name: "summary", label: "Short summary (cards & SEO)", type: "textarea", max: 300 },
      { name: "description", label: "Project description", type: "richtext" },
      { name: "coverImage", label: "Cover image", type: "image", required: true },
      { name: "coverAlt", label: "Cover image description (alt text)", type: "text", max: 200 },
      { name: "gallery", label: "Photo gallery", type: "gallery" },
      { name: "videoUrl", label: "Video file (MP4 upload or direct URL)", type: "video" },
      { name: "youtubeUrl", label: "YouTube URL", type: "url", placeholder: "https://www.youtube.com/watch?v=…", half: true },
      { name: "vimeoUrl", label: "Vimeo URL", type: "url", placeholder: "https://vimeo.com/…", half: true },
      { name: "featured", label: "Featured on homepage", type: "boolean", half: true },
      {
        name: "isPlaceholder",
        label: "Sample / placeholder project",
        type: "boolean",
        half: true,
        help: "Shows a “Sample” label publicly. Untick once this is real work.",
      },
    ],
  },

  categories: {
    key: "categories",
    label: "Portfolio Categories",
    singular: "Category",
    titleField: "name",
    sortable: true,
    orderBy: "sort",
    columns: [
      { field: "name", label: "Category" },
      { field: "slug", label: "Slug" },
    ],
    fields: [
      { name: "name", label: "Category name", type: "text", required: true, max: 60 },
      { name: "slug", label: "URL slug", type: "text", max: 60, slugFrom: "name" },
    ],
  },

  team: {
    key: "team",
    label: "Team Members",
    singular: "Team member",
    description: "Add your real team members, their photographs and profiles.",
    titleField: "name",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "published", on: "Published", off: "Hidden" },
    searchFields: ["name", "position"],
    columns: [
      { field: "photo", label: "", kind: "image" },
      { field: "name", label: "Name" },
      { field: "position", label: "Position" },
      { field: "featured", label: "Featured", kind: "bool" },
      { field: "isPlaceholder", label: "Sample", kind: "bool" },
    ],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true, max: 120, half: true },
      { name: "position", label: "Position", type: "text", max: 120, half: true, placeholder: "e.g. Cinematographer" },
      { name: "photo", label: "Profile photograph", type: "image", help: "Portrait orientation (4:5) works best." },
      { name: "bio", label: "Professional biography", type: "richtext" },
      { name: "skills", label: "Skills", type: "tags", help: "Separate with commas." },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "whatsapp", label: "WhatsApp number", type: "text", max: 30, half: true },
      { name: "instagram", label: "Instagram URL", type: "url", half: true },
      { name: "facebook", label: "Facebook URL", type: "url", half: true },
      { name: "linkedin", label: "LinkedIn URL", type: "url", half: true },
      { name: "x", label: "X (Twitter) URL", type: "url", half: true },
      { name: "youtube", label: "YouTube URL", type: "url", half: true },
      { name: "tiktok", label: "TikTok URL", type: "url", half: true },
      { name: "website", label: "Website", type: "url", half: true },
      { name: "featured", label: "Featured", type: "boolean", half: true },
      { name: "published", label: "Published", type: "boolean", default: true, half: true },
      {
        name: "isPlaceholder",
        label: "Placeholder profile",
        type: "boolean",
        half: true,
        help: "Untick after entering a real team member.",
      },
    ],
  },

  testimonials: {
    key: "testimonials",
    label: "Testimonials & Feedback",
    singular: "Testimonial",
    description: "Customer submissions arrive as Pending. Only approved testimonials appear on the website.",
    titleField: "name",
    orderBy: "newest",
    searchFields: ["name", "email", "service", "message"],
    filter: {
      field: "status",
      label: "Status",
      options: [
        { value: "pending", label: "Pending" },
        { value: "approved", label: "Approved" },
        { value: "rejected", label: "Rejected" },
      ],
    },
    columns: [
      { field: "name", label: "Customer" },
      { field: "service", label: "Service" },
      { field: "rating", label: "Rating", kind: "stars" },
      { field: "status", label: "Status", kind: "badge" },
      { field: "featured", label: "Featured", kind: "bool" },
      { field: "createdAt", label: "Submitted", kind: "date" },
    ],
    quickActions: [
      { label: "Approve", patch: { status: "approved" }, when: (r) => r.status !== "approved", tone: "success" },
      { label: "Reject", patch: { status: "rejected", featured: false }, when: (r) => r.status !== "rejected", tone: "danger" },
      { label: "Feature", patch: { featured: true }, when: (r) => !r.featured && r.status === "approved" },
      { label: "Unfeature", patch: { featured: false }, when: (r) => Boolean(r.featured) },
    ],
    fields: [
      { name: "name", label: "Full name", type: "text", required: true, max: 120, half: true },
      { name: "service", label: "Service used", type: "text", max: 120, half: true },
      { name: "email", label: "Email", type: "email", half: true },
      { name: "phone", label: "Phone", type: "text", max: 30, half: true },
      {
        name: "rating",
        label: "Rating",
        type: "select",
        options: ["5", "4", "3", "2", "1"].map((v) => ({ value: v, label: `${v} star${v === "1" ? "" : "s"}` })),
        default: "5",
        half: true,
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "pending", label: "Pending" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ],
        default: "pending",
        half: true,
      },
      { name: "message", label: "Testimonial", type: "textarea", required: true, max: 2000 },
      { name: "photo", label: "Photo (optional)", type: "image" },
      { name: "consent", label: "Customer consented to display", type: "boolean", half: true },
      { name: "featured", label: "Featured", type: "boolean", half: true },
    ],
  },

  why: {
    key: "why",
    label: "Why Choose Us",
    singular: "Reason",
    titleField: "title",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "visible", on: "Visible", off: "Hidden" },
    columns: [
      { field: "title", label: "Title" },
      { field: "text", label: "Text" },
      { field: "visible", label: "Visible", kind: "bool" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 80, half: true },
      { name: "icon", label: "Icon", type: "icon", options: ICON_OPTIONS, default: "aperture", half: true },
      { name: "text", label: "Text", type: "textarea", max: 400 },
      { name: "visible", label: "Visible", type: "boolean", default: true },
    ],
  },

  instagram: {
    key: "instagram",
    label: "Instagram Showcase",
    singular: "Instagram post",
    description: "Manually curated posts from @midemediaproduction — no scraping required.",
    titleField: "caption",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "visible", on: "Visible", off: "Hidden" },
    columns: [
      { field: "image", label: "", kind: "image" },
      { field: "caption", label: "Caption" },
      { field: "visible", label: "Visible", kind: "bool" },
    ],
    fields: [
      { name: "image", label: "Post image", type: "image", required: true },
      { name: "caption", label: "Caption", type: "textarea", max: 400 },
      { name: "postUrl", label: "Instagram post URL", type: "url", placeholder: "https://www.instagram.com/p/…" },
      { name: "visible", label: "Visible", type: "boolean", default: true },
    ],
  },

  nav: {
    key: "nav",
    label: "Navigation Menu",
    singular: "Menu item",
    titleField: "label",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "visible", on: "Visible", off: "Hidden" },
    columns: [
      { field: "label", label: "Label" },
      { field: "href", label: "Link" },
      { field: "visible", label: "Visible", kind: "bool" },
    ],
    fields: [
      { name: "label", label: "Label", type: "text", required: true, max: 40 },
      { name: "href", label: "Link", type: "url", required: true, help: "e.g. /#about, /portfolio or a full URL." },
      { name: "visible", label: "Visible", type: "boolean", default: true },
    ],
  },

  social: {
    key: "social",
    label: "Social Links",
    singular: "Social link",
    description: "Only add accounts that genuinely belong to MIDE MEDIA PRODUCTION.",
    titleField: "platform",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "visible", on: "Visible", off: "Hidden" },
    columns: [
      { field: "platform", label: "Platform", kind: "badge" },
      { field: "url", label: "URL" },
      { field: "visible", label: "Visible", kind: "bool" },
    ],
    fields: [
      {
        name: "platform",
        label: "Platform",
        type: "select",
        required: true,
        options: ["instagram", "facebook", "youtube", "tiktok", "x", "linkedin", "vimeo", "website"].map((v) => ({
          value: v,
          label: v === "x" ? "X (Twitter)" : v[0]!.toUpperCase() + v.slice(1),
        })),
        default: "instagram",
      },
      { name: "label", label: "Label / handle", type: "text", max: 80 },
      { name: "url", label: "URL", type: "url", required: true },
      { name: "visible", label: "Visible", type: "boolean", default: true },
    ],
  },

  announcements: {
    key: "announcements",
    label: "Announcements",
    singular: "Announcement",
    description: "Shown in a slim bar at the top of the website while active.",
    titleField: "message",
    sortable: true,
    orderBy: "sort",
    toggle: { field: "active", on: "Active", off: "Inactive" },
    columns: [
      { field: "message", label: "Message" },
      { field: "startsAt", label: "Starts" },
      { field: "endsAt", label: "Ends" },
      { field: "active", label: "Active", kind: "bool" },
    ],
    fields: [
      { name: "message", label: "Message", type: "text", required: true, max: 200 },
      { name: "linkText", label: "Link text", type: "text", max: 40, half: true },
      { name: "linkUrl", label: "Link URL", type: "url", half: true },
      { name: "startsAt", label: "Start date (optional)", type: "date", half: true },
      { name: "endsAt", label: "End date (optional)", type: "date", half: true },
      { name: "active", label: "Active", type: "boolean", default: true },
    ],
  },
} satisfies Record<string, Resource>;

export type ResourceKey = keyof typeof resources;

export function getResource(key: string): Resource | null {
  return (resources as Record<string, Resource>)[key] ?? null;
}

export function isFieldVisible(field: Field, values: Record<string, unknown>) {
  if (!field.showIf) return true;
  return field.showIf.in.includes(String(values[field.showIf.field] ?? ""));
}
