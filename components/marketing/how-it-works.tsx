import { FileUp, Gauge, GitCommitHorizontal, type LucideIcon } from "lucide-react"

import { Section } from "./section"

const STEPS: {
  title: string
  body: string
  time: string
  Icon: LucideIcon
}[] = [
  {
    title: "Portfolio in minutes",
    body: "Upload your resume. We fill in everything and publish a clean portfolio site you can share on WhatsApp and LinkedIn.",
    time: "~2 min · Free",
    Icon: FileUp,
  },
  {
    title: "An honest diagnostic",
    body: "See your score on the 5 things product-company screeners check, how each was scored, and exactly what to fix.",
    time: "~1 min · Free preview",
    Icon: Gauge,
  },
  {
    title: "A real project in 14 days",
    body: "Build one standout project in your own GitHub with daily tasks, hints and a mentor. You write every commit, so you can defend it.",
    time: "~45 min a day",
    Icon: GitCommitHorizontal,
  },
]

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      title="How it works"
      lead="Three steps. Start free, pay only if you want to go further."
    >
      <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
        {STEPS.map(({ title, body, time, Icon }, index) => (
          <li
            key={title}
            className="relative flex gap-4 rounded-xl border border-border bg-card p-5 md:flex-col md:p-6"
          >
            <div className="flex shrink-0 flex-col items-center md:flex-row md:justify-between">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span
                className="tabular hidden font-mono text-sm text-muted-foreground md:block"
                aria-hidden
              >
                0{index + 1}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-h3 font-semibold">
                <span className="sr-only">Step {index + 1}: </span>
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{body}</p>
              <p className="mt-3 inline-flex rounded-full bg-muted px-2.5 py-1 font-mono text-caption text-foreground">
                {time}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
