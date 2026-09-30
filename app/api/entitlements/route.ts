import { NextResponse } from "next/server"

import { isResponse, userOrUnauthorized } from "@/lib/auth/api"
import { getEntitlements } from "@/lib/data/entitlements"

/** Polled briefly after checkout, so an unlock works whether the webhook or the redirect lands first. */
export async function GET() {
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  return NextResponse.json(await getEntitlements(user.id), { headers: { "cache-control": "no-store" } })
}
