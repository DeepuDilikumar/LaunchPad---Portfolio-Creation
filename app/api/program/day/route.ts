import { NextResponse } from "next/server"
import { z } from "zod"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { isUnlocked } from "@/lib/program/schedule"
import { getActiveProgram, saveDayProgress } from "@/lib/program/service"

const Body = z.object({
  day: z.number().int().min(1).max(14),
  checklist: z.array(z.boolean()).max(10).optional(),
  hintsRevealed: z.number().int().min(0).max(10).optional(),
})

/** Auto-saves a day's checklist ticks and revealed hints. */
export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Couldn't save that.")
  const program = await getActiveProgram(user.id)
  if (!program) return jsonError(404, "no_program", "Start the program first.")
  if (!isUnlocked(parsed.data.day, new Date(program.started_at), program.timezone)) {
    return jsonError(403, "locked", "This day hasn't unlocked yet.")
  }
  await saveDayProgress(program, parsed.data.day, {
    ...(parsed.data.checklist ? { checklist: parsed.data.checklist } : {}),
    ...(parsed.data.hintsRevealed !== undefined ? { hints_revealed: parsed.data.hintsRevealed } : {}),
  })
  return NextResponse.json({ ok: true })
}
