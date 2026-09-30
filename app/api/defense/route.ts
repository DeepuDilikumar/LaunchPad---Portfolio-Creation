import { NextResponse } from "next/server"
import { z } from "zod"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { getEntitlements } from "@/lib/data/entitlements"
import { availableQuestions, judgeAnswer, saveAnswer } from "@/lib/defense/service"
import { getProgramSummary } from "@/lib/program/service"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const Body = z.object({ questionId: z.string().min(1).max(80), answer: z.string().trim().min(1).max(6000) })

/** Feedback on one practice answer. Only questions about completed days are accepted. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Write or say an answer first.")
  if (parsed.data.answer.split(/\s+/).length < 8) {
    return jsonError(400, "too_short", "Give it a few sentences. Interviewers want the why, not just the what.")
  }
  const ent = await getEntitlements(user.id)
  if (!ent.program) return jsonError(403, "locked", "Interview practice is part of the 14-Day Build Program.")
  const summary = await getProgramSummary(user.id)
  if (!summary) return jsonError(404, "no_program", "Start the program first.")
  const q = availableQuestions(summary).find((x) => x.id === parsed.data.questionId)
  if (!q) return jsonError(404, "unknown_question", "That question unlocks when you finish its day.")
  if (!rateLimit(`defense:${clientKey(request, user.id)}`, 40, 60 * 60_000).ok) {
    return jsonError(429, "rate_limited", "That's a lot of practice this hour. Take a short break, then continue.")
  }
  const result = await judgeAnswer(summary, q, parsed.data.answer)
  await saveAnswer(summary, q.id, result)
  return NextResponse.json({ result })
}
