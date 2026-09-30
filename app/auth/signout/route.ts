import { NextResponse, type NextRequest } from "next/server"

import {
  DEMO_COOKIE,
  DEMO_PREVIOUS_COOKIE,
  SESSION_HINT_COOKIE,
  SESSION_HINT_OPTIONS,
} from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

/** POST only, so a link or prefetch can never sign someone out. */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase?.auth.signOut()
  // 303 turns the POST into a GET on the home page.
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 })
  response.cookies.delete(SESSION_HINT_COOKIE)
  // Demo mode: end the session but remember the account, so signing back in restores it.
  const demoId = request.cookies.get(DEMO_COOKIE)?.value
  if (demoId) {
    response.cookies.set(DEMO_PREVIOUS_COOKIE, demoId, {
      ...SESSION_HINT_OPTIONS,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 90,
    })
    response.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 })
  }
  return response
}
