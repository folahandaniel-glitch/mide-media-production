import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";
import { ApertureMark } from "@/components/site/logo";
import { getAllSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && /^\/(admin|preview)(\/|\?|#|$)/.test(next) ? next : "/admin";
  if (await getSession()) redirect(safeNext);
  const { site } = await getAllSettings();

  return (
    <main className="grain relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4 py-12">
      <div className="light-leak absolute inset-0 -z-10 opacity-70" aria-hidden="true" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          {site.logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-supplied logo
            <img src={site.logo} alt={site.logoAlt} className="h-24 w-auto object-contain" />
          ) : (
            <ApertureMark className="h-14 w-14 text-white" />
          )}
          <h1 className={site.logo ? "sr-only" : "mt-5 font-display text-2xl font-semibold text-white"}>MIDE MEDIA PRODUCTION</h1>
          <p className="mt-1 font-display text-xs tracking-[0.35em] text-brand">SECURE BACKEND</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/60 p-7 shadow-2xl backdrop-blur-xl md:p-9">
          <LoginForm next={safeNext} />
        </div>
        <p className="mt-6 text-center text-xs text-white/35">Authorised administrators only. Access attempts are rate-limited.</p>
      </div>
    </main>
  );
}
