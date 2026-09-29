import { getHomeData, getSiteChrome } from "@/lib/content";
import { SectionRenderer } from "@/components/sections/renderer";

export default async function PreviewHome() {
  const [chrome, data] = await Promise.all([getSiteChrome(), getHomeData(true)]);
  return <SectionRenderer ctx={{ data, chrome, preview: true }} />;
}
