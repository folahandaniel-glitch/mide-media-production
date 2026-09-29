import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminRoute, jsonError } from "@/lib/api";
import { hashPassword, validatePasswordStrength } from "@/lib/auth";
import { plainText } from "@/lib/sanitize";

const publicFields = {
  id: schema.adminUsers.id,
  email: schema.adminUsers.email,
  name: schema.adminUsers.name,
  role: schema.adminUsers.role,
  active: schema.adminUsers.active,
  lastLoginAt: schema.adminUsers.lastLoginAt,
  createdAt: schema.adminUsers.createdAt,
};

export const GET = adminRoute(
  async () => {
    const rows = await db.select(publicFields).from(schema.adminUsers).orderBy(asc(schema.adminUsers.createdAt));
    return NextResponse.json({ ok: true, rows });
  },
  { role: "super_admin" },
);

export const POST = adminRoute(
  async (req) => {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const email = plainText(body.email, 200).toLowerCase();
    const name = plainText(body.name, 120);
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role === "super_admin" ? "super_admin" : "editor";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Enter a valid email address.", 422);
    const weak = validatePasswordStrength(password);
    if (weak) return jsonError(weak, 422);
    try {
      const [row] = await db
        .insert(schema.adminUsers)
        .values({ email, name, role, passwordHash: await hashPassword(password) })
        .returning(publicFields);
      return NextResponse.json({ ok: true, row }, { status: 201 });
    } catch {
      return jsonError("An administrator with this email already exists.", 409);
    }
  },
  { role: "super_admin" },
);
