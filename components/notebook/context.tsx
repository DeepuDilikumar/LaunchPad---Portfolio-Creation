"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/client";
import { DECISION_MIN_CHARS } from "@/lib/progress";

export type Tool = "claude" | "codex" | "cursor";

export interface CheckpointState {
  status: "passed" | "skipped";
  output?: string;
}
export interface DecisionState {
  text: string;
  isPublic: boolean;
  savedAt?: string;
}

export interface NotebookUser {
  id: string;
  handle: string;
  preferredTool: Tool;
}

export interface NotebookInit {
  project: string;
  projectName: string;
  module: string;
  moduleTitle: string;
  moduleOrder: number;
  user: NotebookUser | null;
  checkpoints: Record<string, CheckpointState>;
  decisions: Record<string, DecisionState>;
  requiredCheckpoints: string[];
  decisionIds: string[];
  lastCell?: string | null;
}

interface NotebookApi extends NotebookInit {
  tool: Tool;
  setTool: (t: Tool) => void;
  activeCell: string | null;
  setActiveCell: (id: string) => void;
  touch: (id: string) => void;
  markCheckpoint: (id: string, status: "passed" | "skipped", output?: string) => Promise<boolean>;
  saveDecision: (id: string, text: string, isPublic: boolean) => Promise<boolean>;
  promptCopied: (id: string) => void;
  /** Returns true when signed in; otherwise opens the sign-in modal for this cell. */
  requireAuth: (cellId: string) => boolean;
  authPrompt: string | null;
  closeAuthPrompt: () => void;
  tutor: { open: boolean; cellId: string | null };
  openTutor: (cellId?: string | null) => void;
  closeTutor: () => void;
  drawerTab: "tutor" | "journal" | "notes";
  setDrawerTab: (t: "tutor" | "journal" | "notes") => void;
  celebrate: string | null;
  clearCelebrate: () => void;
}

const Ctx = createContext<NotebookApi | null>(null);

export function useNotebook() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useNotebook outside NotebookProvider");
  return v;
}

/** Same as useNotebook but returns null outside a notebook (cells render standalone too). */
export function useNotebookOptional() {
  return useContext(Ctx);
}

const TOOL_KEY = "bp_tool";
const toolListeners = new Set<() => void>();
function readTool(): Tool | null {
  try {
    const v = window.localStorage.getItem(TOOL_KEY);
    return v === "claude" || v === "codex" || v === "cursor" ? v : null;
  } catch {
    return null;
  }
}
function subscribeTool(cb: () => void) {
  toolListeners.add(cb);
  return () => {
    toolListeners.delete(cb);
  };
}

async function post(url: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return res.ok;
  } catch {
    return false;
  }
}

export function NotebookProvider({ init, children }: { init: NotebookInit; children: ReactNode }) {
  const pathname = usePathname();
  const savedTool = useSyncExternalStore(subscribeTool, readTool, () => null);
  const tool: Tool = savedTool ?? init.user?.preferredTool ?? "claude";
  const [checkpoints, setCheckpoints] = useState(init.checkpoints);
  const [decisions, setDecisions] = useState(init.decisions);
  const [activeCell, setActiveCell] = useState<string | null>(init.lastCell ?? null);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);
  const [tutor, setTutor] = useState<{ open: boolean; cellId: string | null }>({ open: false, cellId: null });
  const [drawerTab, setDrawerTab] = useState<"tutor" | "journal" | "notes">("tutor");
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const lastTouch = useRef<string | null>(null);
  const firstPassRef = useRef(Object.values(init.checkpoints).some((c) => c.status === "passed"));

  const base = { project: init.project, module: init.module };

  const setTool = useCallback(
    (t: Tool) => {
      try {
        window.localStorage.setItem(TOOL_KEY, t);
      } catch {}
      toolListeners.forEach((l) => l());
      if (init.user) void post("/api/profile/tool", { tool: t });
    },
    [init.user],
  );

  const touch = useCallback(
    (id: string) => {
      setActiveCell(id);
      if (!init.user || lastTouch.current === id) return;
      lastTouch.current = id;
      void post("/api/progress", { ...base, cellId: id, kind: "touch" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [init.user, init.project, init.module],
  );

  const requireAuth = useCallback(
    (cellId: string) => {
      if (init.user) return true;
      setAuthPrompt(cellId);
      track("signup_started", { from: "notebook", cell: cellId, path: pathname });
      return false;
    },
    [init.user, pathname],
  );

  const checkComplete = useCallback(
    (cp: Record<string, CheckpointState>, dec: Record<string, DecisionState>) => {
      const allCp = init.requiredCheckpoints.every((id) => cp[id]?.status === "passed");
      const allDec = init.decisionIds.every((id) => (dec[id]?.text.trim().length ?? 0) >= DECISION_MIN_CHARS);
      return init.requiredCheckpoints.length + init.decisionIds.length > 0 && allCp && allDec;
    },
    [init.requiredCheckpoints, init.decisionIds],
  );

  const markCheckpoint = useCallback(
    async (id: string, status: "passed" | "skipped", output?: string) => {
      if (!requireAuth(id)) return false;
      const wasComplete = checkComplete(checkpoints, decisions);
      const next = { ...checkpoints, [id]: { status, output } };
      setCheckpoints(next);
      const ok = await post("/api/progress", { ...base, cellId: id, kind: "checkpoint", status, output });
      if (ok && status === "passed") {
        track("checkpoint_passed", { ...base, cell: id });
        if (!firstPassRef.current) {
          firstPassRef.current = true;
          setCelebrate("first");
        }
      }
      if (ok && !wasComplete && checkComplete(next, decisions)) setCelebrate("module");
      return ok;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requireAuth, checkpoints, decisions, checkComplete, init.project, init.module],
  );

  const saveDecision = useCallback(
    async (id: string, text: string, isPublic: boolean) => {
      if (!init.user) return false;
      const wasComplete = checkComplete(checkpoints, decisions);
      const next = { ...decisions, [id]: { text, isPublic, savedAt: new Date().toISOString() } };
      setDecisions(next);
      const ok = await post("/api/decisions", { ...base, cellId: id, text, isPublic });
      if (ok && text.trim().length >= DECISION_MIN_CHARS) track("decision_saved", { ...base, cell: id });
      if (ok && !wasComplete && checkComplete(checkpoints, next)) setCelebrate("module");
      return ok;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [init.user, checkpoints, decisions, checkComplete, init.project, init.module],
  );

  const promptCopied = useCallback(
    (id: string) => {
      track("prompt_copied", { ...base, cell: id, tool });
      touch(id);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tool, touch, init.project, init.module],
  );

  const value = useMemo<NotebookApi>(
    () => ({
      ...init,
      checkpoints,
      decisions,
      tool,
      setTool,
      activeCell,
      setActiveCell,
      touch,
      markCheckpoint,
      saveDecision,
      promptCopied,
      requireAuth,
      authPrompt,
      closeAuthPrompt: () => setAuthPrompt(null),
      tutor,
      openTutor: (cellId) => {
        setDrawerTab("tutor");
        setTutor({ open: true, cellId: cellId ?? activeCell });
      },
      closeTutor: () => setTutor((t) => ({ ...t, open: false })),
      drawerTab,
      setDrawerTab: (t) => {
        setDrawerTab(t);
        setTutor((s) => ({ ...s, open: true }));
      },
      celebrate,
      clearCelebrate: () => setCelebrate(null),
    }),
    [init, checkpoints, decisions, tool, setTool, activeCell, touch, markCheckpoint, saveDecision, promptCopied, requireAuth, authPrompt, tutor, drawerTab, celebrate],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
