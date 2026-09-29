import "server-only";
import sanitizeHtml from "sanitize-html";

const alignStyle = { "text-align": [/^(left|right|center|justify)$/] };

/** Output of the admin rich-text editor: formatting only, no scripts or embeds. */
export function sanitizeRichText(html: string) {
  return sanitizeHtml(html ?? "", {
    allowedTags: ["p", "br", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "hr"],
    allowedAttributes: { a: ["href", "target", "rel"], p: ["style"], h2: ["style"], h3: ["style"], h4: ["style"] },
    allowedStyles: { "*": alignStyle },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          href: attribs.href ?? "#",
          ...(attribs.href?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}),
        },
      }),
    },
  });
}

/** "Custom HTML" sections: richer layout markup, video embeds only from trusted hosts. */
export function sanitizeCustomHtml(html: string) {
  return sanitizeHtml(html ?? "", {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "figure",
      "figcaption",
      "iframe",
      "section",
      "span",
      "div",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ],
    allowedAttributes: {
      "*": ["class", "style", "id", "aria-label"],
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "width", "height", "loading", "class"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "title", "loading"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
        "font-weight": [/^\d{3}$|^bold$|^normal$/],
        margin: [/^[\d\s.a-z%-]+$/i],
        padding: [/^[\d\s.a-z%-]+$/i],
        "max-width": [/^[\d.]+(px|%|rem|em)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
    // Drop iframes whose src was rejected instead of leaving an empty frame.
    exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
  });
}

/** Plain text: strips every tag. Used for form submissions. */
export function plainText(value: unknown, max = 5000) {
  const s = typeof value === "string" ? value : value == null ? "" : String(value);
  return sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
    .slice(0, max);
}

const SAFE_URL = /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i;

/** Accepts absolute http(s), root-relative, anchors, mailto and tel. Anything else becomes "". */
export function safeUrl(value: unknown) {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return "";
  return SAFE_URL.test(s) ? s.slice(0, 2000) : "";
}
