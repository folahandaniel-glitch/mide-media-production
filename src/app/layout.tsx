import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk } from "next/font/google";
import { getSiteChrome } from "@/lib/content";
import { splitLines } from "@/lib/settings-defaults";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteChrome();
  const { seo, site } = settings;
  const base = await siteUrl();
  const ogImage = seo.ogImage || site.logo || undefined;
  return {
    metadataBase: new URL(base),
    title: { default: seo.title, template: `%s | ${site.companyName}` },
    description: seo.description,
    keywords: splitLines(seo.keywords.replace(/,\s*/g, "\n")),
    applicationName: site.companyName,
    alternates: { canonical: seo.canonicalUrl || "/" },
    robots: seo.robotsIndex ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: site.companyName,
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      url: base,
      locale: "en_NG",
      images: ogImage ? [{ url: ogImage, alt: site.companyName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      images: ogImage ? [ogImage] : undefined,
    },
    icons: site.favicon ? { icon: site.favicon, apple: site.favicon } : undefined,
    formatDetection: { telephone: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#070707",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { settings } = await getSiteChrome();
  const brand = /^#[0-9a-f]{6}$/i.test(settings.site.brandColor) ? settings.site.brandColor : "#FF7A1A";
  const ga = settings.analytics.googleAnalyticsId;

  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} style={{ ["--brand" as string]: brand }}>
      <body className="min-h-screen bg-ink antialiased">
        {children}
        {ga && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
