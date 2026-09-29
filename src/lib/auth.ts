import "server-only";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession } from "./auth-token";

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "editor";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function validatePasswordStrength(password: string) {
  if (password.length < 10) return "Password must be at least 10 characters long.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must contain letters and numbers.";
  return null;
}

/**
 * Creates the first Super Admin from ADMIN_EMAIL / ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH)
 * when no administrator exists yet. Credentials never live in source code.
 */
export async function ensureBootstrapAdmin() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(schema.adminUsers);
  if (Number(count) > 0) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const hash =
    process.env.ADMIN_PASSWORD_HASH?.trim() ||
    (process.env.ADMIN_PASSWORD ? await hashPassword(process.env.ADMIN_PASSWORD) : "");
  if (!email || !hash) return;
  await db
    .insert(schema.adminUsers)
    .values({ email, name: "Super Admin", passwordHash: hash, role: "super_admin" })
    .onConflictDoNothing();
}

// Dummy compare so unknown emails take as long as wrong passwords.
let dummyHash: string | null = null;

export async function authenticate(emailInput: string, password: string) {
  await ensureBootstrapAdmin();
  const email = emailInput.trim().toLowerCase();
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.email, email) });
  dummyHash ??= await bcrypt.hash("timing-equaliser", 12);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
  if (!user || !ok || !user.active) return null;
  await db.update(schema.adminUsers).set({ lastLoginAt: new Date() }).where(eq(schema.adminUsers.id, user.id));
  return user;
}

export async function createSessionCookie(user: { id: string; email: string; role: "super_admin" | "editor"; tokenVersion: number }) {
  const token = await signSession({ sub: user.id, email: user.email, role: user.role, ver: user.tokenVersion });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Verifies the cookie AND re-checks the user in the database (revocation, deactivation). */
export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const payload = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const user = await db.query.adminUsers.findFirst({ where: eq(schema.adminUsers.id, payload.sub) });
  if (!user || !user.active || user.tokenVersion !== payload.ver) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function requireAdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
