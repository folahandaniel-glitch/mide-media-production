"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "@/components/ui/toast";
import type { Field } from "@/lib/admin/resources";
import type { SettingsGroup, SettingsMap } from "@/lib/settings-defaults";
import { cn } from "@/lib/utils";
import { api } from "./client";
import { FieldInput } from "./fields";
import { Card, PageHeader, Spinner } from "./ui";

type SField = Field & { group: SettingsGroup };
type Tab = { key: string; label: string; description: string; fields: SField[] };

const f = (group: SettingsGroup, name: string, label: string, type: Field["type"], extra: Partial<Field> = {}): SField => ({ group, name, label, type, ...extra });

const TABS: Tab[] = [
  {
    key: "general",
    label: "General",
    description: "Company identity and contact details used across the website.",
    fields: [
      f("site", "companyName", "Company name", "text", { half: true }),
      f("site", "tagline", "Business category / tagline", "text", { half: true }),
      f("site", "logo", "Logo", "image", { help: "Click “Upload” or “Media library” to replace the logo. Use a transparent PNG, WEBP or SVG with light/white artwork — the website has a dark background. Then click “Save general settings” below." }),
      f("site", "logoAlt", "Logo alt text", "text", { half: true }),
      f("site", "favicon", "Favicon", "image", { help: "Square PNG/SVG, at least 512×512." }),
      f("site", "phone", "Phone", "text", { half: true }),
      f("site", "whatsappNumber", "WhatsApp number", "text", { half: true, help: "International format, e.g. +234 706 296 1288." }),
      f("site", "email", "Email (optional)", "email", { half: true }),
      f("site", "instagramHandle", "Instagram handle", "text", { half: true }),
      f("site", "instagramUrl", "Instagram URL", "url"),
      f("site", "locationText", "Location text", "text", { half: true }),
      f("site", "address", "Physical address (optional)", "text", { half: true, help: "Only add a real, verified office address." }),
      f("site", "brandColor", "Brand colour (hex)", "text", { half: true, placeholder: "#FF7A1A" }),
      f("site", "siteUrl", "Website URL", "url", { half: true, help: "e.g. https://www.midemediaproduction.com — used for SEO links." }),
    ],
  },
  {
    key: "hero",
    label: "Hero",
    description: "Buttons and motion for the homepage carousel. Slides themselves are managed under Hero Carousel.",
    fields: [
      f("hero", "animatedWords", "Animated words", "text", { help: "Separate with full stops, e.g. CAPTURE. CREATE. INSPIRE." }),
      f("hero", "primaryButtonText", "Primary button text", "text", { half: true }),
      f("hero", "primaryButtonUrl", "Primary button link", "url", { half: true }),
      f("hero", "secondaryButtonText", "WhatsApp button text", "text", { half: true }),
      f("hero", "autoplaySeconds", "Seconds per slide", "number", { half: true, min: 3, max: 30 }),
      f("hero", "showRecIndicator", "Show the “REC” camera overlay", "boolean"),
    ],
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "Pre-filled messages visitors send when they tap a WhatsApp button.",
    fields: [
      f("whatsapp", "floatingEnabled", "Show floating WhatsApp button", "boolean"),
      f("whatsapp", "defaultMessage", "Default message", "textarea"),
      f("whatsapp", "heroMessage", "Hero button message", "textarea"),
      f("whatsapp", "portfolioMessage", "Portfolio message", "textarea"),
      f("whatsapp", "weddingMessage", "Wedding enquiries message", "textarea", { help: "Also set per service under Services → WhatsApp message." }),
      f("whatsapp", "corporateMessage", "Corporate enquiries message", "textarea"),
      f("whatsapp", "teamMessage", "Team member message", "textarea"),
      f("whatsapp", "contactMessage", "Contact section message", "textarea"),
    ],
  },
  {
    key: "seo",
    label: "SEO",
    description: "How the website appears in Google and when shared on social media.",
    fields: [
      f("seo", "title", "Page title", "text", { max: 70, help: "Aim for 50–60 characters." }),
      f("seo", "description", "Meta description", "textarea", { max: 170, help: "Aim for 140–160 characters." }),
      f("seo", "keywords", "Keywords", "textarea", { help: "Comma separated." }),
      f("seo", "ogTitle", "Open Graph title", "text", { half: true }),
      f("seo", "canonicalUrl", "Canonical URL", "url", { half: true, help: "Usually your main domain. Leave empty for automatic." }),
      f("seo", "ogDescription", "Open Graph description", "textarea"),
      f("seo", "ogImage", "Open Graph image (1200×630)", "image"),
      f("seo", "robotsIndex", "Allow search engines to index this website", "boolean"),
    ],
  },
  {
    key: "footer",
    label: "Footer",
    description: "Footer text. The “Powered by Fodan Softnet Inc” credit is fixed.",
    fields: [f("site", "footerText", "Footer description", "textarea"), f("site", "copyright", "Copyright text", "text", { help: "The year is added automatically." })],
  },
  {
    key: "forms",
    label: "Forms",
    description: "Options and messages for the enquiry and feedback forms.",
    fields: [
      f("forms", "serviceOptions", "Service options (one per line)", "textarea"),
      f("forms", "budgetOptions", "Budget ranges (one per line)", "textarea"),
      f("forms", "referralOptions", "“How did you hear about us?” options (one per line)", "textarea"),
      f("forms", "contactSuccessMessage", "Enquiry success message", "textarea"),
      f("forms", "feedbackSuccessMessage", "Feedback success message", "textarea"),
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Connect Google Analytics 4 to measure website visits.",
    fields: [f("analytics", "googleAnalyticsId", "Google Analytics measurement ID", "text", { placeholder: "G-XXXXXXXXXX", help: "Found in Google Analytics → Admin → Data streams." })],
  },
];

export function SettingsForm({ initial, initialTab }: { initial: SettingsMap; initialTab?: string }) {
  const [tabKey, setTabKey] = useState(TABS.some((t) => t.key === initialTab) ? initialTab! : "general");
  const [values, setValues] = useState<SettingsMap>(initial);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const tab = TABS.find((t) => t.key === tabKey)!;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const groups = Array.from(new Set(tab.fields.map((x) => x.group)));
      for (const g of groups) {
        const body = Object.fromEntries(tab.fields.filter((x) => x.group === g).map((x) => [x.name, (values[g] as Record<string, unknown>)[x.name]]));
        const res = await api<{ values: SettingsMap[typeof g] }>("/api/admin/settings", { method: "PUT", body: { group: g, values: body } });
        setValues((v) => ({ ...v, [g]: res.values }));
      }
      toast("Settings saved. The website has been updated.");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Website Settings" description="Manage the website without touching code. Changes go live as soon as you save." />
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto rounded-xl border border-white/[0.08] bg-[#111113] p-1" role="tablist" aria-label="Settings sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={t.key === tabKey}
            onClick={() => {
              setTabKey(t.key);
              window.history.replaceState(null, "", `/admin/settings?tab=${t.key}`);
            }}
            className={cn("rounded-lg px-4 py-2 text-sm whitespace-nowrap transition", t.key === tabKey ? "bg-brand font-semibold text-black" : "text-white/65 hover:bg-white/5 hover:text-white")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form onSubmit={save}>
        <Card className="p-5 md:p-7">
          <p className="mb-6 text-sm text-white/55">{tab.description}</p>
          <div className="grid gap-6 md:grid-cols-2">
            {tab.fields.map((field) => {
              const v = (values[field.group] as Record<string, unknown>)[field.name];
              return (
                <div key={field.group + field.name} className={field.half ? "" : "md:col-span-2"}>
                  {field.type !== "boolean" && (
                    <label htmlFor={`s-${field.name}`} className="field-label">
                      {field.label}
                    </label>
                  )}
                  <FieldInput
                    field={field}
                    id={`s-${field.name}`}
                    value={v}
                    onChange={(nv) => setValues((prev) => ({ ...prev, [field.group]: { ...prev[field.group], [field.name]: nv } }))}
                  />
                  {field.help && <p className="mt-1.5 text-xs text-white/40">{field.help}</p>}
                  {field.max && typeof v === "string" && <p className={cn("mt-1 text-right text-[0.7rem]", v.length > field.max ? "text-red-400" : "text-white/35")}>{v.length} / {field.max}</p>}
                </div>
              );
            })}
          </div>
          {tabKey === "footer" && (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">
              Fixed footer credit: <strong className="text-white">Powered by Fodan Softnet Inc (08067578112)</strong> — followed by the discreet BACKEND link.
            </div>
          )}
        </Card>
        <div className="mt-6 flex justify-end">
          <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
            {saving ? <Spinner /> : <Save className="h-4 w-4" />} Save {tab.label.toLowerCase()} settings
          </button>
        </div>
      </form>
    </div>
  );
}
