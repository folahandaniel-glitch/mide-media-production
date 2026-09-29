import { requireAdminPage } from "@/lib/auth";
import { SecurityForm } from "@/components/admin/security-form";

export default async function SecurityPage() {
  const session = await requireAdminPage();
  return <SecurityForm email={session.email} />;
}
