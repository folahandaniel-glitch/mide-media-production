import type { MetadataRoute } from "next";
import { AI_CRAWLERS } from "@/lib/seo-kit";
import { getSiteChrome } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [{ settings }, base] = await Promise.all([getSiteChrome(), siteUrl()]);
  if (!settings.seo.robotsIndex) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/preview", "/api/"] }, { ...{ userAgent: "*", allow: "/", disallow: ["/admin", "/preview", "/api/"] }, userAgent: AI_CRAWLERS }],
    sitemap: `${base}/sitemap.xml`,
  };
}
