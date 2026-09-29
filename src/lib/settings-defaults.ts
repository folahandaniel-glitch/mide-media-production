/**
 * Default values for every settings group. Stored values are merged on top of
 * these, so new keys can be added later without a data migration.
 * Shared by server and client code — keep it free of server-only imports.
 */

export const defaultSettings = {
  site: {
    companyName: "MIDE MEDIA PRODUCTION",
    tagline: "Cinematography and Media Production",
    logo: "",
    logoAlt: "MIDE MEDIA PRODUCTION logo",
    favicon: "",
    phone: "+234 706 296 1288",
    whatsappNumber: "+234 706 296 1288",
    email: "",
    address: "",
    locationText: "Serving Clients Across Nigeria",
    instagramUrl: "https://www.instagram.com/midemediaproduction",
    instagramHandle: "@midemediaproduction",
    footerText:
      "We transform moments, ideas and experiences into compelling visual stories through professional cinematography and media production.",
    copyright: "MIDE MEDIA PRODUCTION. All rights reserved.",
    brandColor: "#FF7A1A",
    siteUrl: "",
  },
  hero: {
    animatedWords: "CAPTURE. CREATE. INSPIRE.",
    primaryButtonText: "VIEW OUR PORTFOLIO",
    primaryButtonUrl: "/portfolio",
    secondaryButtonText: "CHAT WITH US ON WHATSAPP",
    autoplaySeconds: 7,
    showRecIndicator: true,
  },
  whatsapp: {
    floatingEnabled: true,
    defaultMessage:
      "Hello MIDE MEDIA PRODUCTION, I would like to discuss a cinematography/media production project with you.",
    heroMessage:
      "Hello MIDE MEDIA PRODUCTION, I would like to discuss a cinematography/media production project with you.",
    portfolioMessage: "Hello MIDE MEDIA PRODUCTION, I saw your portfolio and would like to discuss a project.",
    weddingMessage: "Hello MIDE MEDIA PRODUCTION, I would like to enquire about wedding cinematography.",
    corporateMessage: "Hello MIDE MEDIA PRODUCTION, I would like to discuss corporate video production.",
    teamMessage: "Hello MIDE MEDIA PRODUCTION, I would like to speak with your team about a project.",
    contactMessage: "Hello MIDE MEDIA PRODUCTION, I would like to book a project with you.",
  },
  seo: {
    title: "MIDE MEDIA PRODUCTION | Cinematography & Media Production in Nigeria",
    description:
      "MIDE MEDIA PRODUCTION transforms moments, ideas and experiences into compelling visual stories through professional cinematography and media production. Serving clients across Nigeria.",
    keywords:
      "cinematography Nigeria, videography, wedding cinematography, event coverage, corporate video production, documentary production, music video production, media production",
    ogTitle: "MIDE MEDIA PRODUCTION — Cinematic Stories. Powerful Visuals.",
    ogDescription:
      "Professional cinematography and media production for weddings, events, brands, churches, organisations and creators across Nigeria.",
    ogImage: "",
    canonicalUrl: "",
    robotsIndex: true,
  },
  analytics: {
    googleAnalyticsId: "",
  },
  forms: {
    serviceOptions:
      "Cinematography\nWedding Cinematography\nEvent Cinematography\nCorporate Video Production\nDocumentary Production\nMusic Video Production\nCommercial Video Production\nChurch and Ministry Coverage\nSocial Media Video Production\nOther",
    budgetOptions:
      "Below ₦250,000\n₦250,000 – ₦500,000\n₦500,000 – ₦1,000,000\n₦1,000,000 – ₦3,000,000\nAbove ₦3,000,000\nLet's discuss",
    referralOptions: "Instagram\nWhatsApp\nReferral from a friend\nGoogle search\nAt an event\nOther",
    contactSuccessMessage:
      "Thank you! Your project enquiry has been received. MIDE MEDIA PRODUCTION will contact you shortly.",
    feedbackSuccessMessage: "Thank you for your feedback. Your testimonial has been submitted for review.",
  },
};

export type SettingsMap = typeof defaultSettings;
export type SettingsGroup = keyof SettingsMap;
export const settingsGroups = Object.keys(defaultSettings) as SettingsGroup[];

export function mergeSettings<G extends SettingsGroup>(group: G, stored: unknown): SettingsMap[G] {
  const base = defaultSettings[group];
  if (!stored || typeof stored !== "object") return { ...base };
  const out: Record<string, unknown> = { ...base };
  for (const [k, def] of Object.entries(base)) {
    const v = (stored as Record<string, unknown>)[k];
    if (v === undefined || v === null) continue;
    if (typeof def === "boolean") out[k] = Boolean(v);
    else if (typeof def === "number") out[k] = Number.isFinite(Number(v)) ? Number(v) : def;
    else out[k] = String(v);
  }
  return out as SettingsMap[G];
}

export function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
