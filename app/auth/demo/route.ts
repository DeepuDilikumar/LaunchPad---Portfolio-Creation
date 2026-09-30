import { randomUUID } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import {
  DEMO_COOKIE,
  DEMO_PREVIOUS_COOKIE,
  SESSION_HINT_COOKIE,
  SESSION_HINT_OPTIONS,
} from "@/lib/auth/session"
import { safeNextPath } from "@/lib/auth/redirect"
import { isDemoMode } from "@/lib/env"

/** Demo-mode sign-in: creates (or reuses) a local demo account. Disabled outside demo mode. */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const next = safeNextPath((form?.get("next") as string | null) ?? null)
  if (!isDemoMode()) {
    return NextResponse.redirect(new URL("/login?error=not_configured", request.nextUrl.origin), 303)
  }
  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin), 303)
  const existing =
    request.cookies.get(DEMO_COOKIE)?.value || request.cookies.get(DEMO_PREVIOUS_COOKIE)?.value
  response.cookies.set(DEMO_COOKIE, existing ?? randomUUID(), {
    ...SESSION_HINT_OPTIONS,
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 90,
  })
  response.cookies.set(SESSION_HINT_COOKIE, "1", SESSION_HINT_OPTIONS)
  return response
}
