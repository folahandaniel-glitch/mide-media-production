import { getSiteChrome } from "@/lib/content";
import { splitLines } from "@/lib/settings-defaults";
import { Header } from "./header";
import { Footer } from "./footer";
import { AnnouncementBar } from "./announcement-bar";
import { FeedbackDialog } from "./feedback-dialog";
import { FloatingWhatsApp, RevealObserver } from "./client-helpers";
import { Toaster } from "@/components/ui/toast";

/** Public website chrome: announcement, header, footer, floating WhatsApp, dialogs. */
export async function SiteFrame({ children, banner }: { children: React.ReactNode; banner?: React.ReactNode }) {
  const chrome = await getSiteChrome();
  const { settings, nav, announcements } = chrome;
  const site = settings.site;

  return (
    <>
      <a
        href="#main"
        className="fixed top-2 left-2 z-[200] -translate-y-20 rounded-md bg-brand px-4 py-2 font-semibold text-black transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      {banner}
      <AnnouncementBar items={announcements.map((a) => ({ id: a.id, message: a.message, linkText: a.linkText, linkUrl: a.linkUrl }))} />
      <Header
        nav={nav.map((n) => ({ id: n.id, label: n.label, href: n.href }))}
        logoUrl={site.logo}
        logoAlt={site.logoAlt}
        phone={site.phone}
        whatsappNumber={site.whatsappNumber}
        whatsappMessage={settings.whatsapp.defaultMessage}
        instagramUrl={site.instagramUrl}
        topOffset={announcements.length > 0}
      />
      <main id="main">{children}</main>
      <Footer chrome={chrome} />
      {settings.whatsapp.floatingEnabled && <FloatingWhatsApp number={site.whatsappNumber} message={settings.whatsapp.defaultMessage} />}
      <FeedbackDialog serviceOptions={splitLines(settings.forms.serviceOptions)} successMessage={settings.forms.feedbackSuccessMessage} />
      <RevealObserver />
      <Toaster />
    </>
  );
}
