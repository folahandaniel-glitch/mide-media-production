import { requireAdminPage } from "@/lib/auth";
import { TasksManager } from "@/components/admin/tasks-manager";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ assignee?: string; new?: string }> }) {
  const [session, { assignee, new: openNew }] = await Promise.all([requireAdminPage(), searchParams]);
  const isSuper = session.role === "super_admin";
  return (
    <TasksManager
      key={`${assignee ?? ""}-${openNew ?? ""}`}
      isSuper={isSuper}
      currentUserId={session.id}
      initialAssignee={isSuper ? assignee : undefined}
      openNew={isSuper && openNew === "1"}
    />
  );
}
