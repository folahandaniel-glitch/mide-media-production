import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession, type AdminSession } from "./auth";

/* ------------------------------ Rate limiting ------------------------------ */
// In-memory sliding window. On serverless this is per-instance (best effort);
// swap for Upstash/Redis if stronger guarantees are needed later.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
  return true;
}

export function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/* --------------------------------- CSRF ----------------------------------- */
/** Mutating requests must come from this site (Origin / Referer host must match Host). */
export function isSameOrigin(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!host || !origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* -------------------------------- Responses -------------------------------- */

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Ctx<P> = { params: Promise<P> };
type AdminHandler<P> = (req: NextRequest, ctx: { params: P; session: AdminSession }) => Promise<Response>;

/** Wraps an admin API handler: session check, role check, same-origin check, errors. */
export function adminRoute<P = Record<string, string>>(
  handler: AdminHandler<P>,
  opts: { role?: "super_admin" } = {},
) {
  return async (req: NextRequest, ctx: Ctx<P>) => {
    try {
      const session = await getSession();
      if (!session) return jsonError("Not authenticated", 401);
      if (opts.role && session.role !== opts.role) return jsonError("You do not have permission to do this.", 403);
      if (req.method !== "GET" && req.method !== "HEAD" && !isSameOrigin(req)) {
        return jsonError("Cross-site request blocked", 403);
      }
      const params = ctx?.params ? await ctx.params : ({} as P);
      return await handler(req, { params, session });
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.message, err.status);
      console.error("[admin api]", err);
      return jsonError("Something went wrong. Please try again.", 500);
    }
  };
}

/** Refresh every public page after content changes. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}
