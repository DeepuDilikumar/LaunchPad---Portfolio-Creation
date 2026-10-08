"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "motion/react";
import { AppWindow } from "@/components/ui/card";
import { AccentAvatar, StatusChip } from "@/components/ui/pill";
import { IconCheck, IconCopy, IconSearch } from "@/components/ui/icons";
import { CellShell, CheckpointChip, TerminalView, ThinkingDots, ToolTabsView } from "@/components/notebook/views";
import { DemoControl } from "./demo-control";
import { useInViewLoop, useReduced } from "@/lib/hooks/use-in-view-loop";
import { useTimeline } from "@/lib/hooks/use-timeline";
import { accents } from "@/lib/accents";

const LOOP = 18000;
const ease = [0.22, 1, 0.36, 1] as const;

const rows = [
  { name: "Foundations", status: "5 of 5 modules done", time: "2d", color: accents.foundations },
  { name: "Pulse", status: "Typing a plan…", time: "now", color: accents.pulse, active: true },
  { name: "Ledger", status: "Idempotency checkpoint passed", time: "1h", color: accents.ledger },
  { name: "Reel", status: "Transcoding queue drafted", time: "3h", color: accents.reel },
  { name: "Dispatch", status: "Matching within 2 km", time: "5h", color: accents.dispatch },
  { name: "Scribe", status: "Cursors synced across 3 tabs", time: "1d", color: accents.scribe },
  { name: "Atlas", status: "Eval score up to 0.91", time: "1d", color: accents.atlas },
];

const PROMPT =
  "Plan delivery and read receipts for 1:1 and group chats. Use client message IDs for idempotency. Write failing tests first.";
const DECISION =
  "The agent proposed a receipts row per message. I switched to a per-conversation read cursor, so group reads are one write.";

const terminalScript: { at: number; text: string; tone?: "muted" | "passed" | "cmd" | "default" }[] = [
  { at: 4400, text: "Plan", tone: "muted" },
  { at: 4800, text: "• Add messages.client_id with a unique index per sender" },
  { at: 5300, text: "• Track delivered_at per recipient, read cursor per member" },
  { at: 5800, text: "• Emit receipt events over the socket, batch group reads" },
  { at: 6600, text: "Writing receipts.test.ts (6 tests)", tone: "muted" },
  { at: 7600, text: "pnpm test", tone: "cmd" },
  { at: 9300, text: "✓ 6 passed", tone: "passed" },
];

function typed(text: string, t: number, start: number, end: number) {
  if (t < start) return "";
  if (t >= end) return text;
  return text.slice(0, Math.floor(((t - start) / (end - start)) * text.length));
}

export function HeroDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visible = useInViewLoop(ref, 0.5);
  const reduced = useReduced();
  const [paused, setPaused] = useState(false);
  const t = useTimeline({ duration: LOOP, running: visible && !paused, reduced, finalAt: 14900 });

  const show = (at: number) => t >= at && t < 16000;
  const nextModule = t >= 15800;
  const promptText = typed(PROMPT, t, 1800, 3700);
  const copied = t >= 3800 && t < 4900;
  const lines = terminalScript.filter((l) => t >= l.at && t < 16000);
  const checkpoint: "idle" | "working" | "passed" = t >= 10000 ? "passed" : t >= 7600 ? "working" : "idle";
  const decisionText = typed(DECISION, t, 12000, 14300);
  const saved = t >= 14500;

  // Keep the newest cell in view on small screens.
  const stage = [show(1500), show(4000), show(10000), show(12000)].filter(Boolean).length;
  const atStart = t < 1000;
  const lineCount = lines.length;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (atStart) el.scrollTo({ top: 0 });
    else el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [stage, lineCount, atStart, reduced]);

  return (
    <div ref={ref} className="relative">
      <AppWindow
        title={<span className="hidden sm:inline">Buildproof · Notebook</span>}
        className="shadow-[0_60px_160px_-60px_rgba(255,255,255,0.10)]"
        right={<DemoControl paused={paused} onToggle={() => setPaused((p) => !p)} label="demo" />}
      >
        <div className="grid md:grid-cols-[264px_1fr]" aria-label="Demo: a learner working through Pulse, module 3" role="img">
          {/* Sidebar */}
          <aside className="hidden border-r border-line md:flex md:flex-col" aria-hidden>
            <div className="p-3">
              <div className="flex h-9 items-center gap-2 rounded-[10px] bg-surface-2 px-3 t-small text-text-3">
                <IconSearch size={14} />
                Search projects
              </div>
            </div>
            <ul className="flex-1 space-y-0.5 px-2">
              {rows.map((r) => (
                <li
                  key={r.name}
                  className={`flex items-center gap-3 rounded-[10px] px-2.5 py-2 ${r.active ? "bg-surface-2" : ""}`}
                >
                  <AccentAvatar color={r.color} size={30} label={r.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="t-small font-medium text-text-1">{r.name}</span>
                      <span className="text-[11px] text-text-3">{r.time}</span>
                    </div>
                    <p className={`truncate text-[12px] leading-4 ${r.active ? "text-working" : "text-text-2"}`}>{r.status}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-2.5 border-t border-line p-3">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-surface-3 t-badge text-text-1">S</span>
              <span className="t-small text-text-2">Sample learner</span>
            </div>
          </aside>

          {/* Main pane */}
          <div className="flex min-w-0 flex-col">
            <div className="relative flex h-12 items-center border-b border-line px-4 md:px-6" aria-hidden>
              <AnimatePresence mode="wait" initial={false}>
                <m.p
                  key={nextModule ? "m4" : "m3"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease }}
                  className="t-small text-text-1 truncate"
                >
                  Pulse · Module {nextModule ? "4 · Presence at scale" : "3 · Delivery receipts"}
                </m.p>
              </AnimatePresence>
              <div className="ml-auto hidden sm:block">
                <ToolTabsView tools={["Claude Code", "Codex"]} active="Claude Code" />
              </div>
            </div>

            <div
              ref={scrollRef}
              className="no-scrollbar relative h-[440px] overflow-hidden p-4 md:h-[500px] md:p-6"
              aria-hidden
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,0.9fr)] lg:items-start">
                <div className="space-y-3.5 min-w-0">
                  <AnimatePresence>
                    {show(0) ? (
                      <m.p
                        key="explain"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease }}
                        className="t-small md:text-[14px] md:leading-[22px] text-text-2 max-w-[52ch]"
                      >
                        Messages need three states: sent, delivered, read. Have the agent plan it before it writes code.
                      </m.p>
                    ) : null}
                    {show(1500) ? (
                      <m.div key="prompt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
                        <CellShell
                          label={<ToolTabsView tools={["Claude Code", "Codex"]} active="Claude Code" />}
                          right={
                            <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-[12px] text-text-1">
                              {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
                              {copied ? "Copied" : "Copy"}
                            </span>
                          }
                        >
                          <p className="min-h-[80px] px-4 py-3 font-mono text-[12.5px] leading-[20px] text-text-1">
                            {promptText}
                            {t < 3700 ? <span className="ml-px inline-block h-[14px] w-[7px] translate-y-[2px] bg-text-1" style={{ animation: "caret-blink 1s steps(1) infinite" }} /> : null}
                          </p>
                          <p className="border-t border-line px-4 py-2 text-[12px] text-text-3">Run this in plan mode first</p>
                        </CellShell>
                      </m.div>
                    ) : null}
                    {show(7600) ? (
                      <m.div key="checkpoint" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
                        <CellShell className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <p className="t-small text-text-1">Checkpoint</p>
                            <p className="font-mono text-[12px] text-text-2 truncate">pnpm test · expect 6 passed</p>
                          </div>
                          <CheckpointChip status={checkpoint} />
                        </CellShell>
                      </m.div>
                    ) : null}
                    {show(12000) ? (
                      <m.div key="decision" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease }}>
                        <CellShell label="Decision · What did you change, and why?" right={saved ? <StatusChip status="passed">Saved to your build journal</StatusChip> : null}>
                          <p className="min-h-[66px] px-4 py-3 text-[13px] leading-[20px] text-text-1">{decisionText}</p>
                        </CellShell>
                      </m.div>
                    ) : null}
                    {t >= 15000 && t < 15800 ? (
                      <m.div key="dots" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-1 py-2">
                        <ThinkingDots />
                      </m.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <AnimatePresence>
                  {show(4000) ? (
                    <m.div
                      key="terminal"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease }}
                      className="min-w-0"
                    >
                      <TerminalView lines={lines} className="min-h-[200px]" />
                    </m.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </AppWindow>
    </div>
  );
}
