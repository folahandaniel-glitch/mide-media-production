import { notFound } from "next/navigation";
import { getResource } from "@/lib/admin/resources";
import { ResourceForm } from "@/components/admin/resource-form";

export default async function ResourceEditPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  if (!getResource(resource)) notFound();
  return <ResourceForm key={`${resource}-${id}`} resourceKey={resource} id={id} />;
}
