"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Logo } from "./logo";
import { InstagramIcon, WhatsAppIcon } from "@/components/ui/icon";
import { cn, telLink, whatsappLink } from "@/lib/utils";

type NavLink = { id: string; label: string; href: string };

export function Header({
  nav,
  logoUrl,
  logoAlt,
  phone,
  whatsappNumber,
  whatsappMessage,
  instagramUrl,
  topOffset = false,
}: {
  nav: NavLink[];
  logoUrl: string;
  logoAlt: string;
  phone: string;
  whatsappNumber: string;
  whatsappMessage: string;
  instagramUrl: string;
  topOffset?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean | ((v: boolean) => boolean)) =>
    setOpenOn((prev) => {
      const value = typeof next === "function" ? next(prev === pathname) : next;
      return value ? pathname : null;
    });
  const [active, setActive] = useState<string>("");
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently in view (homepage anchors).
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = nav.map((n) => n.href.split("#")[1]).filter(Boolean) as string[];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname, nav]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>("a,button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && menuRef.current) {
        const f = Array.from(menuRef.current.querySelectorAll<HTMLElement>("a,button"));
        if (!f.length) return;
        const [a, b] = [f[0]!, f[f.length - 1]!];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setOpen is recreated each render; behaviour only depends on `open`
  }, [open]);

  const isActive = (href: string) => {
    const [path, hash] = href.split("#");
    if (hash) return pathname === (path || "/") && active === hash;
    return path !== "/" && pathname.startsWith(path!);
  };

  const solid = scrolled || pathname !== "/";

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 z-50 transition-all duration-500",
          topOffset ? "top-[var(--announce-h,0px)]" : "top-0",
          solid ? "border-b border-white/[0.06] bg-black/80 backdrop-blur-xl" : "bg-gradient-to-b from-black/70 to-transparent",
        )}
      >
        <div className="container-cinema flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" aria-label={`${logoAlt.replace(/ logo$/i, "")} — home`} className="shrink-0">
            <Logo logoUrl={logoUrl} alt={logoAlt} />
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1 xl:gap-2">
              {nav.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      "relative px-3 py-2 font-display text-[0.72rem] font-medium tracking-[0.2em] text-white/75 transition-colors hover:text-white",
                      isActive(item.href) && "text-white",
                    )}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {item.label}
                    <span
                      className={cn(
                        "absolute inset-x-3 -bottom-0.5 h-px origin-left scale-x-0 bg-brand transition-transform duration-500",
                        isActive(item.href) && "scale-x-100",
                      )}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/#contact" className="btn btn-primary hidden !min-h-11 !px-5 sm:inline-flex">
              Book / Contact Us
            </Link>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white transition hover:border-brand hover:text-brand lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!open}
        className="fixed inset-0 z-40 overflow-y-auto bg-ink/[0.97] backdrop-blur-xl lg:hidden"
      >
        <div className="light-leak absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="container-cinema relative flex min-h-full flex-col pb-10 pt-[calc(var(--header-h)+2rem)]">
          <nav aria-label="Mobile">
            <ul className="space-y-1">
              {nav.map((item, i) => (
                <li key={item.id} className="animate-fade-up" style={{ animationDelay: `${60 + i * 50}ms` }}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline gap-4 border-b border-white/[0.07] py-4 font-display text-3xl font-semibold tracking-tight text-white transition-colors hover:text-brand"
                  >
                    <span className="text-xs font-medium tracking-[0.2em] text-brand">{String(i + 1).padStart(2, "0")}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-10 grid gap-3">
            <Link href="/#contact" onClick={() => setOpen(false)} className="btn btn-primary w-full">
              Book / Contact Us
            </Link>
            <a href={whatsappLink(whatsappNumber, whatsappMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
              <WhatsAppIcon className="h-5 w-5" /> Chat on WhatsApp
            </a>
          </div>
          <div className="mt-auto flex items-center justify-between pt-10 text-sm text-white/60">
            <a href={telLink(phone)} className="flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4 text-brand" aria-hidden="true" /> {phone}
            </a>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white">
              <InstagramIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
