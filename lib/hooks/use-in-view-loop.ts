"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/**
 * True when the element is at least `threshold` visible AND the tab is visible.
 * Looping demos run only while this is true.
 */
export function useInViewLoop(ref: RefObject<Element | null>, threshold = 0.5): boolean {
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setInView(e.intersectionRatio >= threshold);
      },
      { threshold: [0, threshold, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);

  useEffect(() => {
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return inView && tabVisible;
}

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reduced-motion preference. Hydration-safe: renders `false` on the server and during
 * hydration, then switches to the real value.
 */
export function useReduced(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
