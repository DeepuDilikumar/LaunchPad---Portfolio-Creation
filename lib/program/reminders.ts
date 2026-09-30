import { localDateKey } from "./schedule"

/** Local "HH:MM" for an instant in a timezone. */
export function localTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date)
}

/**
 * Whether a reminder is due right now. The cron runs hourly, so a reminder goes out in
 * the first run at or after the chosen time, once per local day, and only if today's
 * task isn't done yet.
 */
export function reminderDue(opts: {
  now: Date
  timeZone: string
  reminderTime: string | null
  enabled: boolean
  doneToday: boolean
  alreadySentKey: string | null
}): { due: boolean; dayKey: string } {
  const dayKey = localDateKey(opts.now, opts.timeZone)
  if (!opts.enabled || !opts.reminderTime || opts.doneToday || opts.alreadySentKey === dayKey) return { due: false, dayKey }
  return { due: localTime(opts.now, opts.timeZone) >= opts.reminderTime, dayKey }
}
