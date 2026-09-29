import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth/redirect"
import { createClient } from "@/lib/supabase/server"

/** OAuth (Google / GitHub) lands here with a one-time code, which we swap for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  const failure = (reason: string) => {
    const url = new URL("/login", origin)
    url.searchParams.set("error", reason)
    url.searchParams.set("next", next)
    return NextResponse.redirect(url)
  }

  // The provider sends ?error=access_denied when the user cancels.
  if (searchParams.get("error")) return failure("cancelled")
  if (!code) return failure("missing_code")

  const supabase = await createClient()
  if (!supabase) return failure("not_configured")

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return failure("exchange_failed")

  return NextResponse.redirect(new URL(next, origin))
}
