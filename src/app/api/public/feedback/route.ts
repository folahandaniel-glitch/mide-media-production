import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { HttpError, clientIp, isSameOrigin, jsonError, rateLimit } from "@/lib/api";
import { plainText } from "@/lib/sanitize";
import { saveUpload } from "@/lib/storage";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Invalid request origin.", 403);
  if (!rateLimit(`feedback:${clientIp(req)}`, 4, 30 * 60 * 1000)) {
    return jsonError("Too many submissions. Please try again later.", 429);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Invalid request.");
  }

  if (form.get("website") || Number(form.get("elapsed") ?? 0) < 2000) return NextResponse.json({ ok: true });

  const name = plainText(form.get("name"), 120);
  const email = plainText(form.get("email"), 200).toLowerCase();
  const message = plainText(form.get("message"), 2000);
  const consent = form.get("consent") === "yes";
  const rating = Math.min(5, Math.max(1, Math.round(Number(form.get("rating")) || 5)));

  if (!name) return jsonError("Please enter your full name.", 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Please enter a valid email address.", 422);
  if (message.length < 10) return jsonError("Please write a little more about your experience.", 422);
  if (!consent) return jsonError("Please confirm consent so we can display your testimonial.", 422);

  let photo = "";
  const file = form.get("photo");
  if (file instanceof File && file.size > 0) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return jsonError("Photos must be JPG, PNG or WEBP.", 415);
    if (file.size > 4 * 1024 * 1024) return jsonError("Photo is too large (max 4MB).", 413);
    try {
      photo = (await saveUpload(file, "feedback")).url;
    } catch (err) {
      if (err instanceof HttpError) return jsonError(err.message, err.status);
      throw err;
    }
  }

  await db.insert(schema.testimonials).values({
    name,
    email,
    message,
    rating,
    consent,
    photo,
    phone: plainText(form.get("phone"), 30),
    service: plainText(form.get("service"), 120),
    status: "pending", // never auto-published
    source: "website",
  });

  return NextResponse.json({ ok: true });
}
