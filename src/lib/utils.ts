export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

/** Digits only, suitable for wa.me links (e.g. "+234 706 296 1288" → "2347062961288"). */
export function whatsappDigits(number: string) {
  const digits = number.replace(/\D/g, "");
  // Local Nigerian format (0706...) → international.
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  return digits;
}

export function whatsappLink(number: string, message?: string) {
  const base = `https://wa.me/${whatsappDigits(number)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function telLink(number: string) {
  const digits = number.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export type VideoSource =
  | { kind: "youtube"; id: string; embed: string; thumb: string }
  | { kind: "vimeo"; id: string; embed: string; thumb: null }
  | { kind: "file"; src: string };

export function parseVideo(url: string | null | undefined): VideoSource | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (yt) {
    return {
      kind: "youtube",
      id: yt[1],
      embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`,
      thumb: `https://i.ytimg.com/vi/${yt[1]}/maxresdefault.jpg`,
    };
  }
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) {
    return { kind: "vimeo", id: vm[1], embed: `https://player.vimeo.com/video/${vm[1]}?autoplay=1&dnt=1`, thumb: null };
  }
  if (/^(https?:\/\/|\/)/i.test(u)) return { kind: "file", src: u };
  return null;
}

export function formatDate(value: string | number | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" });
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/** Is this an internal link (same site)? */
export function isInternalHref(href: string) {
  return href.startsWith("/") || href.startsWith("#");
}

export function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
