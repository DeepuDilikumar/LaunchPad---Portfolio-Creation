"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TopicView } from "@/lib/roadmap/view";
import { statusOf, type TopicStatus } from "@/lib/roadmap/progress";
import { track } from "@/lib/track";
import { useProgress } from "./ProgressContext";

const tagLabel: Record<string, string> = { measurement: "measure" };
type Tab = "explain" | "ask" | "cloud" | "check";

export function StatusButtons({ topicId }: { topicId: string }) {
  const { progress, setStatus } = useProgress();
  const cur = statusOf(progress, topicId);
  const opts: { s: TopicStatus; label: string; cls: string }[] = [
    { s: "not_started", label: "○ Not started", cls: "" },
    { s: "revising", label: "◐ Revising", cls: "bg-amber-wash" },
    { s: "ready", label: "✓ Interview-ready", cls: "bg-green-wash" },
    { s: "skipping", label: "Skip for now", cls: "border-dashed" },
  ];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Your status for this topic">
      {opts.map((o) => {
        const on = cur === o.s;
        return (
          <button
            key={o.s}
            type="button"
            aria-pressed={on}
            onClick={() => setStatus(topicId, o.s)}
            className={`min-h-10 rounded-[10px] border-[1.5px] px-3 text-[13.5px] font-semibold ${on ? `border-ink ${o.cls || "bg-card"} shadow-[0_3px_0_var(--ink)]` : "border-chip bg-card text-muted"} ${o.s === "skipping" ? "border-dashed" : ""}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Flow({ flow }: { flow: NonNullable<TopicView["flow"]> }) {
  return (
    <div className="flex flex-col gap-1.5">
      {flow.note ? (
        <span className="hand text-red -rotate-2 self-end text-xl">{flow.note}</span>
      ) : null}
      <div className="flex flex-wrap items-center gap-2" aria-label="Diagram">
        {flow.nodes.map((n, i) => (
          <span key={n.label} className="flex items-center gap-2">
            <span
              className={`rounded-lg border-[1.5px] px-3 py-1.5 text-sm font-semibold ${n.bad ? "border-red bg-red-wash" : "border-ink bg-card"}`}
            >
              {n.label}
            </span>
            {i < flow.nodes.length - 1 ? <span className="text-muted font-mono">→</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function TheyAsk({ t }: { t: TopicView }) {
  useEffect(() => {
    if (t.locked.length) track("locked_q_view", { topic: t.id });
  }, [t.id, t.locked.length]);
  return (
    <div className="flex flex-col gap-3.5">
      {t.free.map((q) => (
        <div key={q.text} className="flex flex-col gap-3">
          <div className="bg-term flex flex-col gap-2.5 rounded-2xl p-3.5">
            <div className="bg-blue flex flex-col gap-1.5 rounded-[12px_12px_12px_4px] px-3.5 py-3 shadow-[0_3px_0_#16297A]">
              <span className="bg-card text-blue self-start rounded px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.06em]">
                INTERVIEWER
              </span>
              <span className="text-card text-[16px] leading-snug font-medium">{q.text}</span>
            </div>
            {q.weak ? (
              <div className="flex max-w-[88%] flex-col gap-1 self-end rounded-[12px_12px_4px_12px] border-[1.5px] border-dashed border-[#6b5d4a] bg-[#2A2720] px-3 py-2.5">
                <span className="font-mono text-[10px] font-bold text-[#E8B93C]">
                  THE USUAL ANSWER
                </span>
                <span className="text-[15px] text-[#EDE7D6] line-through decoration-[#E2604A] decoration-2">
                  “{q.weak}”
                </span>
                {q.redNote ? (
                  <span className="hand text-xl text-[#ff8a73]">{q.redNote}</span>
                ) : null}
              </div>
            ) : null}
            {q.followUps.map((f) => (
              <div key={f.text} className="flex items-start gap-2.5">
                <span
                  className="mt-3 font-mono text-[10px] font-bold text-[#C9D4FF]"
                  aria-hidden="true"
                >
                  ↳
                </span>
                <div className="flex flex-1 flex-col gap-1 rounded-[12px_12px_12px_4px] border-[1.5px] border-[#9DB0F2] bg-[#E9EEFF] px-3 py-2">
                  <span className="flex items-center gap-1.5">
                    <span className="text-blue font-mono text-[10px] font-bold">
                      INTERVIEWER · THEN
                    </span>
                    <span className={`tag tag-${f.type}`}>{tagLabel[f.type] ?? f.type}</span>
                  </span>
                  <span className="text-ink text-[15px] leading-snug">{f.text}</span>
                </div>
              </div>
            ))}
          </div>
          {q.moves.length ? (
            <div className="border-green bg-green-wash flex flex-col gap-1.5 rounded-[10px] border-[1.5px] px-3.5 py-3 text-[14.5px]">
              <span className="text-green-dark font-mono text-[11px] font-semibold">
                STRONG ANSWER, FROM FIRST PRINCIPLES
              </span>
              {q.moves.map((m, i) => (
                <span key={m}>
                  <b className="font-head text-green-dark">{i + 1}</b> {m}
                </span>
              ))}
            </div>
          ) : null}
          {q.askedIn ? <span className="text-muted text-[13px]">Asked in: {q.askedIn}</span> : null}
        </div>
      ))}
      {t.locked.map((l) => (
        <div
          key={l.text}
          className="border-ink bg-card relative min-h-[92px] overflow-hidden rounded-xl border-[1.5px] p-3.5"
        >
          <div aria-hidden="true" className="text-[13px] leading-relaxed blur-[4px] select-none">
            INTERVIEWER · {l.text}
            <br />
            THEN · …
          </div>
          <div className="from-card/20 via-card/90 to-card/95 absolute inset-0 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r p-3.5">
            <span className="hand text-red -rotate-3 text-[22px]">the one that sinks people →</span>
            <Link
              href={l.ctaHref}
              className="keycap !min-h-11 !px-4 !py-2 !text-[15px]"
              onClick={() => track("upsell_click", { topic: t.id, ref: l.ref ?? "sd-guide" })}
            >
              {l.ctaLabel}
            </Link>
          </div>
        </div>
      ))}
      {!t.free.length && !t.locked.length ? (
        <p className="text-body m-0">Interview questions for this topic are being written.</p>
      ) : null}
    </div>
  );
}

function Cloud({ c }: { c: NonNullable<TopicView["cloud"]> }) {
  const cols = [
    ["AWS", "#B35C00", c.aws],
    ["GOOGLE CLOUD", "#1a73e8", c.gcp],
    ["AZURE", "#0a6ed1", c.azure],
  ] as const;
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[15px]">
          Say the idea first. <b>Then</b> name the service.
        </span>
        <span className="stamp !border-green !text-green">
          CHECKED{" "}
          {new Date(`${c.lastVerified}T00:00:00Z`)
            .toLocaleString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" })
            .toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {cols.map(([name, color, s]) => (
          <div
            key={name}
            className="card-ink flex flex-col gap-1.5 rounded-[12px] p-3 shadow-[3px_3px_0_var(--ink)]"
          >
            <span className="font-mono text-[11px] font-semibold" style={{ color }}>
              {name}
            </span>
            <b className="text-[15px] leading-tight">{s.service}</b>
            <span className="text-muted text-[12.5px]">{s.use_when}</span>
            {s.status !== "active" ? (
              <span className="bg-red-wash text-red-dark self-start rounded px-1.5 font-mono text-[10px] uppercase">
                {s.status}
              </span>
            ) : null}
            <a
              href={s.docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12.5px] font-semibold"
            >
              docs ↗
            </a>
          </div>
        ))}
      </div>
      {c.gotcha ? (
        <div className="border-red border-l-[3px] pl-3 text-sm">
          <b>Gotcha:</b> {c.gotcha}
        </div>
      ) : null}
      <span className="hand text-blue -rotate-1 self-start text-[22px]">
        name the idea, then the service, then why it fits
      </span>
    </div>
  );
}

function SelfCheck({ t }: { t: TopicView }) {
  const { progress, toggleCheck, setStatus } = useProgress();
  const done = new Set(progress.checks[t.id] ?? []);
  const all = t.selfCheck.length > 0 && t.selfCheck.every((_, i) => done.has(i));
  if (!t.selfCheck.length)
    return <p className="text-body m-0">Self-check questions for this topic are being written.</p>;
  return (
    <div className="flex flex-col gap-3">
      <span className="text-[15px]">
        Answer each one out loud, without notes. Tick it only if you could.
      </span>
      {t.selfCheck.map((s, i) => (
        <label
          key={s}
          className="border-chip bg-card flex min-h-11 items-start gap-3 rounded-lg border-[1.5px] px-3 py-2.5 text-[15px]"
        >
          <input
            type="checkbox"
            checked={done.has(i)}
            onChange={() => toggleCheck(t.id, i)}
            className="mt-1 h-[18px] w-[18px]"
          />
          {s}
        </label>
      ))}
      {all && statusOf(progress, t.id) !== "ready" ? (
        <button
          type="button"
          className="keycap !min-h-11 self-start !text-base"
          onClick={() => setStatus(t.id, "ready")}
        >
          All ticked: mark interview-ready ✓
        </button>
      ) : null}
    </div>
  );
}

export function TopicBody({
  t,
  next,
}: {
  t: TopicView;
  next?: { title: string; why: string | null; href: string; onOpen?: () => void };
}) {
  const [tab, setTab] = useState<Tab>("explain");
  useEffect(() => setTab("explain"), [t.id]);
  const tabs: [Tab, string][] = [
    ["explain", "Explain"],
    ["ask", "They ask"],
    ...(t.cloud ? ([["cloud", "Real world ☁"]] as [Tab, string][]) : []),
    ["check", "Self-check"],
  ];

  if (!t.visible) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-body m-0 text-[16px]">
          This topic is being written. It goes live once it has been reviewed.
        </p>
        <GuideLinks t={t} />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {t.draft ? (
        <span className="border-red text-red-dark self-start rounded-md border-[1.5px] border-dashed px-2 py-0.5 font-mono text-[11px] font-semibold">
          DRAFT · NOT YET REVIEWED
        </span>
      ) : null}
      <p className="text-muted m-0 text-[15px]">
        <span className="hand text-red text-xl">why you’re here:</span> {t.whyHere}
      </p>
      <StatusButtons topicId={t.id} />
      <div
        role="tablist"
        aria-label="Topic sections"
        className="border-ink flex gap-1 overflow-x-auto border-b-[1.5px]"
      >
        {tabs.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-[1.5px] min-h-11 shrink-0 rounded-t-lg px-3 text-[15px] font-semibold ${tab === k ? "border-ink bg-paper border-[1.5px] border-b-0" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex flex-col gap-4">
        {tab === "explain" ? (
          <>
            <p className="m-0 text-[16px] leading-relaxed">{t.summary}</p>
            {t.flow ? <Flow flow={t.flow} /> : null}
            {t.keyTradeoff ? (
              <div className="bg-blue-wash rounded-lg px-3 py-2.5 text-[15px]">
                <span className="text-blue font-mono text-[11px] font-semibold">
                  KEY TRADE-OFF ·{" "}
                </span>
                {t.keyTradeoff}
              </div>
            ) : null}
            {t.indiaNote ? (
              <div className="border-marker text-muted border-l-[3px] pl-3 text-sm">
                In India: {t.indiaNote}
              </div>
            ) : null}
            <GuideLinks t={t} />
          </>
        ) : null}
        {tab === "ask" ? <TheyAsk t={t} /> : null}
        {tab === "cloud" && t.cloud ? <Cloud c={t.cloud} /> : null}
        {tab === "check" ? <SelfCheck t={t} /> : null}
      </div>
      {next ? (
        <Link
          href={next.href}
          onClick={(e) => {
            if (next.onOpen) {
              e.preventDefault();
              next.onOpen();
            }
          }}
          className="border-red text-ink hover:text-ink mt-2 flex flex-col gap-0.5 rounded-xl border-[1.5px] border-dashed px-3.5 py-2.5 no-underline"
        >
          {next.why ? <span className="hand text-red text-xl">{next.why}</span> : null}
          <span className="text-blue font-semibold">next: {next.title} →</span>
        </Link>
      ) : null}
    </div>
  );
}

function GuideLinks({ t }: { t: TopicView }) {
  if (!t.guideQuestions.length) return null;
  return (
    <div className="border-ink bg-card flex flex-col gap-2 rounded-xl border-[1.5px] p-3.5">
      <span className="text-muted font-mono text-[11px] font-semibold">
        QUESTIONS THAT TEST THIS · IN THE BACKEND GUIDE
      </span>
      {t.guideQuestions.map((g) => (
        <Link key={g.label} href={g.href} className="text-[15px] no-underline">
          <span className="text-muted font-mono text-xs">{g.label}</span> {g.title}
        </Link>
      ))}
    </div>
  );
}
