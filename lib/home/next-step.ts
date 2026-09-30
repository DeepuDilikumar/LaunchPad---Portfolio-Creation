/** The single most useful next thing for a student, given where they are. Pure, so it's easy to test. */

export type JourneyState = {
  portfolioLive: boolean
  hasReport: boolean
  overall: number | null
  reportUnlocked: boolean
  programOwned: boolean
  programStarted: boolean
  daysDone: number
  currentDay: number
  todayDone: boolean
  totalDays: number
}

export type NextStep = { title: string; body: string; cta: string; href: string; time?: string }

export function nextStep(s: JourneyState): NextStep {
  if (!s.portfolioLive) {
    return {
      title: "Put your portfolio live",
      body: "We'll fill it in from your resume. You just check and publish.",
      cta: "Build my portfolio",
      href: "/start",
      time: "Takes 2 min",
    }
  }
  if (!s.hasReport) {
    return {
      title: "Find out why screens aren't clearing",
      body: "An honest check of your profile against what SDE-1 roles ask for, with every score explained.",
      cta: "Check my profile",
      href: "/report",
      time: "About 30 sec",
    }
  }
  if (!s.reportUnlocked && !s.programOwned) {
    return {
      title: "See all five pillars",
      body: `Your score is ${s.overall ?? "ready"}. Unlock every pillar, the exact fixes, and an ATS-friendly resume rewrite.`,
      cta: "View my report",
      href: "/report",
    }
  }
  if (!s.programOwned) {
    return {
      title: "Build one project that stands out",
      body: "14 days, about an hour a day, with real commits you can defend in any interview.",
      cta: "See the program",
      href: "/program",
    }
  }
  if (!s.programStarted) {
    return {
      title: "Pick your project",
      body: "We've ranked the projects for your profile. Pick one and Day 1 starts right away.",
      cta: "Choose a project",
      href: "/program",
      time: "Takes 1 min",
    }
  }
  if (s.daysDone >= s.totalDays) {
    return {
      title: "Tell people what you built",
      body: "A LinkedIn post, resume bullets and cold messages, written from your real work.",
      cta: "Announce it",
      href: "/program/announce",
    }
  }
  if (s.todayDone) {
    return {
      title: "Today's done. Nice work.",
      body: "Practise explaining what you built while it's fresh. The next day unlocks at midnight.",
      cta: "Practise interview questions",
      href: "/program/defend",
      time: "~10 min",
    }
  }
  return {
    title: `Day ${s.currentDay} is ready`,
    body: "Pick up where you left off. Small steps, one real commit.",
    cta: "Start today's task",
    href: `/program/day/${s.currentDay}`,
    time: "~45 min",
  }
}
