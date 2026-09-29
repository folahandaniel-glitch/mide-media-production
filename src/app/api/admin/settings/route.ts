import { NextResponse } from "next/server";
import { adminRoute, jsonError, revalidateSite } from "@/lib/api";
import { getAllSettings, saveSettings } from "@/lib/settings";
import { settingsGroups, type SettingsGroup } from "@/lib/settings-defaults";

export const GET = adminRoute(async () => {
  return NextResponse.json({ ok: true, settings: await getAllSettings() });
});

export const PUT = adminRoute(
  async (req) => {
    const body = (await req.json().catch(() => null)) as { group?: string; values?: Record<string, unknown> } | null;
    if (!body?.group || !settingsGroups.includes(body.group as SettingsGroup) || typeof body.values !== "object") {
      return jsonError("Invalid settings payload.");
    }
    const saved = await saveSettings(body.group as SettingsGroup, body.values ?? {});
    revalidateSite();
    return NextResponse.json({ ok: true, values: saved });
  },
  { role: "super_admin" },
);
