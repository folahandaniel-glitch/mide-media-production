/**
 * Runs before `dev` and `build`: applies database migrations, seeds initial
 * content on an empty database, and creates the first Super Admin from env vars.
 */
import { existsSync, mkdirSync } from "node:fs";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "../src/db/schema";
import { seedDatabase } from "../src/db/seed";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) {
    try {
      process.loadEnvFile(file);
    } catch {
      /* ignore malformed env files */
    }
  }
}

async function main() {
  const url = process.env.DATABASE_URL || "file:./data/local.db";
  if (process.env.VERCEL && !process.env.DATABASE_URL) {
    console.error(
      "\n✖ DATABASE_URL is not set. On Vercel, create a Turso database and set DATABASE_URL and DATABASE_AUTH_TOKEN.\n",
    );
    process.exit(1);
  }
  if (url.startsWith("file:")) mkdirSync("data", { recursive: true });

  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("✓ Database schema is up to date");

  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.sections);
  if (Number(n) === 0) {
    await seedDatabase(db);
    console.log("✓ Seeded initial content (sample items are marked as placeholders)");
  }

  const [{ admins }] = await db.select({ admins: sql<number>`count(*)` }).from(schema.adminUsers);
  if (Number(admins) === 0) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const hash =
      process.env.ADMIN_PASSWORD_HASH?.trim() ||
      (process.env.ADMIN_PASSWORD ? await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) : "");
    if (email && hash) {
      await db.insert(schema.adminUsers).values({ email, name: "Super Admin", passwordHash: hash, role: "super_admin" });
      console.log(`✓ Created Super Admin account for ${email}`);
    } else {
      console.warn("! No admin exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD to create the first Super Admin.");
    }
  }
  client.close();
}

main().catch((err) => {
  console.error("✖ Database setup failed:", err);
  process.exit(1);
});
