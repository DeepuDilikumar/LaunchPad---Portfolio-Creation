"use client"

import { CalendarCheck, Check, GitCommitHorizontal, MessagesSquare, Rocket } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { CheckoutSheet } from "@/components/checkout/checkout-sheet"
import { Button } from "@/components/ui/button"
import { formatPrice, getPlan, type ProductKey } from "@/config/pricing"

const HOW = [
  { Icon: Rocket, title: "Pick a project matched to you", body: "5 real-world projects, ranked for your target role and the gaps in your report." },
  { Icon: CalendarCheck, title: "One focused task a day", body: "About 45 minutes each, with steps, hints and a checklist. Missed a day? Catch up anytime." },
  { Icon: GitCommitHorizontal, title: "Real commits, verified", body: "You write and push the code. We check your repo for your own new commits. No shortcuts, no fake history." },
  { Icon: MessagesSquare, title: "A mentor when you're stuck", body: "Explains concepts and reviews your work, without handing you the answer." },
]

export function ProgramIntro({
  purchasable,
  demo,
  sampleDay,
  projectTitles,
}: {
  purchasable: ProductKey[]
  demo: boolean
  sampleDay: { title: string; goal: string; minutes: number; steps: string[] }
  projectTitles: string[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const options = purchasable.filter((p) => p === "program" || p === "bundle")
  const price = formatPrice(getPlan("program").amountPaise)

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 md:pt-10">
      <p className="text-sm font-medium text-accent-text">14-Day Build Program</p>
      <h1 className="mt-1 text-h1 font-normal md:text-h1-lg">Build one project that stands out, in 14 days</h1>
      <p className="mt-3 text-muted-foreground md:text-lg">
        A real, production-style project in your own GitHub, with a genuine daily commit history and the understanding to defend every decision
        in an interview.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {HOW.map(({ Icon, title, body }) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-surface p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tonal text-tonal-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-medium">{title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
            </span>
          </li>
        ))}
      </ul>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5" aria-labelledby="sample-day">
        <p className="text-caption text-muted-foreground">What a day looks like · sample</p>
        <h2 id="sample-day" className="mt-1 text-h3 font-medium">
          {sampleDay.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {sampleDay.goal} · ~{sampleDay.minutes} min
        </p>
        <ol className="mt-3 flex list-decimal flex-col gap-1 pl-5 text-sm">
          {sampleDay.steps.slice(0, 3).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <p className="mt-6 text-sm text-muted-foreground">Projects include: {projectTitles.join(" · ")}</p>

      <section className="mt-8 rounded-2xl bg-tonal p-5 text-tonal-foreground md:p-6" aria-labelledby="join">
        <h2 id="join" className="text-h2 font-normal">
          Join for {price}, one time
        </h2>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {getPlan("program").features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        <Button size="lg" className="mt-5 w-full sm:w-auto" onClick={() => setOpen(true)} disabled={options.length === 0}>
          Join the program · {price}
        </Button>
      </section>

      <CheckoutSheet
        open={open}
        onOpenChange={setOpen}
        options={options}
        defaultProduct={options.includes("program") ? "program" : "bundle"}
        demo={demo}
        onPaid={() => {
          setOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
