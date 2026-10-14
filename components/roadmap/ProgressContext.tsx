"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  PROGRESS_KEY,
  decodeProgress,
  emptyProgress,
  mergeProgress,
  parseProgress,
  setStatus as setStatusPure,
  toggleCheck as toggleCheckPure,
  type PathMode,
  type Plan,
  type Progress,
  type TopicStatus,
} from "@/lib/roadmap/progress";
import { track } from "@/lib/track";

interface Ctx {
  progress: Progress;
  loaded: boolean;
  setStatus: (topicId: string, s: TopicStatus) => void;
  toggleCheck: (topicId: string, i: number) => void;
  setPath: (p: PathMode) => void;
  setPlan: (p: Plan | null) => void;
}

const ProgressCtx = createContext<Ctx | null>(null);

function save(p: Progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* storage blocked: progress lasts for this visit only */
  }
}

/** Progress lives in the browser; no login. A #p=… link from another device is merged in. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let p = emptyProgress();
    try {
      p = parseProgress(localStorage.getItem(PROGRESS_KEY));
    } catch {
      /* ignore */
    }
    const m = window.location.hash.match(/[#&]p=([A-Za-z0-9_-]+)/);
    if (m) {
      const incoming = decodeProgress(m[1]);
      if (incoming) {
        p = mergeProgress(p, incoming);
        save(p);
      }
      history.replaceState(history.state, "", window.location.pathname + window.location.search);
    }
    setProgress(p);
    setLoaded(true);
  }, []);

  const update = useCallback((fn: (p: Progress) => Progress) => {
    setProgress((cur) => {
      const next = fn(cur);
      save(next);
      return next;
    });
  }, []);

  const value: Ctx = {
    progress,
    loaded,
    setStatus: (id, s) => {
      track("status_change", { topic: id, status: s });
      update((p) => setStatusPure(p, id, s));
    },
    toggleCheck: (id, i) => update((p) => toggleCheckPure(p, id, i)),
    setPath: (path) => update((p) => ({ ...p, path })),
    setPlan: (plan) => update((p) => ({ ...p, plan })),
  };
  return <ProgressCtx.Provider value={value}>{children}</ProgressCtx.Provider>;
}

export function useProgress(): Ctx {
  const c = useContext(ProgressCtx);
  if (!c) throw new Error("useProgress outside ProgressProvider");
  return c;
}
