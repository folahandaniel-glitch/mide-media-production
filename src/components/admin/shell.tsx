"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Briefcase,
  Clapperboard,
  ExternalLink,
  Eye,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Images,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  Palette,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareQuote,
  MessagesSquare,
  Navigation,
  PanelBottom,
  Search,
  Settings,
  Share2,
  Sparkles,
  UserCog,
  Users,
  Video,
  X,
} from "lucide-react";
import { ApertureMark } from "@/components/site/logo";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { api } from "./client";

type NavItem = { label: string; href: string; icon: React.ComponentType<{ className?: string }>; badge?: number; superOnly?: boolean };

export function AdminShell({
  children,
  session,
  counts,
  introId,
  logoUrl,
}: {
  children: React.ReactNode;
  session: { name: string; email: string; role: "super_admin" | "editor" };
  counts: { pendingTestimonials: number; unreadEnquiries: number; myOpenTasks: number };
  introId: string | null;
  logoUrl: string;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const location = pathname + "?" + search.toString();
  // The mobile menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === location;
  const setOpen = (v: boolean) => setOpenOn(v ? location : null);

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: session.role === "super_admin" ? "Tasks" : "My Tasks", href: "/admin/tasks", icon: ListChecks, badge: counts.myOpenTasks },
      ],
    },
    {
      title: "Website",
      items: [
        { label: "Home Page Sections", href: "/admin/r/sections", icon: LayoutTemplate },
        { label: "Hero Carousel", href: "/admin/r/slides", icon: Clapperboard },
        ...(introId ? [{ label: "About Page", href: `/admin/r/sections/${introId}`, icon: FileText }] : []),
        { label: "Services", href: "/admin/r/services", icon: Briefcase },
        { label: "Why Choose Us", href: "/admin/r/why", icon: Sparkles },
        { label: "Instagram Showcase", href: "/admin/r/instagram", icon: InstagramIcon as NavItem["icon"] },
        { label: "Announcements", href: "/admin/r/announcements", icon: Megaphone },
        { label: "Navigation Menu", href: "/admin/r/nav", icon: Navigation },
        { label: "Footer", href: "/admin/settings?tab=footer", icon: PanelBottom, superOnly: true },
      ],
    },
    {
      title: "Portfolio",
      items: [
        { label: "Projects", href: "/admin/r/portfolio", icon: Images },
        { label: "Categories", href: "/admin/r/categories", icon: FolderTree },
      ],
    },
    {
      title: "People & Leads",
      items: [
        { label: "Contact Enquiries", href: "/admin/enquiries", icon: Inbox, badge: counts.unreadEnquiries },
        { label: "Customer Feedback", href: "/admin/r/testimonials?filter=pending", icon: MessagesSquare, badge: counts.pendingTestimonials },
        { label: "Testimonials", href: "/admin/r/testimonials", icon: MessageSquareQuote },
        { label: "Team Members", href: "/admin/r/team", icon: Users },
      ],
    },
    {
      title: "Media",
      items: [
        { label: "Media Library", href: "/admin/media", icon: ImageIcon },
        { label: "Site Images", href: "/admin/media?kind=image", icon: ImageIcon },
        { label: "Site Videos", href: "/admin/media?kind=video", icon: Video },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Website Settings", href: "/admin/settings", icon: Settings, superOnly: true },
        { label: "Logo & Branding", href: "/admin/settings?tab=general", icon: Palette, superOnly: true },
        { label: "WhatsApp Settings", href: "/admin/settings?tab=whatsapp", icon: WhatsAppIcon as NavItem["icon"], superOnly: true },
        { label: "SEO Settings", href: "/admin/settings?tab=seo", icon: Search, superOnly: true },
        { label: "Analytics", href: "/admin/settings?tab=analytics", icon: BarChart3, superOnly: true },
        { label: "Social Links", href: "/admin/r/social", icon: Share2 },
        { label: "Admins & Users", href: "/admin/users", icon: UserCog, superOnly: true },
        { label: "Admin Security", href: "/admin/security", icon: KeyRound },
      ],
    },
  ];

  const current = pathname + (search.toString() ? `?${search.toString()}` : "");
  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href.includes("?")) return current === href;
    if (current !== pathname && groups.some((g) => g.items.some((i) => i.href.includes("?") && current === i.href))) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  async function logout() {
    try {
      await api("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-3 px-5 py-5" aria-label="Dashboard">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin-supplied logo
          <img src={logoUrl} alt="MIDE MEDIA PRODUCTION" className="h-11 w-auto object-contain" />
        ) : (
          <ApertureMark className="h-9 w-9 text-white" />
        )}
        <span className="font-display text-[0.6rem] font-semibold tracking-[0.35em] text-brand">BACKEND</span>
      </Link>
      <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((g) => {
          const items = g.items.filter((i) => !i.superOnly || session.role === "super_admin");
          if (!items.length) return null;
          return (
            <div key={g.title} className="mt-5">
              <p className="px-3 pb-2 text-[0.62rem] font-semibold tracking-[0.22em] text-white/35 uppercase">{g.title}</p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = isActive(item.href);
                  const IconCmp = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-[0.85rem] transition-colors",
                          active ? "bg-brand/15 font-medium text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                        )}
                      >
                        <IconCmp className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "")} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {!!item.badge && (
                          <span className="rounded-full bg-brand px-1.5 py-0.5 text-[0.65rem] leading-none font-bold text-black" aria-label={`${item.badge} new`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-white/[0.08] p-4 text-[0.68rem] text-white/35">Powered by Fodan Softnet Inc</div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/[0.08] bg-[#0f0f11] lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="relative h-full w-72 max-w-[85vw] border-r border-white/[0.08] bg-[#0f0f11]">
            <button type="button" onClick={() => setOpen(false)} className="adm-icon-btn absolute top-5 right-3" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.08] bg-[#0b0b0c]/90 px-4 backdrop-blur md:px-8">
          <button type="button" className="adm-icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-2">
            <a href="/preview" target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn-sm" title="Preview including drafts">
              <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Preview</span>
            </a>
            <a href="/" target="_blank" rel="noopener noreferrer" className="adm-btn adm-btn-sm">
              <ExternalLink className="h-3.5 w-3.5" /> <span className="hidden sm:inline">View site</span>
            </a>
            <div className="ml-2 hidden text-right sm:block">
              <p className="text-xs font-medium text-white">{session.name || "Administrator"}</p>
              <p className="text-[0.65rem] text-white/45">{session.role === "super_admin" ? "Super Admin" : "Admin"}</p>
            </div>
            <button type="button" onClick={logout} className="adm-icon-btn" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main id="main" className="px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
