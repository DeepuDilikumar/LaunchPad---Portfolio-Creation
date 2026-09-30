import { describe, expect, it } from "vitest"

import { buildReport, statusFor } from "@/lib/diagnostic/score"
import type { DiagnosticInput } from "@/lib/diagnostic/types"
import { RUBRIC } from "@/lib/prompts/diagnostic"
import { emptyProfile, type Profile } from "@/lib/profile/types"
import { extractResumeProfile } from "@/lib/resume/parse-profile"

const RESUME = `Priya Nair
priya@example.com | +91 98470 12345
EDUCATION
Model Engineering College, B.Tech CSE, 2022 - 2026
SKILLS
Java, Spring Boot, React, MySQL, Git
PROJECTS
Weather App | React
- Shows a 5-day forecast.
To-Do Manager | Node.js, Express, MongoDB
- REST API with JWT auth.
EXPERIENCE
Web Intern at Acme | Jun 2024 - Aug 2024
- Built admin screens.`

function input(profile: Profile, overrides: Partial<DiagnosticInput> = {}): DiagnosticInput {
  return {
    profile,
    profileJson: JSON.stringify(profile),
    resumeText: RESUME,
    layout: "single-column",
    hasTables: false,
    github: null,
    ...overrides,
  }
}

describe("diagnostic scoring", () => {
  const parsed = extractResumeProfile(RESUME).profile

  it("is deterministic: same input, same score", () => {
    const a = buildReport(input(parsed), null)
    const b = buildReport(input(parsed), null)
    expect(a.overall).toBe(b.overall)
    expect(a.pillars.map((p) => p.score)).toEqual(b.pillars.map((p) => p.score))
  })

  it("flags tutorial clones in project uniqueness as critical", () => {
    const report = buildReport(input(parsed), null)
    const uniqueness = report.pillars.find((p) => p.key === "uniqueness")!
    expect(uniqueness.status).toBe("critical")
    expect(uniqueness.checks.find((c) => c.id === "u1")?.met).toBe(false)
    expect(uniqueness.notices[0]).toMatch(/Weather App/)
  })

  it("computes pillar scores from check weights only", () => {
    const report = buildReport(input(parsed), null)
    for (const pillar of report.pillars) {
      if (pillar.score === null) continue
      const total = pillar.checks.reduce((s, c) => s + c.weight, 0)
      const earned = pillar.checks.filter((c) => c.met).reduce((s, c) => s + c.weight, 0)
      expect(pillar.score).toBe(Math.round((earned / total) * 100))
    }
  })

  it("marks GitHub as not assessed and leaves it out of the overall score", () => {
    const report = buildReport(input(parsed), null)
    const github = report.pillars.find((p) => p.key === "github")!
    expect(github.status).toBe("not_assessed")
    const assessed = report.pillars.filter((p) => p.score !== null)
    expect(report.overall).toBe(Math.round(assessed.reduce((s, p) => s + (p.score ?? 0), 0) / assessed.length))
  })

  it("penalises two-column layouts in ATS readability", () => {
    const single = buildReport(input(parsed), null).pillars.find((p) => p.key === "ats")!.score!
    const double = buildReport(input(parsed, { layout: "two-column" }), null).pillars.find((p) => p.key === "ats")!.score!
    expect(double).toBeLessThan(single)
  })

  it("uses AI verdicts only for AI-judged checks", () => {
    const ai = { u1: { met: true, evidence: "AI says fine" }, t1: { met: false, evidence: "AI tries a rules check" } }
    const report = buildReport(input(parsed), ai)
    expect(report.pillars.find((p) => p.key === "uniqueness")!.checks.find((c) => c.id === "u1")!.met).toBe(true)
    expect(report.pillars.find((p) => p.key === "ats")!.checks.find((c) => c.id === "t1")!.met).toBe(true)
  })

  it("maps scores to statuses against the rubric target", () => {
    expect(statusFor(90)).toBe("passing")
    expect(statusFor(70)).toBe("needs_work")
    expect(statusFor(40)).toBe("critical")
  })

  it("has weights that make each pillar total 100", () => {
    for (const pillar of RUBRIC) expect(pillar.checks.reduce((s, c) => s + c.weight, 0)).toBe(100)
  })

  it("handles an empty profile without crashing", () => {
    const report = buildReport(input(emptyProfile(), { resumeText: "" }), null)
    expect(report.overall).toBeGreaterThanOrEqual(0)
  })
})
