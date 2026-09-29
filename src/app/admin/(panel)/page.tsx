import Link from "next/link";
import { desc, eq, sql, type SQL } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { ArrowUpRight, BarChart3, Eye, FolderOpen, ImageIcon, Inbox, MailOpen, MessageSquareQuote, MessagesSquare, Users } from "lucide-react";
import { db, schema } from "@/db";
import { getSession } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { PlaceholderBanner } from "@/components/admin/placeholder-banner";
import { listTasks } from "@/lib/tasks";

async function count(table: SQLiteTable, where?: SQL) {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(table).where(where);
  return Number(r?.n ?? 0);
}

export default async function Dashboard() {
  const session = await getSession();
  const [projects, published, team, testimonials, pending, enquiries, unread, media, placeholdersP, placeholdersT, settings] = await Promise.all([
    count(schema.portfolioProjects),
    count(schema.portfolioProjects, eq(schema.portfolioProjects.status, "published")),
    count(schema.teamMembers),
    count(schema.testimonials, eq(schema.testimonials.status, "approved")),
    count(schema.testimonials, eq(schema.testimonials.status, "pending")),
    count(schema.enquiries),
    count(schema.enquiries, eq(schema.enquiries.isRead, false)),
    count(schema.mediaAssets),
    count(schema.portfolioProjects, eq(schema.portfolioProjects.isPlaceholder, true)),
    count(schema.teamMembers, eq(schema.teamMembers.isPlaceholder, true)),
    getAllSettings(),
  ]);
  const [myTasks, teamTasks] = await Promise.all([
    session ? listTasks(session, { open: true, assigneeId: session.id }).then((r) => r.filter((t) => t.assigneeId === session.id)) : [],
    session?.role === "super_admin" ? listTasks(session, { open: true }) : Promise.resolve([]),
  ]);
  const todayStr = new Date().toISOString().slice(0, 10);
  const overdueTeam = teamTasks.filter((t) => t.dueDate && t.dueDate < todayStr).length;
  const [recentEnquiries, recentFeedback, recentProjects] = await Promise.all([
    db.select().from(schema.enquiries).orderBy(desc(schema.enquiries.createdAt)).limit(5),
    db.select().from(schema.testimonials).orderBy(desc(schema.testimonials.createdAt)).limit(5),
    db.select().from(schema.portfolioProjects).orderBy(desc(schema.portfolioProjects.createdAt)).limit(5),
  ]);

  const cards = [
    { label: "Portfolio projects", value: projects, icon: FolderOpen, href: "/admin/r/portfolio" },
    { label: "Published projects", value: published, icon: Eye, href: "/admin/r/portfolio?filter=published" },
    { label: "Team members", value: team, icon: Users, href: "/admin/r/team" },
    { label: "Testimonials", value: testimonials, icon: MessageSquareQuote, href: "/admin/r/testimonials?filter=approved" },
    { label: "Pending testimonials", value: pending, icon: MessagesSquare, href: "/admin/r/testimonials?filter=pending", highlight: pending > 0 },
    { label: "Customer enquiries", value: enquiries, icon: Inbox, href: "/admin/enquiries" },
    { label: "Unread enquiries", value: unread, icon: MailOpen, href: "/admin/enquiries?unread=1", highlight: unread > 0 },
    { label: "Media files", value: media, icon: ImageIcon, href: "/admin/media" },
  ];
  const ga = settings.analytics.googleAnalyticsId;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm text-white/50">{greeting}{session?.name ? `, ${session.name}` : ""}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-white md:text-3xl">Dashboard</h1>
      </div>

      {placeholdersP + placeholdersT > 0 && session?.role === "super_admin" && <PlaceholderBanner projects={placeholdersP} team={placeholdersT} />}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link
              href={c.href}
              className={`group flex h-full flex-col justify-between rounded-2xl border p-5 transition hover:-translate-y-0.5 ${c.highlight ? "border-brand/50 bg-brand/[0.08]" : "border-white/[0.08] bg-[#111113] hover:border-white/20"}`}
            >
              <div className="flex items-center justify-between">
                <c.icon className={`h-5 w-5 ${c.highlight ? "text-brand" : "text-white/40"}`} aria-hidden="true" />
                <ArrowUpRight className="h-4 w-4 text-white/25 transition group-hover:text-brand" aria-hidden="true" />
              </div>
              <p className="mt-6 font-display text-3xl font-semibold text-white tabular-nums">{c.value}</p>
              <p className="mt-1 text-xs text-white/55">{c.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#111113] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-brand" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-white">Website views</p>
            <p className="text-xs text-white/50">
              {ga ? `Google Analytics is connected (${ga}). View traffic in your Analytics dashboard.` : "Analytics is not configured yet. Add a Google Analytics ID to start measuring visits."}
            </p>
          </div>
        </div>
        {ga ? (
          <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn-sm">
            Open Google Analytics <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <Link href="/admin/settings?tab=analytics" className="adm-btn adm-btn-sm">
            Configure analytics
          </Link>
        )}
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113]" aria-label="My tasks">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <h2 className="text-sm font-semibold text-white">
            My tasks <span className="ml-1 text-white/45">({myTasks.length} open)</span>
          </h2>
          <div className="flex items-center gap-3 text-xs">
            {session?.role === "super_admin" && (
              <span className="text-white/55">
                Team: {teamTasks.length} open{overdueTeam > 0 && <span className="text-red-400"> · {overdueTeam} overdue</span>}
              </span>
            )}
            <Link href="/admin/tasks" className="text-brand hover:underline">
              {session?.role === "super_admin" ? "Manage tasks" : "View all"}
            </Link>
          </div>
        </div>
        {myTasks.length ? (
          <ul className="divide-y divide-white/[0.05]">
            {myTasks.slice(0, 5).map((t) => (
              <li key={t.id}>
                <Link href="/admin/tasks" className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.03]">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-white">{t.title}</span>
                    <span className="block text-xs text-white/45 capitalize">
                      {t.status.replace("_", " ")} · {t.priority} priority
                    </span>
                  </span>
                  {t.dueDate && (
                    <span className={`shrink-0 text-xs ${t.dueDate < todayStr ? "font-semibold text-red-400" : "text-white/45"}`}>
                      {t.dueDate < todayStr ? "Overdue" : "Due"} {formatDate(t.dueDate)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty text="No open tasks assigned to you." />
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Recent enquiries" href="/admin/enquiries">
          {recentEnquiries.length ? (
            recentEnquiries.map((e) => (
              <Link key={e.id} href={`/admin/enquiries?open=${e.id}`} className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.03]">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium text-white">
                    {!e.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                    <span className="truncate">{e.name}</span>
                  </span>
                  <span className="block truncate text-xs text-white/50">{e.service || e.message}</span>
                </span>
                <span className="shrink-0 text-[0.7rem] text-white/40">{formatDate(e.createdAt)}</span>
              </Link>
            ))
          ) : (
            <Empty text="No enquiries found." />
          )}
        </Panel>
        <Panel title="Recent feedback" href="/admin/r/testimonials">
          {recentFeedback.length ? (
            recentFeedback.map((t) => (
              <Link key={t.id} href={`/admin/r/testimonials/${t.id}`} className="flex items-start justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.03]">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-white">{t.name}</span>
                  <span className="block truncate text-xs text-white/50">{t.message}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] capitalize ${t.status === "pending" ? "bg-amber-500/15 text-amber-300" : t.status === "approved" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                  {t.status}
                </span>
              </Link>
            ))
          ) : (
            <Empty text="No feedback has been submitted yet." />
          )}
        </Panel>
        <Panel title="Recent portfolio uploads" href="/admin/r/portfolio">
          {recentProjects.length ? (
            recentProjects.map((p) => (
              <Link key={p.id} href={`/admin/r/portfolio/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03]">
                {p.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImage} alt="" className="h-10 w-14 shrink-0 rounded-md object-cover" loading="lazy" />
                ) : (
                  <span className="h-10 w-14 shrink-0 rounded-md bg-white/5" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{p.title}</span>
                  <span className="block text-xs text-white/45 capitalize">
                    {p.status}
                    {p.isPlaceholder ? " · sample" : ""}
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <Empty text="No portfolio projects available yet." />
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113]" aria-label={title}>
      <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <Link href={href} className="text-xs text-brand hover:underline">
          View all
        </Link>
      </div>
      <div className="divide-y divide-white/[0.05]">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="px-5 py-10 text-center text-sm text-white/45">{text}</p>;
}
