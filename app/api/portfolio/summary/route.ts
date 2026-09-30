import { NextResponse } from "next/server"
import { z } from "zod"

import { isSameOrigin, jsonError } from "@/lib/auth/api"
import { getCurrentUser } from "@/lib/auth/session"
import { fallbackSummary } from "@/lib/portfolio/build"
import { writeSummary } from "@/lib/portfolio/summary"
import { emptyProfile, type Profile } from "@/lib/profile/types"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const Body = z.object({ profile: z.record(z.string(), z.unknown()) })

/** Writes the portfolio's one-line intro (AI when available, otherwise rule-based). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Missing profile.")
  const profile: Profile = { ...emptyProfile(), ...(parsed.data.profile as Partial<Profile>) }

  const user = await getCurrentUser()
  if (!rateLimit(`summary:${clientKey(request, user?.id)}`, 8, 10 * 60_000).ok) {
    return NextResponse.json({ summary: fallbackSummary(profile), source: "rules" })
  }
  return NextResponse.json(await writeSummary(profile))
}
