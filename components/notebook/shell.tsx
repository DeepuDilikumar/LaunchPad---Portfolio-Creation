"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { Button, LinkButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SegmentedToggle } from "@/components/ui/segmented";
import { Tabs } from "@/components/ui/tabs";
import { IconArrowRight, IconClose, IconLock, IconMenu } from "@/components/ui/icons";
import { Caret } from "@/components/ui/caret";
import { track } from "@/lib/analytics/client";
import { useNotebook, type Tool } from "./context";
import { TutorPanel } from "./tutor-panel";

export interface RailModule {
  slug: string;
  title: string;
  order: number;
  ratio: number;
  complete: boolean;
  locked: boolean;
  outline: boolean;
  minutes: number;
}

const toolOptions: { value: Tool; label: string }[] = [
  { value: "claude", label: "Claude Code" },
  { value: "codex", label: "Codex" },
  { value: "cursor", label: "Cursor" },
];

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  return t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.getAttribute("role") === "textbox";
}

function cellEls(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("[data-cell]"));
}

export function NotebookShell({
  accent,
  rail,
  next,
  children,
  locked,
}: {
  accent: string;
  rail: RailModule[];
  next?: { href: string; title: string } | null;
  children: ReactNode;
  locked: boolean;
}) {
  const nb = useNotebook();
  const [railOpen, setRailOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const notesKey = `bp_notes:${nb.project}/${nb.module}`;
  const resumed = useRef(false);

  const total = nb.requiredCheckpoints.length + nb.decisionIds.length;
  const done =
    nb.requiredCheckpoints.filter((id) => nb.checkpoints[id]?.status === "passed").length +
    nb.decisionIds.filter((id) => (nb.decisions[id]?.text.trim().length ?? 0) >= 40).length;

  // module_started, once per module view
  useEffect(() => {
    if (!locked) track("module_started", { project: nb.project, module: nb.module });
  }, [nb.project, nb.module, locked]);

  // Resume where you left off
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    const hash = window.location.hash.replace(/^#/, "");
    const target = hash.startsWith("cell-") ? hash : nb.lastCell ? `cell-${nb.lastCell}` : null;
    if (!target) return;
    const el = document.getElementById(target);
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ block: "start" });
        el.focus({ preventScroll: true });
      }, 50);
    }
  }, [nb.lastCell]);

  // Notes live in this browser only.
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(notesKey);
      if (v) queueMicrotask(() => setNotes(v));
    } catch {}
  }, [notesKey]);

  const go = useCallback(
    (dir: 1 | -1) => {
      const els = cellEls();
      if (!els.length) return;
      let i = els.findIndex((e) => e.dataset.cell === nb.activeCell);
      if (i < 0) {
        // nearest to viewport top
        i = els.findIndex((e) => e.getBoundingClientRect().top > 80) - (dir === 1 ? 1 : 0);
      }
      const nextEl = els[Math.max(0, Math.min(els.length - 1, i + dir))];
      if (!nextEl) return;
      nextEl.scrollIntoView({ block: "start", behavior: "smooth" });
      nextEl.focus({ preventScroll: true });
      if (nextEl.dataset.cell) nb.touch(nextEl.dataset.cell);
    },
    [nb],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (document.querySelector("dialog[open]")) return;
      if (e.key === "j") {
        e.preventDefault();
        go(1);
      } else if (e.key === "k") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "/") {
        e.preventDefault();
        nb.openTutor();
      } else if (e.key === "c") {
        const els = cellEls();
        const start = Math.max(0, els.findIndex((x) => x.dataset.cell === nb.activeCell));
        const prompt = els.slice(start).find((x) => x.dataset.kind === "prompt");
        prompt?.querySelector<HTMLButtonElement>('[data-copy="prompt"]')?.click();
      } else if (e.key === "p") {
        const el = nb.activeCell ? document.getElementById(`cell-${nb.activeCell}`) : null;
        el?.querySelector<HTMLButtonElement>('[data-action="mark-passed"]')?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, nb]);

  const current = rail.find((m) => m.slug === nb.module);

  const railList = (
    <nav aria-label={`${nb.projectName} modules`}>
      <Link href={`/projects/${nb.project}`} className="flex items-center gap-2 px-2 t-small font-medium text-text-1 hover:underline">
        <span className="size-2.5 rounded-[3px]" style={{ background: accent }} aria-hidden />
        {nb.projectName}
      </Link>
      <ol className="mt-3 space-y-0.5">
        {rail.map((m) => {
          const active = m.slug === nb.module;
          return (
            <li key={m.slug}>
              <Link
                href={`/learn/${nb.project}/${m.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-2 py-2 t-small transition-colors",
                  active ? "bg-surface-2 text-text-1" : "text-text-2 hover:bg-surface-1 hover:text-text-1",
                )}
              >
                {m.locked ? (
                  <IconLock size={14} className="shrink-0 text-text-3" aria-label="Locked" />
                ) : (
                  <ProgressRing value={m.complete ? 1 : m.ratio} color={accent} size={16} stroke={2} label={m.complete ? "Complete" : `${Math.round(m.ratio * 100)}% complete`} />
                )}
                <span className="min-w-0 flex-1 truncate">
                  <span className="text-text-3">{m.order}.</span> {m.title}
                </span>
                {m.outline ? <span className="shrink-0 text-[11px] text-text-3">Soon</span> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-black/85 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-full bg-surface-2 text-text-1 lg:hidden"
            onClick={() => setRailOpen(true)}
            aria-label="Open module list"
          >
            <IconMenu size={14} />
          </button>
          <Link href="/dashboard" className="hidden items-center lg:inline-flex" aria-label="Dashboard">
            <Caret size={20} blink={false} />
          </Link>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-1.5 t-small text-text-2">
              <li className="hidden sm:block">
                <Link href="/projects" className="hover:text-text-1">
                  Projects
                </Link>
              </li>
              <li className="hidden sm:block" aria-hidden>
                /
              </li>
              <li className="hidden sm:block">
                <Link href={`/projects/${nb.project}`} className="hover:text-text-1">
                  {nb.projectName}
                </Link>
              </li>
              <li className="hidden sm:block" aria-hidden>
                /
              </li>
              <li className="min-w-0 truncate text-text-1" aria-current="page">
                Module {nb.moduleOrder} · {nb.moduleTitle}
              </li>
            </ol>
          </nav>
          <div className="hidden md:block">
            <SegmentedToggle size="sm" label="Agent" value={nb.tool} onChange={nb.setTool} options={toolOptions} />
          </div>
          {total > 0 && !locked ? (
            <div className="hidden items-center gap-2 sm:flex" title="Required checkpoints and decisions">
              <ProgressRing value={done / total} color={accent} size={20} label={`${done} of ${total} done`} />
              <span className="t-small text-text-2">
                {done}/{total}
              </span>
            </div>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => nb.openTutor()} aria-keyshortcuts="/">
            Ask tutor
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-14 hidden h-[calc(100dvh-56px)] w-[272px] shrink-0 overflow-y-auto border-r border-line px-3 py-5 lg:block">
          {railList}
          <p className="mt-6 px-2 text-[11.5px] leading-4 text-text-3">
            Keys: j / k next and previous cell · c copy prompt · p mark passed · / tutor
          </p>
        </aside>

        <div className="min-w-0 flex-1 px-5 pb-32 pt-8 md:px-10 md:pt-12">
          <div className="mx-auto max-w-[760px]">
            <div className="md:hidden mb-6">
              <SegmentedToggle size="sm" label="Agent" value={nb.tool} onChange={nb.setTool} options={toolOptions} />
            </div>
            {children}
            {next && !locked ? (
              <div className="mt-14 flex flex-col items-start gap-3 border-t border-line pt-8">
                <p className="t-small text-text-2">Up next</p>
                <LinkButton href={next.href} variant="secondary">
                  {next.title} <IconArrowRight size={14} />
                </LinkButton>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile: sticky "Next cell" */}
      {!locked ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center pb-4 lg:hidden">
          <Button onClick={() => go(1)} className="shadow-lg">
            Next cell <IconArrowRight size={14} />
          </Button>
        </div>
      ) : null}

      {/* Mobile rail as bottom sheet */}
      <Dialog open={railOpen} onClose={() => setRailOpen(false)} title={current ? `${nb.projectName} · module ${current.order}` : "Modules"} variant="sheet">
        <div onClick={(e) => ((e.target as HTMLElement).closest("a") ? setRailOpen(false) : undefined)}>{railList}</div>
      </Dialog>

      {/* Right drawer: Tutor · Journal · Notes */}
      <AnimatePresence>
        {nb.tutor.open ? (
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Notebook drawer"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col border-l border-line bg-surface-1 md:inset-y-0 md:left-auto md:right-0 md:top-14 md:w-[420px]"
          >
            <div className="flex items-center justify-between border-b border-line pl-2 pr-3">
              <Tabs
                idBase="drawer"
                label="Drawer"
                className="border-b-0"
                value={nb.drawerTab}
                onChange={nb.setDrawerTab}
                items={[
                  { value: "tutor", label: "Tutor" },
                  { value: "journal", label: "Journal" },
                  { value: "notes", label: "Notes" },
                ]}
              />
              <button type="button" onClick={nb.closeTutor} aria-label="Close drawer" className="inline-flex size-8 items-center justify-center rounded-full text-text-2 hover:bg-surface-2 hover:text-text-1">
                <IconClose size={14} />
              </button>
            </div>
            <div role="tabpanel" id={`drawer-panel-${nb.drawerTab}`} aria-labelledby={`drawer-tab-${nb.drawerTab}`} className="min-h-0 flex-1 overflow-y-auto">
              {nb.drawerTab === "tutor" ? <TutorPanel /> : null}
              {nb.drawerTab === "journal" ? (
                <div className="space-y-3 p-4">
                  {nb.decisionIds.length === 0 ? <p className="t-small text-text-2">This module has no decision cells.</p> : null}
                  {nb.decisionIds.map((id) => {
                    const d = nb.decisions[id];
                    return (
                      <a key={id} href={`#cell-${id}`} className="block rounded-[14px] border border-line bg-black/30 p-3 hover:bg-surface-2">
                        <p className="t-small text-text-2">{d?.isPublic ? "Public" : "Private"}</p>
                        <p className="mt-1 t-small text-text-1 whitespace-pre-wrap">{d?.text || "Not written yet."}</p>
                      </a>
                    );
                  })}
                  <Link href="/journal" className="inline-block t-small text-text-2 underline underline-offset-4 hover:text-text-1">
                    Open your full build journal
                  </Link>
                </div>
              ) : null}
              {nb.drawerTab === "notes" ? (
                <div className="p-4">
                  <label htmlFor="nb-notes" className="t-small text-text-2">
                    Notes for this module. Saved in this browser only.
                  </label>
                  <textarea
                    id="nb-notes"
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      try {
                        window.localStorage.setItem(notesKey, e.target.value);
                      } catch {}
                    }}
                    className="mt-2 h-[60vh] w-full resize-none rounded-[12px] border border-line bg-black/40 p-3 text-[14px] leading-6 text-text-1 focus:outline-none focus-visible:outline-2 focus-visible:outline-text-1"
                  />
                </div>
              ) : null}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      {/* Sign-in prompt for logged-out interaction */}
      <Dialog open={!!nb.authPrompt} onClose={nb.closeAuthPrompt} title="Save your progress" description="Sign in to keep your checkpoints and decisions. You'll come back to this exact step.">
        <div className="space-y-2">
          <LinkButton
            href={`/login?next=${encodeURIComponent(`/learn/${nb.project}/${nb.module}#cell-${nb.authPrompt ?? ""}`)}`}
            className="w-full"
            data-cta="notebook-signin"
          >
            Sign in to continue
          </LinkButton>
          <Button variant="ghost" className="w-full" onClick={nb.closeAuthPrompt}>
            Keep reading
          </Button>
        </div>
      </Dialog>

      <Celebration next={next ?? null} />
    </div>
  );
}

function Celebration({ next }: { next: { href: string; title: string } | null }) {
  const nb = useNotebook();
  // The "first checkpoint" moment is the Foundations onboarding win; elsewhere it's a normal pass.
  const first = nb.celebrate === "first" && nb.project === "foundations" && nb.module === "setup-agents";
  const mod = nb.celebrate === "module";
  useEffect(() => {
    if (!nb.celebrate) return;
    const id = window.setTimeout(nb.clearCelebrate, 9000);
    return () => window.clearTimeout(id);
  }, [nb.celebrate, nb.clearCelebrate]);
  return (
    <AnimatePresence>
      {first || mod ? (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-20 left-1/2 z-[70] w-[calc(100%-32px)] max-w-[420px] -translate-x-1/2 rounded-[20px] border border-line bg-surface-2 p-4 shadow-2xl lg:bottom-6"
          data-celebration={nb.celebrate}
        >
          <div className="flex items-start gap-3">
            <Caret size={36} />
            <div className="min-w-0 flex-1">
              <p className="t-h3 text-text-1">{first ? "First checkpoint passed" : "Module complete"}</p>
              <p className="mt-1 t-small text-text-2">
                {first ? "That's the loop: prompt, run, check. Next: plan before you build." : "Your decisions are saved to your build journal."}
              </p>
              <div className="mt-3 flex gap-2">
                {first ? (
                  <LinkButton href="/learn/foundations/the-loop" size="sm">
                    Next: plan before you build
                  </LinkButton>
                ) : next ? (
                  <LinkButton href={next.href} size="sm">
                    Next module
                  </LinkButton>
                ) : (
                  <LinkButton href="/dashboard" size="sm">
                    Back to dashboard
                  </LinkButton>
                )}
                <Button size="sm" variant="ghost" onClick={nb.clearCelebrate}>
                  Keep going here
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
