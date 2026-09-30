import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import type { ProgramRow } from "@/lib/data/records"
import { getProfile } from "@/lib/data/profiles"
import { sendEmail } from "@/lib/email"
import { isEmailConfigured, siteUrl } from "@/lib/env"
import { reminderDue } from "@/lib/program/reminders"
import { localDateKey, TOTAL_DAYS } from "@/lib/program/schedule"
import { getProgramSummary } from "@/lib/program/service"

/**
 * Hourly (vercel.json). Vercel Cron sends `Authorization: Bearer $CRON_SECRET`.
 * Emails only people who chose reminders, whose task for today isn't done, once per local day.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }
  if (!isEmailConfigured()) return NextResponse.json({ sent: 0, skipped: "email not configured" })

  const now = new Date()
  const programs = await db().select<ProgramRow>("programs", { status: "active" })
  let sent = 0
  for (const program of programs) {
    if (program.demo) continue
    const [profile, summary] = await Promise.all([getProfile(program.user_id), getProgramSummary(program.user_id)])
    if (!profile?.email || !summary || summary.program.id !== program.id || summary.daysDone >= TOTAL_DAYS) continue

    const today = localDateKey(now, program.timezone)
    const doneToday = summary.days.some((d) => d.completed_at && localDateKey(new Date(d.completed_at), program.timezone) === today)
    const last = await db().selectOne<{ day_key: string }>("reminder_sends", { user_id: program.user_id, day_key: today })
    const { due, dayKey } = reminderDue({
      now,
      timeZone: program.timezone,
      reminderTime: profile.reminder_time,
      enabled: profile.reminder_email,
      doneToday,
      alreadySentKey: last?.day_key ?? null,
    })
    if (!due) continue

    const day = summary.project.days[summary.currentDay - 1]
    const first = (profile.data.fullName || "there").split(" ")[0]
    const ok = await sendEmail(
      profile.email,
      `Day ${summary.currentDay}: ${day.title} (~${day.minutes} min)`,
      [
        `Hi ${first},`,
        "",
        `Today's task for ${summary.project.title}: ${day.goal}`,
        summary.streak > 0 ? `Your streak is ${summary.streak} day${summary.streak === 1 ? "" : "s"}. Keep it going.` : "A small commit today starts your streak.",
        "",
        `Open today's task: ${siteUrl()}/program/day/${summary.currentDay}`,
        "",
        `Change or turn off reminders: ${siteUrl()}/settings`,
      ].join("\n")
    )
    if (ok) {
      await db().upsert("reminder_sends", { user_id: program.user_id, day_key: dayKey }, ["user_id", "day_key"])
      sent++
    }
  }
  return NextResponse.json({ sent })
}
