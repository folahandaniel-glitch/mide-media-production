import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminRoute, jsonError } from "@/lib/api";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { plainText } from "@/lib/sanitize";

async function otherActiveSuperAdmins(id: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.adminUsers)
    .where(and(eq(schema.adminUsers.role, "super_admin"), eq(schema.adminUsers.active, true), ne(schema.adminUsers.id, id)));
  return Number(n);
}

export const PATCH = adminRoute<{ id: string }>(
  async (req, { params, session }) => {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const patch: Partial<typeof schema.adminUsers.$inferInsert> = {};
    if (typeof body.name === "string") patch.name = plainText(body.name, 120);
    if (body.role === "super_admin" || body.role === "editor") patch.role = body.role;
    if (typeof body.active === "boolean") patch.active = body.active;
    if (typeof body.password === "string" && body.password) {
      const weak = validatePasswordStrength(body.password);
      if (weak) return jsonError(weak, 422);
      patch.passwordHash = await hashPassword(body.password);
    }
    const demoting = patch.role === "editor" || patch.active === false;
    if (demoting && (await otherActiveSuperAdmins(params.id)) === 0) {
      return jsonError("At least one active Super Admin is required.", 409);
    }
    if (params.id === session.id && patch.active === false) return jsonError("You cannot deactivate your own account.", 409);
    if (!Object.keys(patch).length) return jsonError("Nothing to update.");
    // Role/password/status changes sign the user out everywhere.
    const [row] = await db
      .update(schema.adminUsers)
      .set({ ...patch, tokenVersion: sql`${schema.adminUsers.tokenVersion} + 1` })
      .where(eq(schema.adminUsers.id, params.id))
      .returning({ id: schema.adminUsers.id });
    if (!row) return jsonError("Not found", 404);
    return NextResponse.json({ ok: true });
  },
  { role: "super_admin" },
);

export const DELETE = adminRoute<{ id: string }>(
  async (_req, { params, session }) => {
    if (params.id === session.id) return jsonError("You cannot delete your own account.", 409);
    if ((await otherActiveSuperAdmins(params.id)) === 0) return jsonError("At least one active Super Admin is required.", 409);
    await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, params.id));
    return NextResponse.json({ ok: true });
  },
  { role: "super_admin" },
);
