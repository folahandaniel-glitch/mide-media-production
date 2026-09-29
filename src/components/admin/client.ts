"use client";

import { prepareImageForUpload } from "@/lib/client-image";

export class AdminApiError extends Error {}

/** JSON fetch for admin APIs. Throws with the server's message; bounces to login on 401. */
export async function api<T = Record<string, unknown>>(url: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(url, {
    method: init?.method ?? "GET",
    headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.assign(new URL(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`, window.location.origin).href);
    throw new AdminApiError("Your session has expired. Please sign in again.");
  }
  if (!res.ok || json.ok === false) throw new AdminApiError(json.error || `Request failed (${res.status})`);
  return json as T;
}

export type MediaRow = {
  id: string;
  url: string;
  storageKey: string;
  name: string;
  kind: "image" | "video" | "file";
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  category: string;
  alt: string;
  featured: boolean;
  createdAt: string | number;
};

const SERVER_LIMIT = 4 * 1024 * 1024; // stay under serverless request limits

/** Uploads files to the media library. Big videos go straight to Vercel Blob when available. */
export async function uploadFiles(
  files: File[],
  opts: { category?: string; blob?: boolean; onProgress?: (msg: string) => void } = {},
): Promise<MediaRow[]> {
  const out: MediaRow[] = [];
  for (const [i, original] of files.entries()) {
    opts.onProgress?.(`Uploading ${i + 1} of ${files.length}: ${original.name}`);
    const isVideo = original.type.startsWith("video/");
    if (isVideo && opts.blob && original.size > SERVER_LIMIT) {
      const { upload } = await import("@vercel/blob/client");
      const safeName = original.name.replace(/[^\w.-]+/g, "-").toLowerCase();
      const blob = await upload(`${opts.category || "media"}/${safeName}`, original, {
        access: "public",
        handleUploadUrl: "/api/admin/media/blob",
        contentType: original.type,
        multipart: original.size > 50 * 1024 * 1024,
      });
      const { row } = await api<{ row: MediaRow }>("/api/admin/media", {
        method: "POST",
        body: { url: blob.url, storageKey: blob.pathname, name: original.name, mime: original.type, size: original.size, kind: "video", category: opts.category },
      });
      out.push(row);
      continue;
    }
    const file = isVideo ? original : await prepareImageForUpload(original);
    if (opts.blob && file.size > SERVER_LIMIT && !isVideo) {
      throw new AdminApiError(`${original.name} is too large after optimisation. Please use a smaller image.`);
    }
    const fd = new FormData();
    fd.append("file", file);
    if (opts.category) fd.append("category", opts.category);
    const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.ok === false) throw new AdminApiError(json.error || `Upload failed (${res.status})`);
    out.push(...(json.rows as MediaRow[]));
  }
  return out;
}

/* ----------------------------- Confirm dialog ----------------------------- */

export type ConfirmOptions = { title: string; message: string; confirmText?: string; tone?: "danger" | "default" };
type ConfirmRequest = ConfirmOptions & { resolve: (ok: boolean) => void };

export const CONFIRM_EVENT = "mmp:confirm";

export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<ConfirmRequest>(CONFIRM_EVENT, { detail: { ...opts, resolve } }));
  });
}
