"use client";

import { useEffect, useState, type RefObject } from "react";
import { useReducedMotion } from "motion/react";

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

/** Reduced-motion preference (SSR-safe: false on server). */
export function useReduced(): boolean {
  return useReducedMotion() ?? false;
}
