"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MapLayout } from "@/lib/roadmap/layout";
import { statusOf, tally, type TopicStatus } from "@/lib/roadmap/progress";
import { buildPlan, dayNumber } from "@/lib/roadmap/plan";
import type { SectionView, TopicView } from "@/lib/roadmap/view";
import { track } from "@/lib/track";
import { ProgressProvider, useProgress } from "./ProgressContext";
import { TopicBody } from "./TopicBody";

interface Props {
  title: string;
  subtitle: string;
  credit: string;
  basePath: string;
  layout: MapLayout;
  sections: SectionView[];
  topics: TopicView[];
}

export function RoadmapExplorer(props: Props) {
  return (
    <ProgressProvider>
      <Explorer {...props} />
    </ProgressProvider>
  );
}

const today = () => new Date().toISOString().slice(0, 10);
const qs = (n: number) => `${n} Q${n === 1 ? "" : "s"}`;

function Explorer({ title, subtitle, credit, basePath, layout, sections, topics }: Props) {
  const { progress } = useProgress();
  const byId = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const order = useMemo(() => topics.map((t) => t.id), [topics]);
  const [open, setOpen] = useState<string | null>(null);
  const pushed = useRef(false);

  const minimumIds = useMemo(
    () => sections.filter((s) => s.minimum).flatMap((s) => s.topicIds),
    [sections],
  );
  const pathIds = progress.path === "minimum" ? minimumIds : order;
  const plan = useMemo(
    () => (progress.plan ? buildPlan(pathIds, progress.plan.days, progress.plan.start) : null),
    [progress.plan, pathIds],
  );
  const todayDay =
    plan && progress.plan
      ? plan[dayNumber(progress.plan.start, today(), progress.plan.days) - 1]
      : null;
  const todaySet = new Set(todayDay?.topicIds ?? []);
  const sectionOfMinimum = new Map(sections.map((s) => [s.id, s.minimum]));

  useEffect(() => {
    track("roadmap_view", {});
  }, []);

  const openTopic = useCallback(
    (id: string, push = true) => {
      setOpen(id);
      track("node_open", { topic: id });
      if (push) {
        history.pushState({ roadmapTopic: id }, "", `${basePath}/${id}`);
        pushed.current = true;
      }
    },
    [basePath],
  );

  const close = useCallback(() => {
    if (pushed.current) {
      pushed.current = false;
      history.back();
    } else {
      setOpen(null);
      history.replaceState(null, "", basePath);
    }
  }, [basePath]);

  useEffect(() => {
    const onPop = () => {
      const m = window.location.pathname.match(new RegExp(`^${basePath}/([a-z0-9-]+)$`));
      if (m && byId.has(m[1])) setOpen(m[1]);
      else {
        setOpen(null);
        pushed.current = false;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [basePath, byId]);

  const current = open ? byId.get(open) : null;
  const idx = current ? order.indexOf(current.id) : -1;
  const nextTopic = idx >= 0 && idx < order.length - 1 ? byId.get(order[idx + 1]) : null;
  const nextSectionWhy =
    nextTopic && current && nextTopic.sectionId !== current.sectionId
      ? (sections.find((s) => s.id === nextTopic.sectionId)?.why ?? null)
      : null;

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (
        (e.key === "ArrowRight" || e.key === "ArrowLeft") &&
        !(e.target instanceof HTMLInputElement)
      ) {
        const j = idx + (e.key === "ArrowRight" ? 1 : -1);
        if (j >= 0 && j < order.length) {
          setOpen(order[j]);
          history.replaceState({ roadmapTopic: order[j] }, "", `${basePath}/${order[j]}`);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [current, idx, order, close, basePath]);

  const statusFor = (id: string): TopicStatus | "today" =>
    todaySet.has(id) && statusOf(progress, id) === "not_started" ? "today" : statusOf(progress, id);
  const dim = (sectionId: string) =>
    progress.path === "minimum" && !sectionOfMinimum.get(sectionId);

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-start justify-between gap-5 px-4 sm:px-6">
        <Legend />
        <div className="flex min-w-0 flex-[1_1_300px] flex-col items-center gap-1 text-center">
          <span className="label">// the roadmap</span>
          <h1 className="h-display m-0 text-[clamp(36px,5vw,52px)]">{title}</h1>
          <span className="text-muted font-mono text-[13px]">{subtitle}</span>
        </div>
        <ProgressPanel
          pathIds={pathIds}
          plan={plan}
          todayDay={todayDay}
          byId={byId}
          onOpen={openTopic}
        />
      </div>

      {/* Desktop: the branching map */}
      <div className="hidden overflow-x-auto xl:block">
        <div className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
          <svg
            width={layout.width}
            height={layout.height}
            className="absolute inset-0"
            aria-hidden="true"
          >
            <line
              x1={layout.spine.x}
              y1={layout.spine.y1}
              x2={layout.spine.x}
              y2={layout.spine.y2}
              stroke="#2340B0"
              strokeWidth={3}
            />
            {layout.edges.map((e, i) => (
              <path
                key={i}
                d={e.d}
                fill="none"
                stroke="#2340B0"
                strokeOpacity={dim(e.sectionId) ? 0.2 : 0.55}
                strokeWidth={2}
                strokeDasharray="2 6"
                strokeLinecap="round"
              />
            ))}
          </svg>
          {layout.groups.map((g) => (
            <div
              key={`${g.sectionId}-${g.title}`}
              className="bg-note absolute rounded border border-[#E8DA9A] px-4 py-3 shadow-[0_10px_22px_rgba(60,48,20,0.12)] transition-opacity"
              style={{
                left: g.x,
                top: g.y,
                width: g.w,
                height: g.h,
                opacity: dim(g.sectionId) ? 0.4 : 1,
              }}
            >
              <span
                aria-hidden="true"
                className="absolute -top-2.5 left-1/2 -ml-[45px] h-5 w-[90px] -rotate-2 border border-black/5 bg-white/70"
              />
              <div className="hand text-blue text-[21px]">{g.title}</div>
              {g.lines.map((l) => (
                <div
                  key={l}
                  className="text-body font-mono text-xs leading-[1.65] whitespace-nowrap"
                >
                  {l}
                </div>
              ))}
            </div>
          ))}
          {layout.whys.map((w) => (
            <div
              key={w.sectionId}
              className="absolute flex justify-center"
              style={{ left: layout.spine.x - 260, width: 520, top: w.y + 14 }}
            >
              <WhyPill text={w.text} faded={dim(w.sectionId)} />
            </div>
          ))}
          {layout.mains.map((m) => {
            const s = sections.find((x) => x.id === m.sectionId)!;
            const hasToday = s.topicIds.some((id) => todaySet.has(id));
            return (
              <div
                key={m.sectionId}
                className={`font-head text-card absolute flex items-center justify-center gap-2.5 rounded-[10px] text-[17px] font-bold whitespace-nowrap ${dim(m.sectionId) ? "bg-[#a39a88] shadow-[0_4px_0_#8a8273]" : hasToday ? "bg-blue shadow-[0_4px_0_#16297A]" : "bg-ink shadow-[0_4px_0_#000]"}`}
                style={{ left: m.x, top: m.y, width: m.w, height: m.h }}
              >
                {m.title}
                {s.questionCount ? (
                  <span className="qc !bg-marker !text-ink">{qs(s.questionCount)}</span>
                ) : null}
              </div>
            );
          })}
          {layout.nodes.map((n) => {
            const t = byId.get(n.topicId)!;
            return (
              <a
                key={n.topicId}
                href={t.href}
                onClick={(e) => {
                  e.preventDefault();
                  openTopic(n.topicId);
                }}
                className="absolute no-underline transition-opacity"
                style={{
                  left: n.x,
                  top: n.y,
                  width: n.w,
                  height: n.h,
                  opacity: dim(n.sectionId) ? 0.4 : 1,
                }}
              >
                <TopicChip t={t} status={statusFor(n.topicId)} />
              </a>
            );
          })}
        </div>
        <p className="text-muted m-0 mt-4 text-center font-mono text-xs">{credit}</p>
      </div>

      {/* Phone and tablet: a stacked list in the same order */}
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3 px-4 xl:hidden">
        {sections.map((s) => (
          <div
            key={s.id}
            className="flex flex-col gap-3 transition-opacity"
            style={{ opacity: dim(s.id) ? 0.5 : 1 }}
          >
            {s.why && s.number > 1 ? (
              <div className="flex justify-center">
                <WhyPill text={s.why} />
              </div>
            ) : null}
            <div
              className={`font-head text-card flex items-center justify-between gap-2 rounded-[10px] px-4 py-3 text-[17px] font-bold ${s.topicIds.some((id) => todaySet.has(id)) ? "bg-blue" : "bg-ink"}`}
            >
              <span>
                <span className="mr-2 font-mono text-xs text-[#BDB4A0]">
                  {String(s.number).padStart(2, "0")}
                </span>
                {s.title}
              </span>
              {s.questionCount ? (
                <span className="qc !bg-marker !text-ink">{qs(s.questionCount)}</span>
              ) : null}
            </div>
            {s.groups.map((g) => (
              <div
                key={g.title}
                className="bg-note flex flex-col gap-2 rounded border border-[#E8DA9A] p-3"
              >
                <span className="hand text-blue text-xl">{g.title}</span>
                {g.lines.map((l) => (
                  <span key={l} className="text-body font-mono text-xs">
                    {l}
                  </span>
                ))}
                {g.topicIds.map((id) => (
                  <MobileRow key={id} t={byId.get(id)!} status={statusFor(id)} onOpen={openTopic} />
                ))}
              </div>
            ))}
            {[...s.left, ...s.right].map((id) => (
              <MobileRow key={id} t={byId.get(id)!} status={statusFor(id)} onOpen={openTopic} />
            ))}
          </div>
        ))}
        <p className="text-muted m-0 mt-4 text-center font-mono text-xs">{credit}</p>
      </div>

      {current ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
        >
          <button
            type="button"
            aria-label="Close"
            className="bg-ink/35 absolute inset-0 h-full w-full cursor-default"
            onClick={close}
          />
          <div className="border-ink bg-card absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col overflow-y-auto rounded-t-[22px] border-t-[1.5px] md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[580px] md:rounded-none md:border-t-0 md:border-l-[1.5px] md:shadow-[-10px_0_30px_rgba(0,0,0,0.18)]">
            <div className="border-rule-2 bg-card sticky top-0 z-10 flex flex-col gap-2 border-b px-5 pt-3 pb-3 md:px-6 md:pt-5">
              <span aria-hidden="true" className="bg-chip mx-auto h-1.5 w-11 rounded md:hidden" />
              <div className="flex items-center justify-between gap-3">
                <span className="label !text-xs">
                  {String(current.sectionNumber).padStart(2, "0")} ·{" "}
                  {current.sectionTitle.toLowerCase()} → {current.title.toLowerCase()}
                </span>
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous topic"
                    disabled={idx <= 0}
                    onClick={() => openTopicReplace(order[idx - 1])}
                    className="border-chip min-h-9 min-w-9 rounded-lg border disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next topic"
                    disabled={idx >= order.length - 1}
                    onClick={() => openTopicReplace(order[idx + 1])}
                    className="border-chip min-h-9 min-w-9 rounded-lg border disabled:opacity-30"
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    onClick={close}
                    className="border-chip ml-1 min-h-9 rounded-lg border px-2.5 font-mono text-xs"
                    autoFocus
                  >
                    esc ✕
                  </button>
                </span>
              </div>
              <h2 className="h-display m-0 text-[30px]">{current.title}</h2>
            </div>
            <div className="bg-paper px-5 py-4 md:px-6">
              <TopicBody
                t={current}
                next={
                  nextTopic
                    ? {
                        title: nextTopic.title,
                        why: nextSectionWhy,
                        href: nextTopic.href,
                        onOpen: () => openTopicReplace(nextTopic.id),
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  function openTopicReplace(id: string) {
    setOpen(id);
    track("node_open", { topic: id });
    history.replaceState({ roadmapTopic: id }, "", `${basePath}/${id}`);
  }
}

export function WhyPill({ text, faded = false }: { text: string; faded?: boolean }) {
  const c = faded ? "text-[#d9a79c] border-[#e3bdb3]" : "text-red border-red";
  return (
    <div
      className={`bg-paper flex items-center gap-2 rounded-full border-[1.5px] border-dashed px-4 pt-1 pb-1.5 ${c}`}
    >
      <span className="font-mono text-[11px] font-semibold whitespace-nowrap">WHY NEXT</span>
      <span className="hand text-[21px] leading-tight">{text}</span>
      <span aria-hidden="true">↓</span>
    </div>
  );
}

const dotFor: Record<TopicStatus | "today", { cls: string; mark: string; label: string }> = {
  ready: { cls: "bg-green text-white", mark: "✓", label: "interview-ready" },
  revising: { cls: "bg-marker text-ink", mark: "◐", label: "revising" },
  today: { cls: "bg-blue text-white", mark: "●", label: "on today's plan" },
  not_started: {
    cls: "border-[1.5px] border-chip bg-card text-chip",
    mark: "○",
    label: "not started",
  },
  skipping: { cls: "bg-rule text-muted", mark: "–", label: "skipping" },
};

function TopicChip({ t, status }: { t: TopicView; status: TopicStatus | "today" }) {
  const d = dotFor[status];
  const blue = status === "today";
  return (
    <span
      className={`bg-card text-ink flex h-full items-center gap-2 rounded-[9px] border-[1.5px] px-2.5 text-[14.5px] font-medium ${blue ? "border-blue shadow-[3px_3px_0_var(--blue)]" : "border-ink shadow-[3px_3px_0_var(--ink)]"} ${status === "skipping" ? "opacity-60" : ""} hover:-translate-y-px`}
      title={`${t.title}: ${d.label}`}
    >
      <span
        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-bold ${d.cls}`}
      >
        {d.mark}
      </span>
      <span className="flex-1 truncate">{t.title}</span>
      {t.questionCount ? <span className="qc">{t.questionCount}Q</span> : null}
    </span>
  );
}

function MobileRow({
  t,
  status,
  onOpen,
}: {
  t: TopicView;
  status: TopicStatus | "today";
  onOpen: (id: string) => void;
}) {
  return (
    <a
      href={t.href}
      onClick={(e) => {
        e.preventDefault();
        onOpen(t.id);
      }}
      className="block h-12 no-underline"
    >
      <TopicChip t={t} status={status} />
    </a>
  );
}

function Legend() {
  return (
    <div className="card-ink hidden w-[290px] flex-col gap-1.5 rounded-[14px] p-3.5 text-[13.5px] shadow-[3px_3px_0_var(--ink)] lg:flex">
      <span className="text-muted font-mono text-[11px] font-semibold">HOW TO READ THIS</span>
      <span>
        <span className="bg-ink font-head text-card mr-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold">
          Topic
        </span>{" "}
        must-know, top to bottom
      </span>
      <span>
        <span className="hand border-red text-red mr-1 inline-block rounded-full border-[1.5px] border-dashed px-2 text-base">
          why next
        </span>{" "}
        the problem that leads on
      </span>
      <span>
        <span className="border-ink bg-card mr-1 inline-block rounded-md border-[1.5px] px-2 text-xs">
          Sub-topic
        </span>{" "}
        click it to open
      </span>
      <span>
        <span className="qc !bg-marker mr-1">8 Qs</span> interview questions on it
      </span>
    </div>
  );
}

function ProgressPanel({
  pathIds,
  plan,
  todayDay,
  byId,
  onOpen,
}: {
  pathIds: string[];
  plan: ReturnType<typeof buildPlan> | null;
  todayDay: ReturnType<typeof buildPlan>[number] | null;
  byId: Map<string, TopicView>;
  onOpen: (id: string) => void;
}) {
  const { progress, loaded, setPath, setPlan } = useProgress();
  const [showPlan, setShowPlan] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const t = tally(progress, pathIds);
  const shareHref = `/og/roadmap?ready=${t.ready}&total=${t.total}&readiness=${t.readiness}&path=${progress.path}`;

  return (
    <div className="card-ink flex w-full max-w-[340px] flex-col gap-2.5 rounded-[14px] p-3.5 shadow-[3px_3px_0_var(--ink)]">
      <span className="text-muted font-mono text-[11px] font-semibold">
        YOUR PROGRESS · SAVED ON THIS DEVICE · NO LOGIN
      </span>
      <div className="flex items-center gap-2.5">
        <div className="h-2.5 flex-1 overflow-hidden rounded bg-[#EFE9DA]">
          <div
            className="bg-green h-full transition-[width]"
            style={{ width: `${t.total ? (t.ready / t.total) * 100 : 0}%` }}
          />
        </div>
        <b className="font-mono text-[13px]">{loaded ? `${t.ready}/${t.total}` : `–/${t.total}`}</b>
      </div>
      <span className="text-muted text-[13px]">HLD readiness: {t.readiness}%</span>
      <div
        className="border-ink flex overflow-hidden rounded-full border-[1.5px] text-[13px] font-semibold"
        role="group"
        aria-label="Which topics to show"
      >
        {(["minimum", "all"] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={progress.path === p}
            onClick={() => setPath(p)}
            className={`min-h-9 flex-1 ${progress.path === p ? "bg-ink text-card" : "bg-card"}`}
          >
            {p === "minimum" ? "Minimum to pass" : "Everything"}
          </button>
        ))}
      </div>
      {plan && todayDay && progress.plan ? (
        <div className="flex flex-col gap-1.5 text-[13px]">
          <span>
            Today (day {todayDay.day} of {progress.plan.days}):{" "}
            {todayDay.kind === "learn" ? (
              todayDay.topicIds.map((id, i) => (
                <span key={id}>
                  {i ? ", " : ""}
                  <button
                    type="button"
                    className="text-blue font-semibold underline-offset-2 hover:underline"
                    onClick={() => onOpen(id)}
                  >
                    {byId.get(id)?.title}
                  </button>
                </span>
              ))
            ) : (
              <b>
                {todayDay.kind === "mock"
                  ? "a mock design, out loud"
                  : "revise your weakest topics"}
              </b>
            )}
          </span>
          <span className="flex gap-3">
            <button
              type="button"
              className="text-blue font-semibold"
              onClick={() => setShowPlan((v) => !v)}
            >
              {showPlan ? "Hide plan" : "See full plan"}
            </button>
            <button type="button" className="text-muted" onClick={() => setPlan(null)}>
              Reset
            </button>
          </span>
          {showPlan ? (
            <ol className="m-0 flex max-h-56 list-none flex-col gap-1 overflow-y-auto p-0 font-mono text-[11.5px]">
              {plan.map((d) => (
                <li key={d.day} className={d.day === todayDay.day ? "text-blue font-bold" : ""}>
                  D{d.day} ·{" "}
                  {d.kind === "learn"
                    ? d.topicIds.map((id) => byId.get(id)?.title).join(", ")
                    : d.kind === "mock"
                      ? "mock design"
                      : "revision"}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
          <span>Interview soon? Make a plan:</span>
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              className="border-ink bg-card rounded-md border-[1.5px] px-2 py-0.5 font-semibold"
              onClick={() => setPlan({ days: d, start: today() })}
            >
              {d} days
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-[13px]">
        <a
          href={shareHref}
          target="_blank"
          rel="noopener"
          className="font-semibold"
          onClick={() => track("share_card", { ready: t.ready })}
        >
          Share my progress card ↗
        </a>
      </div>
      <form
        className="flex gap-1.5"
        onSubmit={async (e) => {
          e.preventDefault();
          const { encodeProgress } = await import("@/lib/roadmap/progress");
          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, source: "roadmap", progress: encodeProgress(progress) }),
          });
          const data = (await res.json()) as { message?: string; error?: string };
          setMsg(data.message ?? data.error ?? "Sent.");
        }}
      >
        <label htmlFor="rm-email" className="sr-only">
          Email
        </label>
        <input
          id="rm-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email me a link to my progress"
          className="border-ink bg-card min-h-9 min-w-0 flex-1 rounded-md border-[1.5px] px-2 text-[13px]"
        />
        <button
          type="submit"
          className="bg-ink text-card rounded-md px-2.5 text-[13px] font-semibold"
        >
          Send
        </button>
      </form>
      {msg ? (
        <span role="status" className="text-green-dark text-[12.5px]">
          {msg}
        </span>
      ) : null}
    </div>
  );
}
