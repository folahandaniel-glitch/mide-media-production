import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grain relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 text-center">
      <div className="light-leak absolute inset-0 -z-10" aria-hidden="true" />
      <div>
        <p className="eyebrow justify-center">Scene missing</p>
        <h1 className="display-title mt-6 text-[clamp(5rem,18vw,12rem)] text-white">404</h1>
        <p className="mx-auto mt-4 max-w-md text-white/65">This page didn&apos;t make the final cut. Let&apos;s get you back to the story.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Back to home</Link>
          <Link href="/portfolio" className="btn btn-ghost">See our work</Link>
        </div>
      </div>
    </main>
  );
}
