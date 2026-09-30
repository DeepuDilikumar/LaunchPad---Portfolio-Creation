/**
 * Day unlocking and streaks, in the student's own timezone.
 * - Day 1 unlocks when the program starts; Day N unlocks at local midnight N−1 days later.
 * - Missed days stay open for catch-up.
 * - The streak counts consecutive local calendar days with a completed day, ending today
 *   (or yesterday, if today isn't done yet). It never counts days that weren't done.
 */

export const TOTAL_DAYS = 14

/** YYYY-MM-DD for a moment, in a timezone. */
export function localDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00"
  return `${get("year")}-${get("month")}-${get("day")}`
}

function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

/** Offset (ms) of a timezone from UTC at a given instant. */
function tzOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
  return asUtc - date.getTime()
}

/** The instant of local midnight for a YYYY-MM-DD key in a timezone. */
export function localMidnight(key: string, timeZone: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  const guess = new Date(Date.UTC(y, m - 1, d))
  return new Date(guess.getTime() - tzOffsetMs(guess, timeZone))
}

/** When a day unlocks. Day 1 = the start instant itself. */
export function unlockTime(day: number, startedAt: Date, timeZone: string): Date {
  if (day <= 1) return startedAt
  return localMidnight(addDays(localDateKey(startedAt, timeZone), day - 1), timeZone)
}

export function isUnlocked(day: number, startedAt: Date, timeZone: string, now = new Date()): boolean {
  return unlockTime(day, startedAt, timeZone).getTime() <= now.getTime()
}

/** The latest unlocked day number (1–14). */
export function currentDay(startedAt: Date, timeZone: string, now = new Date()): number {
  let day = 1
  for (let d = 2; d <= TOTAL_DAYS; d++) if (isUnlocked(d, startedAt, timeZone, now)) day = d
  return day
}

export function computeStreak(completedAt: Date[], timeZone: string, now = new Date()): number {
  const days = new Set(completedAt.map((d) => localDateKey(d, timeZone)))
  const today = localDateKey(now, timeZone)
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}
