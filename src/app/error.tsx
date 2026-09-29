"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-6 text-center">
      <div>
        <p className="eyebrow justify-center">Technical difficulties</p>
        <h1 className="display-title mt-6 text-5xl text-white">Something went wrong</h1>
        <p className="mx-auto mt-4 max-w-md text-white/65">Please try again. If the problem continues, reach us on WhatsApp.</p>
        <button type="button" onClick={reset} className="btn btn-primary mt-8">Try again</button>
      </div>
    </main>
  );
}
