"use client"

import { Check, ChevronDown, Mic, MicOff, Timer, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { inputClass } from "@/components/ui/field"
import type { DefenseAnswer } from "@/lib/data/records"
import { RATING_LABEL, rateAnswer, type AnswerRating } from "@/lib/defense/score"
import { cn } from "@/lib/utils"
import { useSpeech } from "./use-speech"

export type PracticeQuestion = { id: string; day: number; dayTitle: string; question: string; keyPoints: string[] }

const RATING_STYLE: Record<AnswerRating, string> = {
  strong: "bg-success-bg text-success",
  good_start: "bg-warning-bg text-warning",
  needs_work: "bg-danger-bg text-danger",
}

async function submitAnswer(questionId: string, answer: string): Promise<DefenseAnswer> {
  const r = await fetch("/api/defense", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ questionId, answer }),
  })
  const data = await r.json().catch(() => null)
  if (!r.ok) throw new Error(data?.error?.message ?? "Feedback didn't load. Please try again.")
  return data.result
}

function Feedback({ q, result }: { q: PracticeQuestion; result: DefenseAnswer }) {
  const rating = rateAnswer(result.covered)
  const n = result.covered.filter(Boolean).length
  return (
    <div className="mt-4 animate-rise rounded-2xl bg-surface p-4" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-3 py-1 text-sm font-medium", RATING_STYLE[rating])}>{RATING_LABEL[rating]}</span>
        <span className="text-caption text-muted-foreground">
          {n} of {q.keyPoints.length} key points covered
          {result.source === "rules" ? " · checked by keywords" : ""}
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {q.keyPoints.map((k, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            {result.covered[i] ? (
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-label="Covered" />
            ) : (
              <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-label="Not yet covered" />
            )}
            <span className={result.covered[i] ? "" : "text-muted-foreground"}>{k}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">
        <span className="font-medium">Tip: </span>
        {result.tip}
      </p>
      {result.followUp ? (
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">They might ask next: </span>
          {result.followUp}
        </p>
      ) : null}
    </div>
  )
}

function AnswerBox({
  q,
  initial,
  onDone,
  compact,
}: {
  q: PracticeQuestion
  initial?: DefenseAnswer
  onDone?: (r: DefenseAnswer) => void
  compact?: boolean
}) {
  const [answer, setAnswer] = useState(initial?.answer ?? "")
  const [result, setResult] = useState<DefenseAnswer | null>(initial ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const append = useCallback((t: string) => setAnswer((a) => (a ? `${a} ${t}` : t)), [])
  const speech = useSpeech(append)

  async function submit() {
    setBusy(true)
    setError(null)
    speech.stop()
    try {
      const r = await submitAnswer(q.id, answer)
      setResult(r)
      onDone?.(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Feedback didn't load.")
    } finally {
      setBusy(false)
    }
  }

  const id = `answer-${q.id}`
  return (
    <div className={compact ? "" : "mt-3"}>
      <label htmlFor={id} className="sr-only">
        Your answer
      </label>
      <textarea
        id={id}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={5}
        placeholder="Answer like you would out loud. Explain what you built and why."
        className={cn(inputClass, "h-auto min-h-32 resize-y py-3 leading-relaxed")}
      />
      {error ? (
        <p className="mt-2 text-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => void submit()} loading={busy} disabled={!answer.trim()} className="flex-1 sm:flex-none">
          {result ? "Check again" : "Get feedback"}
        </Button>
        {speech.supported ? (
          <Button
            variant="secondary"
            onClick={speech.listening ? speech.stop : speech.start}
            aria-pressed={speech.listening}
          >
            {speech.listening ? <MicOff aria-hidden /> : <Mic aria-hidden />}
            {speech.listening ? "Stop" : "Speak"}
          </Button>
        ) : null}
      </div>
      {result ? <Feedback q={q} result={result} /> : null}
    </div>
  )
}

function Practice({ questions, saved }: { questions: PracticeQuestion[]; saved: Record<string, DefenseAnswer> }) {
  const [open, setOpen] = useState<string | null>(questions.find((q) => !saved[q.id])?.id ?? null)
  const byDay = questions.reduce<Record<number, PracticeQuestion[]>>((acc, q) => {
    ;(acc[q.day] ??= []).push(q)
    return acc
  }, {})
  return (
    <div className="flex flex-col gap-6">
      {Object.entries(byDay).map(([day, qs]) => (
        <section key={day} aria-labelledby={`day-${day}`}>
          <h2 id={`day-${day}`} className="text-caption font-medium text-muted-foreground">
            Day {day} · {qs[0].dayTitle}
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {qs.map((q) => {
              const isOpen = open === q.id
              const done = saved[q.id]
              return (
                <li key={q.id} className="rounded-2xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : q.id)}
                    aria-expanded={isOpen}
                    className="flex min-h-14 w-full items-start gap-3 p-4 text-left"
                  >
                    <span className="flex-1 font-medium">{q.question}</span>
                    {done ? (
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.75rem] font-medium", RATING_STYLE[rateAnswer(done.covered)])}>
                        {RATING_LABEL[rateAnswer(done.covered)]}
                      </span>
                    ) : null}
                    <ChevronDown className={cn("mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-border px-4 pb-4">
                      <AnswerBox q={q} initial={saved[q.id]} />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

const MOCK_SECONDS = 120

function Mock({ questions, onExit }: { questions: PracticeQuestion[]; onExit: () => void }) {
  const [set] = useState(() => [...questions].sort(() => Math.random() - 0.5).slice(0, 5))
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<Record<string, DefenseAnswer>>({})
  const [left, setLeft] = useState(MOCK_SECONDS)
  const q = set[index]

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [index])

  function next() {
    setLeft(MOCK_SECONDS)
    setIndex((i) => i + 1)
  }

  if (!q) {
    const strong = Object.values(results).filter((r) => rateAnswer(r.covered) === "strong").length
    return (
      <div className="animate-rise rounded-2xl bg-surface p-5">
        <h2 className="text-h3 font-medium">Mock interview done</h2>
        <p className="mt-1 text-muted-foreground">
          {strong} of {set.length} answers were strong. Practise the rest once more, out loud.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {set.map((x) => {
            const r = results[x.id]
            return (
              <li key={x.id} className="flex items-start justify-between gap-3 text-sm">
                <span>{x.question}</span>
                {r ? (
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[0.75rem] font-medium", RATING_STYLE[rateAnswer(r.covered)])}>
                    {RATING_LABEL[rateAnswer(r.covered)]}
                  </span>
                ) : (
                  <span className="shrink-0 text-muted-foreground">Skipped</span>
                )}
              </li>
            )
          })}
        </ul>
        <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={onExit}>
          Back to practice
        </Button>
      </div>
    )
  }

  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, "0")
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {index + 1} of {set.length}
        </span>
        <span className={cn("tabular inline-flex items-center gap-1 font-mono", left === 0 && "text-warning")}>
          <Timer className="size-4" aria-hidden />
          {mm}:{ss}
        </span>
      </div>
      <h2 className="mt-3 text-h3 font-medium">{q.question}</h2>
      <p className="mt-1 text-caption text-muted-foreground">About Day {q.day}: {q.dayTitle}. Aim for under two minutes.</p>
      <div className="mt-3">
        <AnswerBox key={q.id} q={q} compact onDone={(r) => setResults((m) => ({ ...m, [q.id]: r }))} />
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant={results[q.id] ? "default" : "ghost"} onClick={next}>
          {index + 1 === set.length ? "Finish" : results[q.id] ? "Next question" : "Skip"}
        </Button>
      </div>
    </div>
  )
}

export function DefensePractice({
  questions,
  saved,
  aiEnabled,
}: {
  questions: PracticeQuestion[]
  saved: Record<string, DefenseAnswer>
  aiEnabled: boolean
}) {
  const [mode, setMode] = useState<"practice" | "mock">("practice")
  const [round, setRound] = useState(0)
  return (
    <div>
      <div className="flex rounded-full bg-muted p-1" role="tablist" aria-label="Mode">
        {(["practice", "mock"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m)
              setRound((r) => r + 1)
            }}
            className={cn(
              "h-10 flex-1 rounded-full text-sm transition-colors",
              mode === m ? "bg-card font-medium shadow-e1" : "text-muted-foreground"
            )}
          >
            {m === "practice" ? "Practice" : "Mock interview"}
          </button>
        ))}
      </div>
      <p className="mt-3 text-caption text-muted-foreground">
        {mode === "practice"
          ? "Pick any question. You'll see which key points you covered."
          : `${Math.min(5, questions.length)} random questions, about two minutes each. Like the real thing.`}
        {aiEnabled ? "" : " Feedback is keyword-based while AI is off."}
      </p>
      <div className="mt-5">
        {mode === "practice" ? (
          <Practice key={round} questions={questions} saved={saved} />
        ) : (
          <Mock key={round} questions={questions} onExit={() => setMode("practice")} />
        )}
      </div>
    </div>
  )
}
