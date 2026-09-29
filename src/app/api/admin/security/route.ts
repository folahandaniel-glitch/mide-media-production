import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminRoute, jsonError, rateLimit } from "@/lib/api";
import { createSessionCookie, hashPassword, validatePasswordStrength } from "@/lib/auth";

/** Change own password, or sign out of all other devices. */
export const POST = adminRoute(async (req, { session }) => {
  const body = (await req.json().catch(() => ({}))) as { action?: string; currentPassword?: string; newPassword?: string };
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, session.id) });
  if (!user) return jsonError("Not found", 404);

  if (body.action === "signout-all") {
    const [u] = await db
      .update(schema.adminUsers)
      .set({ tokenVersion: sql`${schema.adminUsers.tokenVersion} + 1` })
      .where(eq(schema.adminUsers.id, user.id))
      .returning();
    await createSessionCookie(u!);
    return NextResponse.json({ ok: true });
  }

  if (!rateLimit(`pw:${user.id}`, 6, 15 * 60 * 1000)) return jsonError("Too many attempts. Try again later.", 429);
  const ok = await bcrypt.compare(body.currentPassword ?? "", user.passwordHash);
  if (!ok) return jsonError("Your current password is incorrect.", 401);
  const weak = validatePasswordStrength(body.newPassword ?? "");
  if (weak) return jsonError(weak, 422);
  const [u] = await db
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(body.newPassword!), tokenVersion: sql`${schema.adminUsers.tokenVersion} + 1` })
    .where(eq(schema.adminUsers.id, user.id))
    .returning();
  await createSessionCookie(u!);
  return NextResponse.json({ ok: true });
});
