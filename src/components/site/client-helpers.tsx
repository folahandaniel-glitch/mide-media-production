"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/icon";
import { whatsappLink } from "@/lib/utils";

/** Adds `.is-visible` to `.reveal` elements as they scroll into view. */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const observeAll = () =>
      document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => io.observe(el));
    observeAll();
    const mo = new MutationObserver(observeAll);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [pathname]);
  return null;
}

export function FloatingWhatsApp({ number, message }: { number: string; message: string }) {
  return (
    <a
      href={whatsappLink(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with MIDE MEDIA PRODUCTION on WhatsApp"
      className="animate-wa-pulse group fixed right-4 bottom-4 z-40 flex h-14 items-center gap-2 rounded-full bg-[#25d366] pr-4 pl-3.5 text-[#04210f] shadow-[0_12px_40px_-8px_rgba(37,211,102,0.6)] transition-transform hover:-translate-y-1 sm:right-6 sm:bottom-6 sm:pr-3.5"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="font-display text-xs font-semibold tracking-[0.12em] uppercase sm:hidden">Chat</span>
      <span className="hidden max-w-0 overflow-hidden font-display text-xs font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-all duration-500 group-hover:max-w-40 group-hover:pr-1 sm:inline">
        Chat with us
      </span>
    </a>
  );
}

/* ------------------------- Cross-component enquiries ------------------------ */

export const ENQUIRE_EVENT = "mmp:enquire";
export const FEEDBACK_EVENT = "mmp:feedback";

export type EnquireDetail = { service?: string; project?: string };

/** Pre-fills the contact form (on the homepage) or navigates there. */
export function useEnquire() {
  const router = useRouter();
  return (detail: EnquireDetail) => {
    const form = document.getElementById("contact");
    if (form) {
      window.dispatchEvent(new CustomEvent<EnquireDetail>(ENQUIRE_EVENT, { detail }));
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const q = new URLSearchParams();
    if (detail.service) q.set("service", detail.service);
    if (detail.project) q.set("project", detail.project);
    router.push(`/?${q.toString()}#contact`);
  };
}

export function openFeedback() {
  window.dispatchEvent(new Event(FEEDBACK_EVENT));
}

export function FeedbackButton({ children, className = "btn btn-primary" }: { children: React.ReactNode; className?: string }) {
  return (
    <button type="button" className={className} onClick={openFeedback}>
      {children}
    </button>
  );
}

export function EnquireButton({
  children,
  service,
  project,
  className = "btn btn-primary",
}: EnquireDetail & { children: React.ReactNode; className?: string }) {
  const enquire = useEnquire();
  return (
    <button type="button" className={className} onClick={() => enquire({ service, project })}>
      {children}
    </button>
  );
}
