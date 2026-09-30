import { FileUp, Gauge, GitCommitHorizontal, type LucideIcon } from "lucide-react"

import { Section } from "./section"

const STEPS: { title: string; body: string; time: string; Icon: LucideIcon }[] = [
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
      eyebrow="How it works"
      title="From resume to a project you can defend"
      lead="Three steps. Start free, and pay only if you want to go further."
    >
      <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
        {STEPS.map(({ title, body, time, Icon }, index) => (
          <li key={title} className="flex gap-4 rounded-2xl bg-surface p-5 md:flex-col md:p-7">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-tonal text-tonal-foreground">
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-caption font-medium text-muted-foreground">Step {index + 1}</p>
              <h3 className="mt-0.5 text-h3 font-medium">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{body}</p>
              <p className="mt-4 inline-flex rounded-full border border-border bg-card px-3 py-1 text-caption text-foreground">
                {time}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
