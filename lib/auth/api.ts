import "server-only"

import { NextResponse } from "next/server"

import { getCurrentUser, type AppUser } from "./session"

/** JSON error with a plain-language message the UI can show as-is. */
export function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...extra } }, { status })
}

/** For route handlers: the user, or a 401 response to return. */
export async function userOrUnauthorized(): Promise<AppUser | NextResponse> {
  const user = await getCurrentUser()
  if (!user) return jsonError(401, "signed_out", "Please sign in again to continue.")
  return user
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse
}

/** Same-origin check for state-changing requests (defence against CSRF on cookie-auth routes). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true // non-browser clients and same-origin navigations may omit it
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}
