"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Film, Link2, Search, Star, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn, formatBytes, formatDate } from "@/lib/utils";
import { api, confirmAction, uploadFiles, type MediaRow } from "./client";
import { Spinner, Switch } from "./ui";

type Kind = "image" | "video" | "";

export function MediaBrowser({
  mode = "manage",
  kind: fixedKind,
  onPick,
}: {
  mode?: "manage" | "pick";
  kind?: "image" | "video";
  onPick?: (row: MediaRow) => void;
}) {
  const [rows, setRows] = useState<MediaRow[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [blob, setBlob] = useState(false);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>(fixedKind ?? "");
  const [category, setCategory] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [selected, setSelected] = useState<MediaRow | null>(null);
  const [progress, setProgress] = useState("");
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (kind) params.set("kind", kind);
    if (category) params.set("category", category);
    try {
      const res = await api<{ rows: MediaRow[]; categories: string[]; blob: boolean }>(`/api/admin/media?${params}`);
      setRows(res.rows);
      setCategories(res.categories);
      setBlob(res.blob);
    } catch (e) {
      toast((e as Error).message, "error");
      setRows([]);
    }
  }, [q, kind, category]);

  useEffect(() => {
    const t = window.setTimeout(load, q ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [load, q]);

  async function handleFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (!files.length) return;
    try {
      const added = await uploadFiles(files, { category: uploadCategory, blob, onProgress: setProgress });
      toast(`${added.length} file${added.length > 1 ? "s" : ""} uploaded and optimised.`);
      await load();
      if (mode === "pick" && added.length === 1) onPick?.(added[0]!);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setProgress("");
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function addByUrl() {
    if (!urlInput.trim()) return;
    try {
      const { row } = await api<{ row: MediaRow }>("/api/admin/media", { method: "POST", body: { url: urlInput.trim(), category: uploadCategory } });
      setUrlInput("");
      toast("Media added to the library.");
      await load();
      if (mode === "pick") onPick?.(row);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function update(row: MediaRow, patch: Partial<MediaRow>) {
    try {
      const res = await api<{ row: MediaRow }>(`/api/admin/media/${row.id}`, { method: "PATCH", body: patch });
      setRows((rs) => rs?.map((r) => (r.id === row.id ? res.row : r)) ?? null);
      setSelected(res.row);
      toast("Saved.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function remove(row: MediaRow) {
    const ok = await confirmAction({
      title: "Delete this file?",
      message: `“${row.name}” will be permanently removed from storage. Pages still using its URL will show a missing image.`,
      confirmText: "Delete file",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await api(`/api/admin/media/${row.id}`, { method: "DELETE" });
      setRows((rs) => rs?.filter((r) => r.id !== row.id) ?? null);
      setSelected(null);
      toast("File deleted.");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const accept = fixedKind === "video" ? "video/mp4,video/webm" : fixedKind === "image" ? "image/jpeg,image/png,image/webp,image/svg+xml" : "image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm";

  return (
    <div className={cn("grid gap-6", mode === "manage" && selected && "lg:grid-cols-[minmax(0,1fr)_320px]")}>
      <div className="min-w-0">
        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
            dragging ? "border-brand bg-brand/10" : "border-white/15 bg-white/[0.02]",
          )}
        >
          {progress ? (
            <p className="flex items-center gap-2 text-sm text-white/80" role="status">
              <Spinner /> {progress}
            </p>
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-brand" aria-hidden="true" />
              <p className="text-sm text-white/70">
                Drag & drop files here, or{" "}
                <button type="button" className="font-semibold text-brand underline-offset-2 hover:underline" onClick={() => inputRef.current?.click()}>
                  browse
                </button>
              </p>
              <p className="text-xs text-white/40">JPG, PNG, WEBP, SVG · MP4 video. Images are resized and converted to WebP automatically.</p>
            </>
          )}
          <input ref={inputRef} type="file" multiple accept={accept} className="sr-only" onChange={(e) => e.target.files && handleFiles(e.target.files)} aria-label="Upload files" />
          <div className="mt-2 flex w-full max-w-xl flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="upload-category">Upload category</label>
            <input id="upload-category" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="field !py-2 text-sm sm:w-40" placeholder="Category" />
            <div className="flex flex-1 gap-2">
              <label className="sr-only" htmlFor="media-url">Add media by URL</label>
              <input id="media-url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="field !py-2 text-sm" placeholder="…or paste an https:// image/video URL" />
              <button type="button" className="adm-btn" onClick={addByUrl} aria-label="Add URL">
                <Link2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="field !py-2 !pl-9 text-sm" aria-label="Search media" />
          </div>
          {!fixedKind && (
            <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="field !w-auto !py-2 text-sm" aria-label="Filter by type">
              <option value="">All types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          )}
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="field !w-auto !py-2 text-sm" aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {rows === null ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton aspect-square rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">No media files found. Upload your first image or video above.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {rows.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => (mode === "pick" ? onPick?.(r) : setSelected(r))}
                  className={cn(
                    "group relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-black/40 text-left transition",
                    selected?.id === r.id ? "border-brand" : "border-transparent hover:border-white/25",
                  )}
                  aria-label={`${mode === "pick" ? "Use" : "Select"} ${r.name}`}
                >
                  {r.kind === "video" ? (
                    <span className="flex h-full flex-col items-center justify-center gap-2 text-white/60">
                      <Film className="h-8 w-8 text-brand" aria-hidden="true" />
                      <span className="px-2 text-center text-[0.7rem] break-all">{r.name}</span>
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnails of arbitrary sources
                    <img src={r.url} alt={r.alt || r.name} loading="lazy" className="h-full w-full object-cover" />
                  )}
                  {r.featured && <Star className="absolute top-2 right-2 h-4 w-4 fill-brand text-brand" aria-label="Featured" />}
                  {mode === "pick" && (
                    <span className="absolute inset-0 grid place-items-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                      <span className="flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-black">
                        <Check className="h-3.5 w-3.5" /> Use
                      </span>
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Details panel */}
      {mode === "manage" && selected && (
        <aside className="rounded-2xl border border-white/10 bg-[#111113] p-5 lg:sticky lg:top-24 lg:self-start" aria-label="File details">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-white">File details</h2>
            <button type="button" className="adm-icon-btn" onClick={() => setSelected(null)} aria-label="Close details">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl bg-black">
            {selected.kind === "video" ? (
              <video src={selected.url} controls preload="metadata" className="aspect-video w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.url} alt={selected.alt || selected.name} className="max-h-60 w-full object-contain" />
            )}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/55">
            <dt>Type</dt>
            <dd className="text-right text-white/80">{selected.mime || selected.kind}</dd>
            <dt>Size</dt>
            <dd className="text-right text-white/80">{formatBytes(selected.size)}</dd>
            {selected.width && (
              <>
                <dt>Dimensions</dt>
                <dd className="text-right text-white/80">
                  {selected.width} × {selected.height}
                </dd>
              </>
            )}
            <dt>Uploaded</dt>
            <dd className="text-right text-white/80">{formatDate(selected.createdAt)}</dd>
          </dl>
          <MediaDetailsForm key={selected.id} row={selected} onSave={(patch) => update(selected, patch)} />
          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
            <span className="text-white/75">Featured</span>
            <Switch checked={selected.featured} onChange={(v) => update(selected, { featured: v })} label="Set as featured" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="adm-btn"
              onClick={async () => {
                const abs = selected.url.startsWith("/") ? window.location.origin + selected.url : selected.url;
                await navigator.clipboard.writeText(abs);
                toast("URL copied to clipboard.");
              }}
            >
              <Copy className="h-4 w-4" /> Copy URL
            </button>
            <button type="button" className="adm-btn adm-btn-danger" onClick={() => remove(selected)}>
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}

function MediaDetailsForm({ row, onSave }: { row: MediaRow; onSave: (patch: Partial<MediaRow>) => void }) {
  const [name, setName] = useState(row.name);
  const [alt, setAlt] = useState(row.alt);
  const [category, setCategory] = useState(row.category);
  return (
    <form
      className="mt-5 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name, alt, category });
      }}
    >
      <div>
        <label className="field-label" htmlFor="m-name">Name</label>
        <input id="m-name" className="field !py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {row.kind === "image" && (
        <div>
          <label className="field-label" htmlFor="m-alt">Alt text</label>
          <input id="m-alt" className="field !py-2 text-sm" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" />
        </div>
      )}
      <div>
        <label className="field-label" htmlFor="m-cat">Category</label>
        <input id="m-cat" className="field !py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>
      <button type="submit" className="adm-btn adm-btn-primary w-full">Save details</button>
    </form>
  );
}
