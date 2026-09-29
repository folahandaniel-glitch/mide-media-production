import Link from "next/link";
import type { Metadata } from "next";
import { Eye } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { SiteFrame } from "@/components/site/site-frame";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return (
    <SiteFrame
      banner={
        <div className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-3 rounded-full border border-brand/40 bg-black/90 px-4 py-2 text-xs text-white shadow-2xl backdrop-blur">
          <Eye className="h-4 w-4 text-brand" aria-hidden="true" />
          <span>Preview mode — drafts and hidden sections are visible to you only.</span>
          <Link href="/admin" className="rounded-full bg-brand px-3 py-1 font-semibold text-black">
            Back to admin
          </Link>
        </div>
      }
    >
      {children}
    </SiteFrame>
  );
}
