import "server-only";
import { db, schema } from "@/db";
import { plainText, safeUrl } from "./sanitize";
import { defaultSettings, mergeSettings, settingsGroups, type SettingsGroup, type SettingsMap } from "./settings-defaults";
import { safeJson } from "./utils";

export async function getAllSettings(): Promise<SettingsMap> {
  const rows = await db.select().from(schema.settings);
  const byKey = new Map(rows.map((r) => [r.key, safeJson<unknown>(r.value, {})]));
  const out = {} as Record<SettingsGroup, unknown>;
  for (const g of settingsGroups) out[g] = mergeSettings(g, byKey.get(g));
  return out as SettingsMap;
}

const URL_KEYS = new Set(["logo", "favicon", "ogImage", "instagramUrl", "canonicalUrl", "siteUrl", "primaryButtonUrl"]);
const LONG_KEYS = new Set(["serviceOptions", "budgetOptions", "referralOptions", "description", "keywords", "footerText"]);

export function cleanSettings<G extends SettingsGroup>(group: G, input: Record<string, unknown>): SettingsMap[G] {
  const base = defaultSettings[group] as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(base)) {
    const v = input[k];
    if (v === undefined) continue;
    if (typeof def === "boolean") out[k] = v === true || v === "true" || v === "on";
    else if (typeof def === "number") {
      const n = Number(v);
      out[k] = Number.isFinite(n) ? Math.max(0, Math.min(3600, n)) : def;
    } else if (URL_KEYS.has(k)) out[k] = safeUrl(v);
    else if (k === "brandColor") out[k] = /^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : def;
    else if (k === "googleAnalyticsId") {
      const s = String(v).trim().toUpperCase();
      out[k] = /^(G|UA|GT|AW)-[A-Z0-9-]{4,20}$/.test(s) ? s : "";
    } else out[k] = plainText(v, LONG_KEYS.has(k) ? 4000 : 600);
  }
  return mergeSettings(group, out);
}

export async function saveSettings<G extends SettingsGroup>(group: G, input: Record<string, unknown>) {
  const current = (await getAllSettings())[group] as Record<string, unknown>;
  const cleaned = cleanSettings(group, { ...current, ...input });
  await db
    .insert(schema.settings)
    .values({ key: group, value: JSON.stringify(cleaned) })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: JSON.stringify(cleaned), updatedAt: new Date() } });
  return cleaned;
}
