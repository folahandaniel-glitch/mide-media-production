import { notFound } from "next/navigation";
import { getResource } from "@/lib/admin/resources";
import { ResourceList } from "@/components/admin/resource-list";

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const [{ resource }, { filter }] = await Promise.all([params, searchParams]);
  if (!getResource(resource)) notFound();
  return <ResourceList key={`${resource}-${filter ?? ""}`} resourceKey={resource} initialFilter={filter ?? ""} />;
}
