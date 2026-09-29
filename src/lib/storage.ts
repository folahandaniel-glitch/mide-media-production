import "server-only";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { del, put } from "@vercel/blob";
import sharp from "sharp";
import { HttpError } from "./api";
import { slugify } from "./utils";

export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads");

export function blobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export type StoredFile = {
  url: string;
  storageKey: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  kind: "image" | "video";
};

function isSafeSvg(text: string) {
  return !/<script|<foreignObject|\son\w+\s*=|javascript:|<iframe|<embed|<object|xlink:href\s*=\s*["']?(?!#)/i.test(text);
}

function looksLikeMp4(buf: Buffer) {
  return buf.length > 12 && buf.subarray(4, 8).toString("ascii") === "ftyp";
}
function looksLikeWebm(buf: Buffer) {
  return buf.length > 4 && buf.readUInt32BE(0) === 0x1a45dfa3;
}

async function store(buffer: Buffer, key: string, contentType: string) {
  if (blobEnabled()) {
    const blob = await put(key, buffer, { access: "public", contentType, addRandomSuffix: true });
    return { url: blob.url, storageKey: blob.pathname };
  }
  if (process.env.VERCEL) {
    throw new HttpError(500, "File storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel.");
  }
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const dir = path.dirname(key);
  const file = `${path.basename(key, path.extname(key))}-${unique}${path.extname(key)}`;
  const rel = path.posix.join(dir, file);
  await mkdir(path.join(LOCAL_UPLOAD_DIR, dir), { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, rel), buffer);
  return { url: `/media/${rel}`, storageKey: `local:${rel}` };
}

/**
 * Validates, optimises and stores an uploaded file.
 * Raster images are auto-rotated, resized (max 2560px), stripped of metadata and converted to WebP.
 */
export async function saveUpload(file: File, folder = "media"): Promise<StoredFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const baseName = slugify(file.name.replace(/\.[^.]+$/, "")) || "file";
  const safeFolder = slugify(folder) || "media";

  if (file.type === "image/svg+xml" || /\.svg$/i.test(file.name)) {
    if (buffer.length > 2 * 1024 * 1024) throw new HttpError(413, "SVG files must be under 2MB.");
    const text = buffer.toString("utf8");
    if (!/<svg[\s>]/i.test(text) || !isSafeSvg(text)) throw new HttpError(415, "This SVG contains unsafe content.");
    const stored = await store(buffer, `${safeFolder}/${baseName}.svg`, "image/svg+xml");
    return { ...stored, mime: "image/svg+xml", size: buffer.length, width: null, height: null, kind: "image" };
  }

  if (VIDEO_TYPES.includes(file.type) || /\.(mp4|webm)$/i.test(file.name)) {
    if (buffer.length > MAX_VIDEO_BYTES) throw new HttpError(413, "Videos must be under 200MB.");
    const isMp4 = looksLikeMp4(buffer);
    if (!isMp4 && !looksLikeWebm(buffer)) throw new HttpError(415, "Only MP4 or WebM videos are supported.");
    const ext = isMp4 ? "mp4" : "webm";
    const mime = isMp4 ? "video/mp4" : "video/webm";
    const stored = await store(buffer, `${safeFolder}/${baseName}.${ext}`, mime);
    return { ...stored, mime, size: buffer.length, width: null, height: null, kind: "video" };
  }

  if (!IMAGE_TYPES.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    throw new HttpError(415, "Unsupported file type. Use JPG, PNG, WEBP, SVG or MP4.");
  }
  if (buffer.length > MAX_IMAGE_BYTES) throw new HttpError(413, "Images must be under 15MB.");

  let output: Buffer;
  let info: { width: number; height: number };
  try {
    ({ data: output, info } = await sharp(buffer, { failOn: "error" })
      .rotate()
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true }));
  } catch {
    throw new HttpError(415, "This file is not a valid image.");
  }
  const stored = await store(output, `${safeFolder}/${baseName}.webp`, "image/webp");
  return { ...stored, mime: "image/webp", size: output.length, width: info.width, height: info.height, kind: "image" };
}

export async function removeStoredFile(storageKey: string, url: string) {
  try {
    if (storageKey.startsWith("local:")) {
      const rel = storageKey.slice(6);
      const full = path.join(LOCAL_UPLOAD_DIR, rel);
      if (!full.startsWith(LOCAL_UPLOAD_DIR)) return;
      await unlink(full);
    } else if (blobEnabled() && /\.blob\.vercel-storage\.com\//.test(url)) {
      await del(url);
    }
  } catch (err) {
    console.warn("[storage] could not delete", storageKey, err);
  }
}
