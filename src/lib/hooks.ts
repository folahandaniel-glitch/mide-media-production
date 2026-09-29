"use client";

import { useSyncExternalStore } from "react";

/** prefers-reduced-motion, SSR-safe (assumes motion allowed on the server). */
export function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Current `location.search`, updated on history navigation. Empty on the server. */
export function useLocationSearch() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("popstate", cb);
      window.addEventListener("hashchange", cb);
      return () => {
        window.removeEventListener("popstate", cb);
        window.removeEventListener("hashchange", cb);
      };
    },
    () => window.location.search,
    () => "",
  );
}

const STORAGE_EVENT = "mmp:session-storage";
const memory = new Map<string, string>(); // fallback when storage is blocked

/** Reads a sessionStorage key reactively. `null` on the server. */
export function useSessionValue(key: string) {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener(STORAGE_EVENT, cb);
      return () => window.removeEventListener(STORAGE_EVENT, cb);
    },
    () => {
      try {
        return window.sessionStorage.getItem(key) ?? memory.get(key) ?? null;
      } catch {
        return memory.get(key) ?? null;
      }
    },
    () => null,
  );
}

export function setSessionValue(key: string, value: string) {
  memory.set(key, value);
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — memory fallback used */
  }
  window.dispatchEvent(new Event(STORAGE_EVENT));
}
