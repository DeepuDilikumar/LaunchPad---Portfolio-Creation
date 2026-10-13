"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Quiz } from "@/lib/quiz";
import { scoreQuiz } from "@/lib/quiz";
import { track } from "@/lib/track";

type Step = "intro" | "question" | "result";

export function QuizEngine({
  quiz,
  guideHref,
  priceLabel,
  priceNote,
  onSale,
}: {
  quiz: Quiz;
  guideHref: string;
  priceLabel: string;
  priceNote: string | null;
  onSale: boolean;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [warmup, setWarmup] = useState<Record<string, string>>({});
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = quiz.questions[index];
  const area = quiz.areas.find((a) => a.id === q?.area);
  const outcome = useMemo(() => scoreQuiz(quiz, answers), [quiz, answers]);
  const warmupDone = quiz.warmup.every((w) => warmup[w.id]);

  useEffect(() => {
    if (step === "result") {
      track("check_finish", { strong: outcome.strong, weakest: outcome.weakest?.id ?? "none" });
      fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz: quiz.slug, answers, warmup }),
      }).catch(() => {});
      window.scrollTo({ top: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === "intro") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3.5">
          <span className="label">// {quiz.questions.length} real follow-ups · no sign-up</span>
          <h1 className="h-display m-0 text-[clamp(34px,5vw,50px)]">
            Find your weakest <span className="marker">follow-up</span> area before the interviewer
            does.
          </h1>
          <p className="text-body m-0 text-lg leading-relaxed">
            Three quick taps about you, then {quiz.questions.length} follow-up questions. Your score
            shows straight away, no email needed.
          </p>
        </div>
        <div className="card-ink flex flex-col gap-5 p-6">
          {quiz.warmup.map((w) => (
            <fieldset key={w.id} className="m-0 border-none p-0">
              <legend className="mb-2.5 p-0 text-[15px] font-semibold">{w.label}</legend>
              <div className="flex flex-wrap gap-2">
                {w.options.map((o) => {
                  const on = warmup[w.id] === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setWarmup((s) => ({ ...s, [w.id]: o }))}
                      className={`border-ink min-h-11 cursor-pointer rounded-full border-[1.5px] px-4 py-2.5 text-[15px] font-medium ${on ? "bg-ink text-card" : "bg-card text-ink"}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <button
            type="button"
            className="keycap"
            disabled={!warmupDone}
            onClick={() => {
              setStep("question");
              track("check_start", warmup);
            }}
          >
            Start the check →
          </button>
        </div>
        <span className="hand text-red -rotate-2 self-start text-2xl">
          about two minutes. your score shows right away.
        </span>
      </div>
    );
  }

  if (step === "question" && q) {
    const picked = answers[q.id];
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <div className="text-muted flex justify-between gap-3 font-mono text-xs">
            <span>
              question {index + 1} of {quiz.questions.length}
            </span>
            <span className="bg-blue-wash text-blue rounded px-2 py-0.5 font-semibold uppercase">
              {area?.title}
            </span>
          </div>
          <div className="flex gap-1" aria-hidden="true">
            {quiz.questions.map((x, i) => (
              <span
                key={x.id}
                className={`h-1.5 flex-1 rounded ${i <= index ? "bg-blue" : "bg-rule"}`}
              />
            ))}
          </div>
        </div>
        <div className="card-ink flex flex-col gap-4 p-6 sm:p-7">
          <span className="text-blue font-mono text-[13px]">interviewer &gt;</span>
          <h2 className="font-head m-0 text-[clamp(21px,3vw,27px)] leading-tight font-bold tracking-tight">
            {q.prompt}
          </h2>
          <div role="radiogroup" aria-label="Your answer" className="flex flex-col gap-2.5">
            {q.options.map((o) => {
              const on = picked === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setAnswers((s) => ({ ...s, [q.id]: o.key }))}
                  className={`text-ink flex min-h-12 cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-4 py-3.5 text-left text-base leading-snug ${on ? "border-blue bg-blue-wash" : "border-chip bg-card"}`}
                >
                  <span className="border-ink flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] border-[1.5px] font-mono text-[13px] font-semibold">
                    {o.key}
                  </span>
                  <span>{o.text}</span>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between gap-3">
            <button
              type="button"
              className="text-muted min-h-11 bg-transparent px-0 font-semibold disabled:opacity-0"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              ← Back
            </button>
            <button
              type="button"
              className="keycap !min-h-[50px] !text-base"
              disabled={!picked}
              onClick={() =>
                index + 1 < quiz.questions.length ? setIndex(index + 1) : setStep("result")
              }
            >
              {index + 1 < quiz.questions.length ? "Next question →" : "See my result →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const shareUrl = `/check/result?s=${outcome.strong}&t=${outcome.total}${outcome.weakest ? `&w=${encodeURIComponent(outcome.weakest.id)}` : ""}`;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="label">
          // your result · {outcome.strong} of {outcome.total} strong
        </span>
        <h1 className="h-display m-0 text-[clamp(32px,4.6vw,46px)]">
          {outcome.weakest ? (
            <>
              Your weak spot: <span className="marker">{outcome.weakest.title.toLowerCase()}</span>
            </>
          ) : (
            <>
              <span className="marker">Strong</span> on every follow-up.
            </>
          )}
        </h1>
      </div>

      <div className="card-ink flex flex-col gap-4 p-6">
        {outcome.areas.map((a) => {
          const gap = a.correct === 0;
          const full = a.correct === a.total;
          return (
            <div key={a.id} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[15px]">
                <span className="font-semibold">{a.title}</span>
                <span
                  className={`font-mono text-[13px] ${gap ? "text-red-dark font-semibold" : ""}`}
                >
                  {a.correct}/{a.total}
                  {gap ? " · gap" : ""}
                </span>
              </div>
              {gap ? (
                <div className="border-red bg-red-wash h-3 rounded-md border-[1.5px] border-dashed" />
              ) : (
                <div className="h-3 overflow-hidden rounded-md bg-[#EFE9DA]">
                  <div
                    className={`h-full ${full ? "bg-green" : "bg-blue"}`}
                    style={{ width: `${(a.correct / a.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {outcome.missed.map(({ question }) => (
        <div
          key={question.id}
          className="border-red bg-card flex flex-col gap-2.5 rounded-2xl border-[1.5px] p-6"
        >
          <span className="text-red-dark font-mono text-[11px] font-semibold">
            THE ONE YOU MISSED
          </span>
          <span className="text-base leading-snug font-semibold">{question.prompt}</span>
          <span className="text-body text-[15px] leading-relaxed">
            Strong answer: {question.strong_answer}
          </span>
        </div>
      ))}

      <div className="bg-ink text-paper flex flex-col gap-3.5 rounded-2xl p-6">
        <span className="text-marker font-mono text-[11px] font-semibold">CLOSE THE GAP</span>
        <span className="font-head text-card text-2xl leading-tight font-bold">
          {outcome.weakest
            ? `The Backend Switch Guide has a full module of ${outcome.weakest.title.toLowerCase()} follow-ups.`
            : "The Backend Switch Guide goes deeper on every one of these areas, and more."}
        </span>
        <div className="flex flex-wrap items-center justify-between gap-3.5">
          {onSale ? (
            <span className="flex items-baseline gap-2.5">
              <span className="h-display text-card text-[40px]">{priceLabel}</span>
              {priceNote ? <span className="text-sm text-[#BDB4A0]">{priceNote}</span> : null}
            </span>
          ) : (
            <span />
          )}
          <Link
            href={guideHref}
            className="bg-marker text-ink hover:text-ink inline-flex min-h-[50px] items-center rounded-xl px-5 font-bold no-underline"
          >
            See the guide
          </Link>
        </div>
      </div>

      <form
        className="border-ink bg-card flex flex-col gap-3 rounded-2xl border-[1.5px] p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, consent, answers, warmup, source: "check" }),
          });
          const data = (await res.json()) as { message?: string; error?: string };
          setBusy(false);
          if (!res.ok) return setError(data.error ?? "Couldn't send. Try again.");
          track("generate_lead", { source: "check", consent });
          setSent(data.message ?? "Sent.");
        }}
      >
        <label htmlFor="report-email" className="text-base font-semibold">
          Email me the full report (PDF)
        </label>
        {sent ? (
          <p role="status" className="text-green-dark m-0 text-[15px]">
            {sent}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2.5">
              <input
                id="report-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="border-ink bg-card min-h-12 flex-[1_1_220px] rounded-[10px] border-[1.5px] px-3.5 text-base"
              />
              <button type="submit" disabled={busy} className="keycap-ghost !min-h-12 !py-2.5">
                {busy ? "Sending…" : "Send report"}
              </button>
            </div>
            <label className="text-body flex min-h-8 items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="h-[18px] w-[18px]"
              />
              Also send 3 short emails on my weak areas over the next 5 days
            </label>
            {error ? (
              <p role="alert" className="text-red-dark m-0 text-sm">
                {error}
              </p>
            ) : null}
            <span className="text-muted font-mono text-xs">
              one-click unsubscribe · we never share your email
            </span>
          </>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-4">
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-11 items-center font-semibold no-underline"
        >
          Share your result ↗
        </a>
        <button
          type="button"
          className="text-blue min-h-11 bg-transparent px-0 text-[15px] font-semibold"
          onClick={() => {
            setStep("intro");
            setIndex(0);
            setAnswers({});
            setSent(null);
          }}
        >
          ↺ Retake the check
        </button>
      </div>
    </div>
  );
}
