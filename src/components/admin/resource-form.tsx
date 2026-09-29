"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Lock, Save, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { getResource, isFieldVisible, type Row } from "@/lib/admin/resources";
import { cn } from "@/lib/utils";
import { api, confirmAction } from "./client";
import { FieldInput } from "./fields";
import { Card, Spinner } from "./ui";

export function ResourceForm({ resourceKey, id }: { resourceKey: string; id: string }) {
  const resource = getResource(resourceKey)!;
  const router = useRouter();
  const isNew = id === "new";
  const [values, setValues] = useState<Record<string, unknown> | null>(isNew ? defaults() : null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  function defaults() {
    return Object.fromEntries(resource.fields.map((f) => [f.name, f.default ?? (f.type === "boolean" ? false : f.type === "gallery" || f.type === "repeater" ? [] : "")]));
  }

  useEffect(() => {
    if (isNew) return;
    api<{ row: Row }>(`/api/admin/r/${resourceKey}/${id}`)
      .then((r) => setValues({ ...defaults(), ...r.row }))
      .catch((e) => {
        toast((e as Error).message, "error");
        router.replace(`/admin/r/${resourceKey}`);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceKey, id]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!values) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading">
        <div className="skeleton h-10 w-72 rounded-lg" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  const set = (name: string, v: unknown) => {
    setValues((prev) => ({ ...prev!, [name]: v }));
    setDirty(true);
  };

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    const missing = resource.fields.find(
      (f) => f.required && isFieldVisible(f, values!) && (values![f.name] === "" || values![f.name] == null) && !(f.lockedBy && values![f.lockedBy]),
    );
    if (missing) {
      setError(`${missing.label} is required.`);
      document.getElementById(`f-${missing.name}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const res = await api<{ row: Row }>(`/api/admin/r/${resourceKey}`, { method: "POST", body: values });
        setDirty(false);
        toast(`${resource.singular} created.`);
        router.replace(`/admin/r/${resourceKey}/${res.row.id}`);
      } else {
        const res = await api<{ row: Row }>(`/api/admin/r/${resourceKey}/${id}`, { method: "PUT", body: values });
        // Keep client-only shapes (gallery list, section data fields) and take server-normalised columns.
        setValues((prev) => ({ ...prev!, ...res.row }));
        setDirty(false);
        const isDraft = res.row.status === "draft";
        toast(isDraft ? "Saved as draft — not visible on the website yet." : "Changes saved. The website has been updated.");
      }
    } catch (err) {
      setError((err as Error).message);
      toast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const ok = await confirmAction({
      title: `Delete ${resource.singular.toLowerCase()}?`,
      message: "This will permanently delete this item. This cannot be undone.",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api(`/api/admin/r/${resourceKey}/${id}`, { method: "DELETE" });
      setDirty(false);
      toast(`${resource.singular} deleted.`);
      router.push(`/admin/r/${resourceKey}`);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const title = String(values[resource.titleField] || "") || (isNew ? `New ${resource.singular.toLowerCase()}` : resource.singular);
  const previewHref = !isNew
    ? resourceKey === "portfolio"
      ? `/preview/portfolio/${values.slug}`
      : ["sections", "slides", "services", "team", "why", "instagram", "testimonials"].includes(resourceKey)
        ? `/preview${resourceKey === "sections" && values.anchor ? `#${values.anchor}` : ""}`
        : null
    : null;
  const canDelete = !isNew && (!resource.canDelete || resource.canDelete(values as Row));

  return (
    <form onSubmit={save} noValidate>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <Link href={`/admin/r/${resourceKey}`} className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> {resource.label}
          </Link>
          <h1 className="mt-2 truncate font-display text-2xl font-semibold text-white md:text-3xl">{title}</h1>
          {Boolean(values.builtIn) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
              <Lock className="h-3 w-3" /> Built-in section — type is fixed, but everything else is editable.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {previewHref && (
            <a href={previewHref} target="_blank" rel="noopener noreferrer" className="adm-btn">
              <Eye className="h-4 w-4" /> Preview
            </a>
          )}
          {canDelete && (
            <button type="button" className="adm-btn adm-btn-danger" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
          <Link href={`/admin/r/${resourceKey}`} className="adm-btn">
            Cancel
          </Link>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
            {saving ? <Spinner /> : <Save className="h-4 w-4" />} {isNew ? "Create" : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      {dirty && !saving && <p className="mb-4 text-xs text-amber-300/80">You have unsaved changes.</p>}

      <Card className="p-5 md:p-7">
        <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
          {resource.fields
            .filter((f) => isFieldVisible(f, values))
            .map((f) => {
              const locked = Boolean(f.lockedBy && values[f.lockedBy]);
              const bare = f.type === "boolean";
              return (
                <div key={f.name} className={cn(f.half ? "md:col-span-1" : "md:col-span-2")}>
                  {!bare && (
                    <label htmlFor={`f-${f.name}`} className="field-label">
                      {f.label} {f.required && <span className="text-brand">*</span>}
                    </label>
                  )}
                  <FieldInput field={f} id={`f-${f.name}`} value={values[f.name]} onChange={(v) => set(f.name, v)} disabled={locked} />
                  {f.help && <p className="mt-1.5 text-xs leading-relaxed text-white/40">{f.help}</p>}
                </div>
              );
            })}
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex justify-end gap-2 border-t border-white/[0.08] bg-[#0b0b0c]/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Link href={`/admin/r/${resourceKey}`} className="adm-btn">
          Cancel
        </Link>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
          {saving ? <Spinner /> : <Save className="h-4 w-4" />} {isNew ? "Create" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
