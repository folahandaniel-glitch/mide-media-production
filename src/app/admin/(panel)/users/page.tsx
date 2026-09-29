import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { UsersManager } from "@/components/admin/users-manager";

export default async function UsersPage() {
  const session = await requireAdminPage();
  if (session.role !== "super_admin") redirect("/admin");
  return <UsersManager currentUserId={session.id} />;
}
