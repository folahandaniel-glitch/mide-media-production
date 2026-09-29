import { getHomeData, getSiteChrome } from "@/lib/content";
import { JsonLd, organizationJsonLd, siteUrl } from "@/lib/seo";
import { SectionRenderer } from "@/components/sections/renderer";

// Content is refreshed instantly on admin changes (revalidatePath); this is a safety net.
export const revalidate = 300;

export default async function HomePage() {
  const [chrome, data] = await Promise.all([getSiteChrome(), getHomeData(false)]);
  const url = await siteUrl();
  return (
    <>
      <JsonLd data={organizationJsonLd(chrome.settings, url, chrome.social.map((s) => s.url))} />
      <SectionRenderer ctx={{ data, chrome, preview: false }} />
    </>
  );
}
