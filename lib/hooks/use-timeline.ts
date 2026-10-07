"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A pausable looping clock for scripted demos. Returns elapsed ms within the loop.
 * When `running` is false the clock holds its position. When `reduced` is true it
 * jumps to `finalAt` and stays there.
 */
export function useTimeline({
  duration,
  running,
  reduced,
  finalAt,
  tick = 50,
}: {
  duration: number;
  running: boolean;
  reduced: boolean;
  finalAt?: number;
  tick?: number;
}): number {
  const [t, setT] = useState(0);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (reduced || !running) {
      last.current = null;
      return;
    }
    const id = window.setInterval(() => {
      const now = performance.now();
      const prev = last.current ?? now;
      last.current = now;
      setT((cur) => (cur + (now - prev)) % duration);
    }, tick);
    return () => window.clearInterval(id);
  }, [running, reduced, duration, tick]);

  if (reduced) return finalAt ?? duration - 1;
  return t;
}
