"use client";

import { AnimatePresence, m } from "motion/react";
import { useLoopDemo } from "@/lib/hooks/use-loop-demo";
import { DemoControl } from "./demo-control";
import { TerminalView, ToolTabsView } from "@/components/notebook/views";
import { AccentAvatar, StatusChip } from "@/components/ui/pill";
import { accents } from "@/lib/accents";

const ease = [0.22, 1, 0.36, 1] as const;

function DemoFrame({ children, paused, onToggle, label }: { children: React.ReactNode; paused: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="theme-dark relative h-[220px] overflow-hidden rounded-[16px] border border-line bg-bg md:h-[240px]">
      <div aria-hidden className="h-full">
        {children}
      </div>
      <DemoControl paused={paused} onToggle={onToggle} label={label} className="absolute bottom-3 right-3" />
    </div>
  );
}

const prompts = {
  "Claude Code":
    "Read CLAUDE.md. Plan a token-bucket rate limiter for POST /shorten: 10 requests a minute per IP. Show me the plan and the tests you'll write. Don't edit files yet.",
  Codex:
    "Read AGENTS.md. Propose a plan for a token-bucket rate limiter on POST /shorten (10/min per IP), list the failing tests first, then wait for my approval before editing.",
} as const;

export function PromptTabsDemo() {
  const { ref, t, paused, togglePaused } = useLoopDemo(8000, 1000);
  const tool: keyof typeof prompts = t < 4000 ? "Claude Code" : "Codex";
  return (
    <div ref={ref}>
      <DemoFrame paused={paused} onToggle={togglePaused} label="prompt demo">
        <div className="p-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <ToolTabsView tools={["Claude Code", "Codex"]} active={tool} />
            <span className="text-[11px] text-text-3">Plan mode</span>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <m.p
              key={tool}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease }}
              className="pt-3 font-mono text-[12.5px] leading-[20px] text-text-1"
            >
              {prompts[tool]}
            </m.p>
          </AnimatePresence>
        </div>
      </DemoFrame>
    </div>
  );
}

const k6 = [
  { at: 300, text: "k6 run load.js", tone: "cmd" as const },
  { at: 900, text: "scenarios: 2000 VUs over 2m", tone: "muted" as const },
  { at: 1700, text: "http_req_duration ..... p(95)=184ms" },
  { at: 2300, text: "http_req_failed ....... 0.00%" },
  { at: 2900, text: "ws_sessions ........... 2000" },
  { at: 3700, text: "✓ thresholds passed", tone: "passed" as const },
];

export function CheckpointDemo() {
  const { ref, t, paused, togglePaused } = useLoopDemo(7000, 6000);
  const lines = k6.filter((l) => t >= l.at).map(({ text, tone }) => ({ text, tone }));
  return (
    <div ref={ref}>
      <DemoFrame paused={paused} onToggle={togglePaused} label="checkpoint demo">
        <div className="relative h-full bg-[url(/media/backdrop-1.svg)] bg-cover bg-center p-4 md:p-5">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative">
            <TerminalView title="Example output" lines={lines} className="min-h-[170px] bg-black/85 backdrop-blur" />
          </div>
        </div>
      </DemoFrame>
    </div>
  );
}

export function JournalDemo() {
  const { ref, t, paused, togglePaused } = useLoopDemo(7000, 6000);
  return (
    <div ref={ref}>
      <DemoFrame paused={paused} onToggle={togglePaused} label="journal demo">
        <div className="flex h-full flex-col gap-2.5 p-4">
          <AnimatePresence>
            {t >= 300 ? (
              <m.div key="a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }} className="max-w-[86%] rounded-[14px] rounded-bl-[4px] bg-surface-2 px-3.5 py-2.5">
                <p className="text-[11px] text-text-3">Agent proposed</p>
                <p className="text-[13px] leading-[19px] text-text-1">A receipts row for every message and every reader.</p>
              </m.div>
            ) : null}
            {t >= 1600 ? (
              <m.div key="b" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }} className="ml-auto max-w-[86%] rounded-[14px] rounded-br-[4px] border border-line bg-surface-1 px-3.5 py-2.5">
                <p className="text-[11px] text-text-3">I changed</p>
                <p className="text-[13px] leading-[19px] text-text-1">One read cursor per member. Group reads become a single write.</p>
              </m.div>
            ) : null}
            {t >= 3200 ? (
              <m.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease }} className="mt-auto flex items-center gap-2 t-small text-text-2">
                <AccentAvatar color={accents.pulse} size={20} round />
                Added to case study: Pulse
              </m.div>
            ) : null}
          </AnimatePresence>
        </div>
      </DemoFrame>
    </div>
  );
}

const tutorSteps = ["Reading your error…", "Checking module 3…", "Drafting a fix…"];

export function TutorDemo() {
  const { ref, t, paused, togglePaused } = useLoopDemo(6000, 4500);
  const step = Math.min(2, Math.floor(t / 2000));
  return (
    <div ref={ref}>
      <DemoFrame paused={paused} onToggle={togglePaused} label="tutor demo">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="rounded-[12px] border border-line bg-surface-1 p-3">
            <p className="text-[11px] text-text-3">You pasted</p>
            <p className="mt-1 font-mono text-[12px] leading-[18px] text-failed">Error: duplicate key value violates unique constraint &quot;messages_client_id_key&quot;</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              <AccentAvatar color={accents.pulse} size={24} round className="ring-2 ring-black" />
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-3 ring-2 ring-black text-[10px] text-text-1">M3</span>
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-text-1 ring-2 ring-black">
                <span className="h-3 w-1.5 rounded-[2px] bg-black" />
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <m.span key={step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, ease }}>
                <StatusChip status="working">{tutorSteps[step]}</StatusChip>
              </m.span>
            </AnimatePresence>
          </div>
        </div>
      </DemoFrame>
    </div>
  );
}
