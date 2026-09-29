import "server-only";
import type { SettingsMap } from "./settings-defaults";
import { getSiteChrome } from "./content";

/** Absolute site URL: Settings → NEXT_PUBLIC_SITE_URL → Vercel production URL → localhost. */
export async function siteUrl() {
  const { settings } = await getSiteChrome();
  const configured = settings.site.siteUrl || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/** schema.org Organization — only facts actually supplied by the business. */
export function organizationJsonLd(settings: SettingsMap, url: string, social: string[]) {
  const s = settings.site;
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: s.companyName,
    description: settings.seo.description,
    url,
    telephone: s.phone.replace(/\s/g, ""),
    areaServed: { "@type": "Country", name: "Nigeria" },
    sameAs: Array.from(new Set([s.instagramUrl, ...social].filter(Boolean))),
    knowsAbout: ["Cinematography", "Video production", "Media production"],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: s.whatsappNumber.replace(/\s/g, ""),
      contactType: "customer service",
      areaServed: "NG",
      availableLanguage: ["English"],
    },
  };
  if (s.logo) data.logo = s.logo.startsWith("http") ? s.logo : `${url}${s.logo}`;
  if (s.email) data.email = s.email;
  if (s.address) data.address = s.address;
  return data;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot break out of the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
