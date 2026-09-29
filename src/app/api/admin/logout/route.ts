import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/auth";
import { isSameOrigin, jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError("Invalid request origin.", 403);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
