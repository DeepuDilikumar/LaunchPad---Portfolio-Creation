"use client"

import { ArrowLeft, ArrowRight, Check, ChevronDown, Flame, Lightbulb, MessagesSquare, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"
import type { ProgramDay } from "@/content/projects"
import { track } from "@/lib/analytics/client"
import { cn } from "@/lib/utils"
import { MentorChat, type ChatMessage } from "./mentor-chat"
import { RichText } from "./rich-text"

type VerifyResult = {
  commits: { sha: string; message: string; url: string }[]
  review: { summary: string; suggestions: string[] } | null
  demo: boolean
}

export function DayView({
  day,
  totalDays,
  initialChecklist,
  initialHints,
  completed,
  streakAfterToday,
  repoUrl,
  demo,
  aiEnabled,
  messages,
  prevDay,
  nextDayUnlocked,
}: {
  day: ProgramDay
  totalDays: number
  initialChecklist: boolean[]
  initialHints: number
  completed: { shas: string[]; review: VerifyResult["review"]; demo: boolean } | null
  streakAfterToday: number
  repoUrl: string | null
  demo: boolean
  aiEnabled: boolean
  messages: ChatMessage[]
  prevDay: number | null
  nextDayUnlocked: boolean
}) {
  const router = useRouter()
  const [checklist, setChecklist] = useState<boolean[]>(() => day.checklist.map((_, i) => Boolean(initialChecklist[i])))
  const [hints, setHints] = useState(initialHints)
  const [mentorOpen, setMentorOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)
  const [result, setResult] = useState<VerifyResult | null>(
    completed ? { commits: completed.shas.map((sha) => ({ sha, message: "", url: repoUrl ? `${repoUrl}/commit/${sha}` : "" })), review: completed.review, demo: completed.demo } : null
  )
  const [justDone, setJustDone] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function persist(patch: { checklist?: boolean[]; hintsRevealed?: number }) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void fetch("/api/program/day", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day: day.day, ...patch }),
      }).catch(() => undefined)
    }, 400)
  }

  function toggle(i: number) {
    const next = checklist.map((v, j) => (j === i ? !v : v))
    setChecklist(next)
    persist({ checklist: next })
  }

  function revealHint() {
    const next = Math.min(day.hints.length, hints + 1)
    setHints(next)
    persist({ hintsRevealed: next })
  }

  async function verify() {
    setVerifying(true)
    setError(null)
    try {
      const r = await fetch("/api/program/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day: day.day }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError({ code: data?.error?.code ?? "failed", message: data?.error?.message ?? "Couldn't verify. Please try again." })
        return
      }
      setResult({ commits: data.commits ?? [], review: data.review ?? null, demo: Boolean(data.demo) })
      setJustDone(true)
      track("day_completed", { day: day.day })
      router.refresh()
    } catch {
      setError({ code: "offline", message: "You seem to be offline. Check your connection and try again." })
    } finally {
      setVerifying(false)
    }
  }

  const done = Boolean(result)

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-40 sm:px-6 md:pt-10 md:pb-16">
      <Link href="/program" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-accent-text hover:underline">
        <ArrowLeft className="size-4" aria-hidden />
        All days
      </Link>
      <p className="mt-2 text-sm text-muted-foreground">
        Day {day.day} of {totalDays} · ~{day.minutes} min
      </p>
      <h1 className="mt-1 text-h1 font-normal md:text-h1-lg">{day.title}</h1>
      <p className="mt-2 text-base md:text-lg">{day.goal}</p>

      <div className="mt-5 rounded-2xl bg-tonal p-4 text-tonal-foreground">
        <p className="text-sm font-medium">Why this matters in interviews</p>
        <p className="mt-1 text-sm">{day.why}</p>
      </div>

      <section className="mt-6" aria-labelledby="steps">
        <h2 id="steps" className="text-h3 font-medium">
          Steps
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {day.steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-caption font-medium">{i + 1}</span>
              <span className="pt-0.5 text-sm leading-relaxed md:text-base">
                <RichText text={s} />
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4" aria-labelledby="hints">
        <div className="flex items-center justify-between gap-3">
          <h2 id="hints" className="flex items-center gap-2 text-base font-medium">
            <Lightbulb className="size-5 text-warning" aria-hidden />
            Hints
          </h2>
          <span className="text-caption text-muted-foreground">
            {hints} of {day.hints.length} shown
          </span>
        </div>
        {hints > 0 ? (
          <ol className="mt-3 flex flex-col gap-2">
            {day.hints.slice(0, hints).map((h, i) => (
              <li key={i} className="animate-rise rounded-xl bg-surface p-3 text-sm">
                <RichText text={h} />
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Try first. If you&apos;re stuck for more than 10 minutes, reveal one hint at a time.</p>
        )}
        {hints < day.hints.length ? (
          <Button variant="ghost" size="sm" className="mt-2 -ml-3" onClick={revealHint}>
            Show {hints === 0 ? "a hint" : "the next hint"}
          </Button>
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card p-4" aria-labelledby="checklist">
        <h2 id="checklist" className="text-base font-medium">
          Done means
        </h2>
        <ul className="mt-2 flex flex-col">
          {day.checklist.map((c, i) => (
            <li key={i}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" checked={checklist[i]} onChange={() => toggle(i)} className="size-5 shrink-0 accent-[var(--primary)]" />
                <span className={cn(checklist[i] && "text-muted-foreground line-through")}>{c}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <details className="group mt-4 rounded-2xl border border-border bg-card">
        <summary className="flex min-h-12 list-none items-center justify-between px-4 text-base font-medium [&::-webkit-details-marker]:hidden">
          Defend it: questions today prepares you for
          <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="flex list-disc flex-col gap-1.5 px-4 pb-4 pl-9 text-sm text-muted-foreground">
          {day.defend.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </details>

      <button
        type="button"
        onClick={() => setMentorOpen(true)}
        className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-surface p-4 text-left hover:bg-muted"
      >
        <MessagesSquare className="size-5 shrink-0 text-accent-text" aria-hidden />
        <span>
          <span className="block font-medium">Stuck? Ask the mentor</span>
          <span className="block text-sm text-muted-foreground">Explains concepts and reviews your thinking, without giving away the answer.</span>
        </span>
      </button>

      <section className="mt-8" aria-labelledby="verify" aria-live="polite">
        <h2 id="verify" className="text-h3 font-medium">
          {done ? "Day complete" : "Finish up"}
        </h2>
        {done && result ? (
          <div className={cn("mt-3 rounded-2xl bg-success-bg p-5", justDone && "animate-rise")}>
            <p className="flex items-center gap-2 font-medium text-success">
              <span className={cn("flex size-8 items-center justify-center rounded-full bg-success text-background", justDone && "animate-pop")}>
                <Check className="size-5" aria-hidden />
              </span>
              Day {day.day} done
              {justDone && streakAfterToday > 0 ? (
                <span className="ml-auto inline-flex items-center gap-1 text-sm">
                  <Flame className="size-4" aria-hidden />
                  {streakAfterToday}-day streak
                </span>
              ) : null}
            </p>
            {result.demo ? (
              <p className="mt-2 text-sm text-foreground">Demo mode: marked done without checking GitHub.</p>
            ) : result.commits.length ? (
              <ul className="mt-3 flex flex-col gap-1 text-sm">
                {result.commits.map((c) => (
                  <li key={c.sha} className="flex gap-2">
                    <code className="font-mono text-caption">{c.sha.slice(0, 7)}</code>
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="truncate text-accent-text hover:underline">
                        {c.message || "View commit"}
                      </a>
                    ) : (
                      <span className="truncate">{c.message}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
            {result.review ? (
              <div className="mt-4 rounded-xl bg-card p-4 text-sm">
                <p className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="size-4 text-accent-text" aria-hidden />
                  AI review of your commits
                </p>
                <p className="mt-1 text-muted-foreground">{result.review.summary}</p>
                {result.review.suggestions.length ? (
                  <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
                    {result.review.suggestions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm">
            {demo ? (
              <p>Demo mode: GitHub isn&apos;t connected here, so verifying marks the day done without checking commits.</p>
            ) : (
              <>
                <p>Commit and push your work to your repo, then verify. We look for your own new commits since this day unlocked.</p>
                <pre className="mt-3 overflow-x-auto rounded-xl bg-surface p-3 font-mono text-caption">
                  git add .{"\n"}git commit -m &quot;{day.title.split(" ").slice(0, 6).join(" ")}&quot;{"\n"}git push
                </pre>
              </>
            )}
            {error ? (
              <p role="alert" className="mt-3 rounded-xl bg-danger-bg p-3 text-danger">
                {error.message}
                {error.code === "github_not_connected" || error.code === "token_expired" ? (
                  <>
                    {" "}
                    <a href={`/api/github/connect?next=${encodeURIComponent(`/program/day/${day.day}`)}`} className="font-medium underline">
                      Reconnect GitHub
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <nav className="mt-8 flex justify-between gap-2" aria-label="Days">
        {prevDay ? (
          <Link href={`/program/day/${prevDay}`} className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft aria-hidden />
            Day {prevDay}
          </Link>
        ) : (
          <span />
        )}
        {nextDayUnlocked && day.day < totalDays ? (
          <Link href={`/program/day/${day.day + 1}`} className={buttonVariants({ variant: "ghost" })}>
            Day {day.day + 1}
            <ArrowRight aria-hidden />
          </Link>
        ) : null}
      </nav>

      {!done ? (
        <div className="fixed inset-x-0 bottom-16 z-(--z-sticky) bg-background px-4 pt-3 pb-3 shadow-e3 md:static md:mt-6 md:bg-transparent md:p-0 md:shadow-none">
          <div className="mx-auto max-w-3xl">
            <Button size="lg" className="w-full md:w-auto" loading={verifying} onClick={() => void verify()}>
              {verifying ? "Checking your repo" : demo ? "Mark today done" : "Verify today's work"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <Link href="/program" className={cn(buttonVariants({ size: "lg" }), "w-full md:w-auto")}>
            Back to your progress
          </Link>
        </div>
      )}

      <ResponsiveSheet open={mentorOpen} onOpenChange={setMentorOpen} title={`Mentor · Day ${day.day}`} wide>
        <MentorChat day={day.day} initial={messages} aiEnabled={aiEnabled} />
      </ResponsiveSheet>
    </div>
  )
}
