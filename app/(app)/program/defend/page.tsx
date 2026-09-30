import { ArrowLeft, MessageSquareQuote } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { DefensePractice } from "@/components/defense/defense-practice"
import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { getEntitlements } from "@/lib/data/entitlements"
import { availableQuestions, getDefenseSession } from "@/lib/defense/service"
import { isLLMConfigured } from "@/lib/env"
import { getProgramSummary } from "@/lib/program/service"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Defend your project", robots: { index: false } }

export default async function DefendPage() {
  const user = await requireUser("/program/defend")
  const [ent, summary] = await Promise.all([getEntitlements(user.id), getProgramSummary(user.id)])
  if (!ent.program || !summary) redirect("/program")

  const questions = availableQuestions(summary)
  const session = await getDefenseSession(summary.program.id)

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 md:pt-10">
      <Link href="/program" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Program
      </Link>
      <h1 className="mt-1 text-h1 font-normal">Defend your project</h1>
      <p className="mt-1 text-muted-foreground">
        Interviewers will ask why you built {summary.project.title} the way you did. Practise here, in your own words.
      </p>

      <div className="mt-6">
        {questions.length === 0 ? (
          <StatePanel
            icon={MessageSquareQuote}
            headingLevel="h2"
            title="Finish Day 1 to unlock your first questions"
            action={
              <Link href={`/program/day/${summary.currentDay}`} className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                Go to today&apos;s task
              </Link>
            }
          >
            <p>Questions only cover work you&apos;ve actually done, so you can answer every one honestly.</p>
          </StatePanel>
        ) : (
          <DefensePractice
            questions={questions.map((q) => ({
              id: q.id,
              day: q.day,
              dayTitle: summary.project.days[q.day - 1].title,
              question: q.question,
              keyPoints: q.keyPoints,
            }))}
            saved={session?.answers ?? {}}
            aiEnabled={isLLMConfigured()}
          />
        )}
      </div>
    </div>
  )
}
