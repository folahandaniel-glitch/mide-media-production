import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireAdminPage();
  if (session.role !== "super_admin") redirect("/admin");
  const [{ tab }, settings] = await Promise.all([searchParams, getAllSettings()]);
  return <SettingsForm key={tab ?? "general"} initial={settings} initialTab={tab} />;
}
