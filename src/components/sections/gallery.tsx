"use client";

import { useState } from "react";
import { Expand } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Lightbox, type LightboxImage } from "@/components/ui/lightbox";

export function GalleryGrid({
  images,
  title,
  footer,
}: {
  images: LightboxImage[];
  title?: string;
  footer?: React.ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  if (!images.length) return null;
  return (
    <>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>li]:mb-4">
        {images.map((img, i) => (
          <li key={img.url + i} className="reveal break-inside-avoid" style={{ ["--reveal-delay" as string]: `${(i % 3) * 80}ms` }}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block w-full overflow-hidden rounded-2xl bg-charcoal"
              aria-label={`Open image ${i + 1} of ${images.length}${img.alt ? `: ${img.alt}` : ""}`}
            >
              <SmartImage
                src={img.url}
                alt={img.alt}
                width={1200}
                height={800}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-auto w-full transition-transform duration-[1.2s] ease-[var(--ease-cinema)] group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/35" />
              <span className="absolute right-4 bottom-4 grid h-10 w-10 place-items-center rounded-full bg-brand text-black opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <Expand className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Lightbox images={images} index={index} onIndex={setIndex} onClose={() => setIndex(null)} title={title} footer={footer} />
    </>
  );
}
