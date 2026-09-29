import { notFound } from "next/navigation";
import { getProjectBySlug, getSiteChrome } from "@/lib/content";
import { ProjectView } from "@/components/site/project-view";

export default async function PreviewProject({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, chrome] = await Promise.all([getProjectBySlug(slug, true), getSiteChrome()]);
  if (!data) notFound();
  return <ProjectView data={data} chrome={chrome} />;
}
