import { ArrowRight } from "lucide-react"

import type { SampleProfile } from "@/content/samples"
import { PhoneFrame, PortfolioPreview } from "./portfolio-preview"

/** Priya, from the core user journey. */
const PRIYA: SampleProfile = {
  slug: "priya-nair",
  name: "Priya Nair",
  initials: "PN",
  role: "Backend Engineer",
  college: "B.Tech CSE · 2026",
  gradYear: 2026,
  summary: "Final-year CSE student who likes making APIs fast and boring.",
  skills: ["Java", "Spring Boot", "MySQL", "Redis"],
  template: "minimal",
  project: {
    title: "Webhook Delivery Engine",
    stack: ["Spring Boot", "Redis", "MySQL"],
    builtInDays: { day: 4, of: 14 },
  },
}

/** The "before": a plain, cluttered resume sketch in greys only. */
function ResumeSketch() {
  const bar = "h-[3px] rounded-full bg-muted-foreground/25"
  return (
    <div className="w-full -rotate-2 rounded-md border border-border bg-card p-2.5 shadow-sm">
      <p className="text-[9px] leading-none font-medium tracking-wide text-muted-foreground uppercase">
        Priya Nair — Resume
      </p>
      <p className="mt-1 text-[6.5px] leading-tight text-muted-foreground/80">
        Objective: To obtain a challenging position in a reputed organisation…
      </p>
      <div className="mt-2 grid grid-cols-[2fr_3fr] gap-1.5">
        <div className="space-y-1">
          <div className={`${bar} w-4/5`} />
          <div className={`${bar} w-3/5`} />
          <div className={`${bar} w-full`} />
          <div className={`${bar} w-2/3`} />
        </div>
        <div className="space-y-1">
          <div className={`${bar} w-full`} />
          <div className={`${bar} w-5/6`} />
          <div className={`${bar} w-full`} />
          <div className={`${bar} w-1/2`} />
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-px overflow-hidden rounded-sm border border-border bg-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-2.5 bg-card" />
        ))}
      </div>
      <div className="mt-2 space-y-1">
        <div className={`${bar} w-full`} />
        <div className={`${bar} w-11/12`} />
        <div className={`${bar} w-4/6`} />
        <div className={`${bar} w-5/6`} />
        <div className={`${bar} w-3/5`} />
      </div>
      <p className="mt-2 text-[6.5px] leading-tight text-muted-foreground/80">
        Projects: Weather App, To-Do App, Library Management System
      </p>
    </div>
  )
}

export function BeforeAfter() {
  return (
    <figure
      role="img"
      aria-label="A plain resume for Priya Nair turned into a live portfolio website showing her role, skills and a project she's building."
      className="mx-auto w-full max-w-md"
    >
      <div aria-hidden className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        <div className="flex flex-col items-center gap-2">
          <ResumeSketch />
          <p className="text-caption text-muted-foreground">Your resume</p>
        </div>

        <span className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
          <ArrowRight className="size-4" />
        </span>

        <div className="flex flex-col items-center gap-2">
          <PhoneFrame url="launchpad.app/p/priya-nair" className="w-full">
            <PortfolioPreview profile={PRIYA} template="minimal" animate />
          </PhoneFrame>
          <p className="text-caption font-medium text-foreground">Live portfolio</p>
        </div>
      </div>
    </figure>
  )
}
