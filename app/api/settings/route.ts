import { NextResponse } from "next/server"
import { z } from "zod"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { db } from "@/lib/db"
import { updateSettings } from "@/lib/data/profiles"
import { getActiveProgram } from "@/lib/program/service"

function validTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

const Body = z.object({
  timezone: z.string().max(64).refine(validTimeZone).optional(),
  reminder_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  reminder_email: z.boolean().optional(),
})

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "That setting didn't look right. Please check it.")
  await updateSettings(user.id, parsed.data)
  if (parsed.data.timezone) {
    // Keep the program's days and reminders in step with where the student is now.
    const program = await getActiveProgram(user.id)
    if (program) await db().update("programs", { id: program.id }, { timezone: parsed.data.timezone })
  }
  return NextResponse.json({ ok: true })
}
