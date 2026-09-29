"use client";

import Link from "next/link";
import { useEffect } from "react";
import { X, Megaphone } from "lucide-react";
import { isInternalHref } from "@/lib/utils";
import { setSessionValue, useSessionValue } from "@/lib/hooks";

type Item = { id: string; message: string; linkText: string; linkUrl: string };

const STORAGE_KEY = "mmp-announce";

export function AnnouncementBar({ items }: { items: Item[] }) {
  const key = items.map((i) => i.id).join(",");
  const dismissed = useSessionValue(STORAGE_KEY) === key;
  const visible = items.length > 0 && !dismissed;

  // Tell the fixed header how far down to sit.
  useEffect(() => {
    document.documentElement.style.setProperty("--announce-h", visible ? "40px" : "0px");
  }, [visible]);

  if (!visible) return null;
  const item = items[0]!;
  const external = item.linkUrl && !isInternalHref(item.linkUrl);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center bg-brand text-black">
      <div className="container-cinema flex items-center justify-center gap-3 pr-12 text-center text-[0.8rem] font-medium">
        <Megaphone className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
        <p className="truncate">
          {item.message}
          {item.linkUrl && item.linkText && (
            <>
              {" "}
              {external ? (
                <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                  {item.linkText}
                </a>
              ) : (
                <Link href={item.linkUrl} className="font-semibold underline underline-offset-2">
                  {item.linkText}
                </Link>
              )}
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setSessionValue(STORAGE_KEY, key)}
          className="absolute right-3 grid h-7 w-7 place-items-center rounded-full hover:bg-black/10"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
