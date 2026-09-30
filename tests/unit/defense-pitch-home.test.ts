import { describe, expect, it } from "vitest"

import { PROJECTS } from "@/content/projects"
import { rateAnswer, ruleCoverage } from "@/lib/defense/score"
import { nextStep, type JourneyState } from "@/lib/home/next-step"
import { buildFacts } from "@/lib/pitch/facts"
import { inventsNumbers } from "@/lib/pitch/guard"
import { rulePitch } from "@/lib/pitch/templates"
import { emptyProfile } from "@/lib/profile/types"

describe("defense feedback", () => {
  it("counts a key point as covered when its main words appear", () => {
    const covered = ruleCoverage("I used an idempotency key stored in Redis so retries don't charge twice", [
      "Idempotency key stored per request",
      "Explains sharding across regions",
    ])
    expect(covered).toEqual([true, false])
  })

  it("rates from coverage, deterministically", () => {
    expect(rateAnswer([true, true, true, true])).toBe("strong")
    expect(rateAnswer([true, false, true, false])).toBe("good_start")
    expect(rateAnswer([false, false, false, true])).toBe("needs_work")
  })
})

describe("pitch engine", () => {
  const project = PROJECTS[0]
  const facts = buildFacts({
    profile: { ...emptyProfile(), fullName: "Asha Rao", targetRole: "backend", college: "PES University" },
    project,
    completedDayNumbers: [2, 1, 3],
    commits: 7,
    repoUrl: "https://github.com/asha/webhook-engine",
  })

  it("only mentions completed days", () => {
    expect(facts.completedDays.map((d) => d.day)).toEqual([1, 2, 3])
    const post = rulePitch("linkedin", facts, "humble")
    expect(post).toContain(project.days[2].goal.replace(/\.$/, ""))
    expect(post).not.toContain(project.days[9].goal.replace(/\.$/, ""))
  })

  it("uses placeholders instead of invented metrics", () => {
    const bullets = rulePitch("bullets", facts, "humble")
    expect(bullets).toMatch(/\[[^\]]+\]/)
    expect(inventsNumbers(bullets, JSON.stringify(facts))).toBe(false)
  })

  it("flags numbers that aren't in the facts", () => {
    expect(inventsNumbers("Cut latency by 40% for 10k users", JSON.stringify(facts))).toBe(true)
    expect(inventsNumbers("Cut latency by [X%]", JSON.stringify(facts))).toBe(false)
    expect(inventsNumbers("7 commits so far", JSON.stringify(facts))).toBe(false)
  })
})

describe("home next step", () => {
  const base: JourneyState = {
    portfolioLive: true,
    hasReport: true,
    overall: 62,
    reportUnlocked: true,
    programOwned: true,
    programStarted: true,
    daysDone: 3,
    currentDay: 4,
    todayDone: false,
    totalDays: 14,
  }
  it("walks the journey in order", () => {
    expect(nextStep({ ...base, portfolioLive: false }).href).toBe("/start")
    expect(nextStep({ ...base, hasReport: false }).href).toBe("/report")
    expect(nextStep({ ...base, programOwned: false, reportUnlocked: true }).href).toBe("/program")
    expect(nextStep({ ...base, programStarted: false }).cta).toBe("Choose a project")
    expect(nextStep(base).href).toBe("/program/day/4")
    expect(nextStep({ ...base, todayDone: true }).href).toBe("/program/defend")
    expect(nextStep({ ...base, daysDone: 14 }).href).toBe("/program/announce")
  })
})
