import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { clientIp, isSameOrigin, jsonError, rateLimit } from "@/lib/api";
import { plainText } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Invalid request origin.", 403);
  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return jsonError("Too many enquiries from this connection. Please try again later or reach us on WhatsApp.", 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.");
  }

  // Spam traps: honeypot filled, or submitted impossibly fast. Pretend success.
  if (body.website || Number(body.elapsed ?? 0) < 1500) return NextResponse.json({ ok: true });

  const name = plainText(body.name, 120);
  const email = plainText(body.email, 200).toLowerCase();
  const message = plainText(body.message, 4000);
  if (!name) return jsonError("Please enter your name.", 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Please enter a valid email address.", 422);
  if (message.length < 10) return jsonError("Please describe your project (at least 10 characters).", 422);

  const preferredDate = plainText(body.preferredDate, 20);
  await db.insert(schema.enquiries).values({
    name,
    email,
    message,
    phone: plainText(body.phone, 30),
    service: plainText(body.service, 120),
    preferredDate: /^\d{4}-\d{2}-\d{2}$/.test(preferredDate) ? preferredDate : "",
    budget: plainText(body.budget, 80),
    referral: plainText(body.referral, 120),
    project: plainText(body.project, 160),
  });

  return NextResponse.json({ ok: true });
}
