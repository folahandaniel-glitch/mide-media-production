import type { Metadata } from "next";

import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdminPage } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { countOpenTasks } from "@/lib/tasks";
import { AdminShell } from "@/components/admin/shell";
import { ConfirmHost } from "@/components/admin/ui";
import { Toaster } from "@/components/ui/toast";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Backend", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage();
  const [[pending], [unread], intro, myOpenTasks, settings] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(schema.testimonials).where(eq(schema.testimonials.status, "pending")),
    db.select({ n: sql<number>`count(*)` }).from(schema.enquiries).where(and(eq(schema.enquiries.isRead, false))),
    db.query.sections.findFirst({ where: eq(schema.sections.key, "intro"), columns: { id: true } }),
    countOpenTasks(session.id),
    getAllSettings(),
  ]);
  return (
    <>
      <AdminShell
        session={{ name: session.name, email: session.email, role: session.role }}
        counts={{ pendingTestimonials: Number(pending?.n ?? 0), unreadEnquiries: Number(unread?.n ?? 0), myOpenTasks }}
        introId={intro?.id ?? null}
        logoUrl={settings.site.logo}
      >
        {children}
      </AdminShell>
      <ConfirmHost />
      <Toaster />
    </>
  );
}
