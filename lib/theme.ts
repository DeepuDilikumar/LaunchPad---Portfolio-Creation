"use client";

import { useSyncExternalStore } from "react";

import { THEME_KEY, type ThemePref } from "./theme-script";

export type { ThemePref } from "./theme-script";
const EVENT = "bp-theme-change";

function readPref(): ThemePref {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "system" || t === "dark" ? t : "dark";
  } catch {
    return "dark";
  }
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Storage blocked: still switch for this page view.
  }
  document.documentElement.dataset.theme = pref;
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  mq.addEventListener("change", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
    mq.removeEventListener("change", cb);
  };
}

function snapshot(): string {
  const pref = readPref();
  const resolved = pref === "system" ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : pref;
  return `${pref}:${resolved}`;
}

/** Current preference and the theme it resolves to. Server render assumes the default (dark). */
export function useTheme(): { pref: ThemePref; resolved: "light" | "dark" } {
  const [pref, resolved] = useSyncExternalStore(subscribe, snapshot, () => "dark:dark").split(":") as [ThemePref, "light" | "dark"];
  return { pref, resolved };
}
