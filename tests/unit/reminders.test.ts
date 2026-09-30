import { describe, expect, it } from "vitest"

import { reminderDue } from "@/lib/program/reminders"

const base = { timeZone: "Asia/Kolkata", reminderTime: "08:00", enabled: true, doneToday: false, alreadySentKey: null }

describe("reminderDue", () => {
  it("waits until the chosen local time", () => {
    // 02:00 UTC = 07:30 IST
    expect(reminderDue({ ...base, now: new Date("2026-10-01T02:00:00Z") }).due).toBe(false)
    // 02:40 UTC = 08:10 IST
    expect(reminderDue({ ...base, now: new Date("2026-10-01T02:40:00Z") })).toEqual({ due: true, dayKey: "2026-10-01" })
  })

  it("sends once per local day", () => {
    expect(reminderDue({ ...base, now: new Date("2026-10-01T05:00:00Z"), alreadySentKey: "2026-10-01" }).due).toBe(false)
  })

  it("skips when today is done or reminders are off", () => {
    const now = new Date("2026-10-01T05:00:00Z")
    expect(reminderDue({ ...base, now, doneToday: true }).due).toBe(false)
    expect(reminderDue({ ...base, now, enabled: false }).due).toBe(false)
  })
})
