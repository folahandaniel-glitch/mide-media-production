import { NextResponse, type NextRequest } from "next/server";
import { authenticate, createSessionCookie } from "@/lib/auth";
import { clientIp, isSameOrigin, jsonError, rateLimit } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Invalid request origin.", 403);
  const ip = clientIp(req);
  if (!rateLimit(`login:${ip}`, 8, 15 * 60 * 1000)) {
    return jsonError("Too many sign-in attempts. Please wait 15 minutes and try again.", 429);
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.");
  }
  const email = typeof body.email === "string" ? body.email.slice(0, 200) : "";
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!email || !password) return jsonError("Enter your email and password.", 422);

  try {
    const user = await authenticate(email, password);
    if (!user) return jsonError("Incorrect email or password.", 401);
    await createSessionCookie(user);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[login]", err);
    return jsonError("Sign-in is temporarily unavailable. Check the server configuration (AUTH_SECRET).", 500);
  }
}
