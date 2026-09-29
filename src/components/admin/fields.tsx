"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Film, GripVertical, ImagePlus, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { Icon } from "@/components/ui/icon";
import { cn, parseVideo } from "@/lib/utils";
import type { Field } from "@/lib/admin/resources";
import { api, uploadFiles, type MediaRow } from "./client";
import { MediaBrowser } from "./media-browser";
import { Spinner, Switch } from "./ui";

// The editor is browser-only; loading it lazily also keeps it out of pages that don't need it.
const RichTextEditor = dynamic(() => import("./rich-text").then((m) => m.RichTextEditor), {
  ssr: false,
  loading: () => <div className="skeleton h-[230px] rounded-xl" />,
});

type Values = Record<string, unknown>;

/* ------------------------------ Media picker ------------------------------ */

export function MediaPickerModal({
  open,
  onClose,
  kind,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  kind?: "image" | "video";
  onPick: (row: MediaRow) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={kind === "video" ? "Choose a video" : "Choose an image"} wide>
      <div className="px-6 pt-3 pb-6">{open && <MediaBrowser mode="pick" kind={kind} onPick={onPick} />}</div>
    </Modal>
  );
}

function MediaField({ id, value, onChange, kind }: { id: string; value: string; onChange: (v: string) => void; kind: "image" | "video" }) {
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const video = kind === "video" ? parseVideo(value) : null;

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const { blob } = await api<{ blob: boolean }>("/api/admin/media?meta=1");
      const [row] = await uploadFiles([files[0]!], { blob, category: kind === "video" ? "videos" : "images" });
      if (row) onChange(row.url);
      toast("Uploaded.");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.02] p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative grid h-24 w-full shrink-0 place-items-center overflow-hidden rounded-lg bg-black/50 sm:w-40">
          {value ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : video?.kind === "youtube" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={video.thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <Film className="h-8 w-8 text-brand" aria-hidden="true" />
            )
          ) : kind === "image" ? (
            <ImagePlus className="h-7 w-7 text-white/25" aria-hidden="true" />
          ) : (
            <Film className="h-7 w-7 text-white/25" aria-hidden="true" />
          )}
          {busy && (
            <span className="absolute inset-0 grid place-items-center bg-black/70">
              <Spinner className="h-6 w-6 text-brand" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={kind === "video" ? "Upload, choose, or paste an MP4 / YouTube / Vimeo URL" : "Upload, choose, or paste an image URL"}
            className="field !py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className="adm-btn adm-btn-sm" onClick={() => fileRef.current?.click()} disabled={busy}>
              <UploadCloud className="h-3.5 w-3.5" /> Upload
            </button>
            <button type="button" className="adm-btn adm-btn-sm" onClick={() => setPicker(true)}>
              Media library
            </button>
            {value && (
              <button type="button" className="adm-btn adm-btn-sm" onClick={() => onChange("")}>
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={kind === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/svg+xml"}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => upload(e.target.files)}
      />
      <MediaPickerModal
        open={picker}
        onClose={() => setPicker(false)}
        kind={kind}
        onPick={(row) => {
          onChange(row.url);
          setPicker(false);
        }}
      />
    </div>
  );
}

/* ------------------------------ Gallery field ----------------------------- */

type GalleryItem = { url: string; alt: string };

function GalleryField({ value, onChange }: { value: GalleryItem[]; onChange: (v: GalleryItem[]) => void }) {
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    try {
      const { blob } = await api<{ blob: boolean }>("/api/admin/media?meta=1");
      const rows = await uploadFiles(Array.from(files), { blob, category: "portfolio", onProgress: setBusy });
      onChange([...value, ...rows.map((r) => ({ url: r.url, alt: r.alt }))]);
      toast(`${rows.length} image${rows.length > 1 ? "s" : ""} added.`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.02] p-3">
      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((g, i) => (
            <li
              key={g.url + i}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn("overflow-hidden rounded-lg border border-white/10 bg-black/40", dragIndex === i && "opacity-40")}
            >
              <div className="relative aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt={g.alt} className="h-full w-full object-cover" />
                <span className="absolute top-1.5 left-1.5 cursor-grab rounded bg-black/70 p-1 text-white/70" aria-hidden="true">
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <span className="absolute top-1.5 right-1.5 flex gap-1">
                  <button type="button" onClick={() => move(i, i - 1)} className="rounded bg-black/70 p-1 text-white/80 hover:text-brand" aria-label={`Move image ${i + 1} earlier`}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, i + 1)} className="rounded bg-black/70 p-1 text-white/80 hover:text-brand" aria-label={`Move image ${i + 1} later`}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded bg-black/70 p-1 text-red-300 hover:text-red-400" aria-label={`Remove image ${i + 1}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
              <label className="sr-only" htmlFor={`g-alt-${i}`}>Alt text for image {i + 1}</label>
              <input
                id={`g-alt-${i}`}
                value={g.alt}
                onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                placeholder="Alt text"
                className="w-full border-t border-white/10 bg-transparent px-2 py-1.5 text-xs text-white placeholder:text-white/35 focus:outline-none"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-center text-sm text-white/45">No gallery images yet.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => fileRef.current?.click()} disabled={!!busy}>
          <UploadCloud className="h-3.5 w-3.5" /> Upload images
        </button>
        <button type="button" className="adm-btn adm-btn-sm" onClick={() => setPicker(true)}>
          Add from library
        </button>
        {busy && (
          <span className="flex items-center gap-2 text-xs text-white/60" role="status">
            <Spinner /> {busy}
          </span>
        )}
      </div>
      <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => upload(e.target.files)} />
      <MediaPickerModal
        open={picker}
        onClose={() => setPicker(false)}
        kind="image"
        onPick={(row) => {
          onChange([...value, { url: row.url, alt: row.alt }]);
          toast("Image added to gallery.");
        }}
      />
    </div>
  );
}

/* ------------------------------ Relation select ---------------------------- */

function RelationSelect({ id, resource, value, onChange }: { id: string; resource: string; value: string; onChange: (v: string) => void }) {
  const [opts, setOpts] = useState<{ id: string; label: string }[] | null>(null);
  useEffect(() => {
    api<{ rows: Record<string, string>[] }>(`/api/admin/r/${resource}`)
      .then((r) => setOpts(r.rows.map((x) => ({ id: x.id!, label: x.name || x.title || x.label || x.id! }))))
      .catch(() => setOpts([]));
  }, [resource]);
  return (
    <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} disabled={!opts}>
      <option value="">{opts ? "— None —" : "Loading…"}</option>
      {opts?.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* --------------------------------- Repeater -------------------------------- */

function RepeaterField({ field, value, onChange, idPrefix }: { field: Field; value: Values[]; onChange: (v: Values[]) => void; idPrefix: string }) {
  const sub = field.subfields ?? [];
  const blank = () => Object.fromEntries(sub.map((s) => [s.name, s.default ?? ""]));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x!);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-xs tracking-[0.2em] text-white/45 uppercase">Item {i + 1}</span>
            <span className="flex gap-1">
              <button type="button" className="adm-icon-btn" onClick={() => move(i, i - 1)} aria-label={`Move item ${i + 1} up`}>
                <ArrowUp className="h-4 w-4" />
              </button>
              <button type="button" className="adm-icon-btn" onClick={() => move(i, i + 1)} aria-label={`Move item ${i + 1} down`}>
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" className="adm-icon-btn hover:!text-red-400" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove item ${i + 1}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </div>
          <div className={cn("grid gap-3", sub.length > 1 && "sm:grid-cols-2")}>
            {sub.map((sf) => (
              <div key={sf.name} className={cn((sf.type === "textarea" || sf.type === "image") && "sm:col-span-2")}>
                <FieldInput
                  field={sf}
                  id={`${idPrefix}-${i}-${sf.name}`}
                  value={item[sf.name]}
                  onChange={(v) => onChange(value.map((x, j) => (j === i ? { ...x, [sf.name]: v } : x)))}
                  showLabel
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button type="button" className="adm-btn adm-btn-sm" onClick={() => onChange([...value, blank()])}>
        <Plus className="h-3.5 w-3.5" /> Add {field.label.toLowerCase().replace(/s$/, "")}
      </button>
    </div>
  );
}

/* ------------------------------- Field input ------------------------------- */

export function FieldInput({
  field,
  id,
  value,
  onChange,
  disabled,
  showLabel,
}: {
  field: Field;
  id: string;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
  showLabel?: boolean;
}) {
  const str = value == null ? "" : String(value);
  const label = showLabel ? (
    <label htmlFor={id} className="field-label">
      {field.label}
    </label>
  ) : null;

  switch (field.type) {
    case "richtext":
      return <RichTextEditor id={id} value={str} onChange={onChange} label={field.label} />;
    case "textarea":
      return (
        <>
          {label}
          <textarea
            id={id}
            className={cn("field resize-y", field.name === "html" && "font-mono text-xs")}
            rows={field.name === "html" ? 12 : 4}
            maxLength={field.max}
            value={str}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3">
          <span id={`${id}-label`} className="text-sm text-white/85">
            {field.label}
          </span>
          <Switch checked={Boolean(value)} onChange={onChange} label={field.label} disabled={disabled} />
        </div>
      );
    case "select":
      return (
        <>
          {label}
          <select id={id} className="field" value={str} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </>
      );
    case "icon":
      return (
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
            <Icon name={str} className="h-5 w-5" />
          </span>
          <select id={id} className="field" value={str} onChange={(e) => onChange(e.target.value)}>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );
    case "relation":
      return <RelationSelect id={id} resource={field.relation!} value={str} onChange={onChange} />;
    case "image":
      return (
        <>
          {label}
          <MediaField id={id} kind="image" value={str} onChange={onChange} />
        </>
      );
    case "video":
      return <MediaField id={id} kind="video" value={str} onChange={onChange} />;
    case "gallery":
      return <GalleryField value={Array.isArray(value) ? (value as GalleryItem[]) : []} onChange={onChange} />;
    case "repeater":
      return <RepeaterField field={field} idPrefix={id} value={Array.isArray(value) ? (value as Values[]) : []} onChange={onChange} />;
    case "number":
      return (
        <>
          {label}
          <input id={id} type="number" className="field" min={field.min} max={field.max} value={str} onChange={(e) => onChange(e.target.value)} />
        </>
      );
    case "date":
      return (
        <>
          {label}
          <input id={id} type="date" className="field [color-scheme:dark]" value={str} onChange={(e) => onChange(e.target.value)} />
        </>
      );
    case "email":
    case "url":
    case "tags":
    case "text":
    default:
      return (
        <>
          {label}
          <input
            id={id}
            type={field.type === "email" ? "email" : field.type === "url" ? "text" : "text"}
            inputMode={field.type === "url" ? "url" : undefined}
            className="field"
            maxLength={field.max}
            value={str}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </>
      );
  }
}
