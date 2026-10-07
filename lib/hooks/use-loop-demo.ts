"use client";

import { useRef, useState } from "react";
import { useInViewLoop, useReduced } from "./use-in-view-loop";
import { useTimeline } from "./use-timeline";

/** Everything a looping demo needs: a ref to observe, the clock, and pause state. */
export function useLoopDemo<T extends HTMLElement = HTMLDivElement>(duration: number, finalAt?: number) {
  const ref = useRef<T>(null);
  const visible = useInViewLoop(ref, 0.5);
  const reduced = useReduced();
  const [paused, setPaused] = useState(false);
  const t = useTimeline({ duration, running: visible && !paused, reduced, finalAt });
  return { ref, t, paused, togglePaused: () => setPaused((p) => !p), reduced };
}
