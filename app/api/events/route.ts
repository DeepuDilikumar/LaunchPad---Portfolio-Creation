import { NextResponse } from "next/server"
import { z } from "zod"

import { logEvent } from "@/lib/analytics/server"
import { getCurrentUser } from "@/lib/auth/session"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const Event = z.object({
  name: z.enum(["upload", "portfolio_created", "teaser_viewed", "checkout_started", "paid", "day_completed"]),
  // Only primitive values with short keys: no free text that could carry personal data.
  props: z.record(z.string().max(40), z.union([z.string().max(60), z.number(), z.boolean()])).default({}),
  anonId: z.string().max(64).optional(),
})

export async function POST(request: Request) {
  const parsed = Event.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new NextResponse(null, { status: 204 })
  const user = await getCurrentUser()
  if (!rateLimit(`events:${clientKey(request, user?.id)}`, 60, 60_000).ok) return new NextResponse(null, { status: 204 })
  // "paid" is recorded by the server when payment is verified; ignore client copies.
  if (parsed.data.name !== "paid") {
    await logEvent(parsed.data.name, user?.id ?? null, parsed.data.props, parsed.data.anonId ?? null)
  }
  return new NextResponse(null, { status: 204 })
}
