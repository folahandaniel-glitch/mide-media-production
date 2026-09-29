import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { adminRoute, revalidateSite } from "@/lib/api";

/** Removes every sample portfolio project and placeholder team profile in one go. */
export const DELETE = adminRoute(
  async () => {
    const projects = await db
      .delete(schema.portfolioProjects)
      .where(eq(schema.portfolioProjects.isPlaceholder, true))
      .returning({ id: schema.portfolioProjects.id });
    const team = await db
      .delete(schema.teamMembers)
      .where(eq(schema.teamMembers.isPlaceholder, true))
      .returning({ id: schema.teamMembers.id });
    revalidateSite();
    return NextResponse.json({ ok: true, removed: { projects: projects.length, team: team.length } });
  },
  { role: "super_admin" },
);
