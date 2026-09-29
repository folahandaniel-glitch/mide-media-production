import { EnquiriesManager } from "@/components/admin/enquiries-manager";

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ open?: string; unread?: string }> }) {
  const { open, unread } = await searchParams;
  return <EnquiriesManager key={`${open ?? ""}-${unread ?? ""}`} initialOpen={open} initialUnread={unread === "1"} />;
}
