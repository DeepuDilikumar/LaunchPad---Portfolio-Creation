import { describe, expect, it } from "vitest"

import { PROJECTS } from "@/content/projects"
import { rankProjects } from "@/lib/program/recommend"
import { computeStreak, currentDay, isUnlocked, localDateKey, unlockTime } from "@/lib/program/schedule"
import { emptyProfile } from "@/lib/profile/types"

const TZ = "Asia/Kolkata"

describe("program schedule (IST)", () => {
  // 30 Sep 2026, 21:00 IST = 15:30 UTC
  const start = new Date("2026-09-30T15:30:00Z")

  it("unlocks day 1 immediately and day 2 at the next local midnight", () => {
    expect(unlockTime(1, start, TZ).toISOString()).toBe(start.toISOString())
    // 1 Oct 00:00 IST = 30 Sep 18:30 UTC
    expect(unlockTime(2, start, TZ).toISOString()).toBe("2026-09-30T18:30:00.000Z")
    expect(isUnlocked(2, start, TZ, new Date("2026-09-30T18:29:00Z"))).toBe(false)
    expect(isUnlocked(2, start, TZ, new Date("2026-09-30T18:31:00Z"))).toBe(true)
  })

  it("tracks the current day and caps at 14", () => {
    expect(currentDay(start, TZ, new Date("2026-10-03T06:00:00Z"))).toBe(4)
    expect(currentDay(start, TZ, new Date("2026-12-01T06:00:00Z"))).toBe(14)
  })

  it("counts streaks honestly in local days", () => {
    const now = new Date("2026-10-04T10:00:00Z") // 4 Oct IST
    const done = [new Date("2026-10-02T05:00:00Z"), new Date("2026-10-03T05:00:00Z"), new Date("2026-10-04T05:00:00Z")]
    expect(computeStreak(done, TZ, now)).toBe(3)
    // Today not done yet: the streak through yesterday still counts.
    expect(computeStreak(done.slice(0, 2), TZ, now)).toBe(2)
    // A missed day breaks it.
    expect(computeStreak([done[0], done[2]], TZ, now)).toBe(1)
    expect(localDateKey(new Date("2026-10-03T19:00:00Z"), TZ)).toBe("2026-10-04")
  })
})

describe("project catalog", () => {
  it("has 5 complete projects with 14 days and 15 defense questions each", () => {
    expect(PROJECTS).toHaveLength(5)
    for (const p of PROJECTS) {
      expect(p.days.map((d) => d.day)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1))
      expect(p.defense).toHaveLength(15)
      for (const d of p.days) {
        expect(d.steps.length).toBeGreaterThan(0)
        expect(d.checklist.length).toBeGreaterThan(0)
        expect(d.hints.length).toBeGreaterThan(0)
      }
    }
  })

  it("recommends a role-fitting project first", () => {
    const backend = rankProjects({ ...emptyProfile(), targetRole: "backend", skills: { languages: ["Java"], frameworks: ["Spring Boot"], databases: ["PostgreSQL"], tools: [] } }, null)
    expect(backend[0].recommended).toBe(true)
    expect(backend[0].project.roles).toContain("backend")
    const data = rankProjects({ ...emptyProfile(), targetRole: "data", skills: { languages: ["Python"], frameworks: ["Pandas"], databases: [], tools: [] } }, null)
    expect(data[0].project.key).toBe("rag-notes")
  })
})
