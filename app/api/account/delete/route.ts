import { NextResponse } from "next/server"

import { deleteAccount } from "@/lib/account/delete"
import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { DEMO_COOKIE, DEMO_PREVIOUS_COOKIE, SESSION_HINT_COOKIE } from "@/lib/auth/session"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  try {
    await deleteAccount(user.id, { isDemo: user.isDemo })
  } catch {
    console.error("[account] delete failed")
    return jsonError(500, "delete_failed", "We couldn't finish deleting your data. Please try again, or email us and we'll do it by hand.")
  }
  const supabase = await createClient()
  await supabase?.auth.signOut()
  const response = NextResponse.json({ ok: true })
  for (const name of [SESSION_HINT_COOKIE, DEMO_COOKIE, DEMO_PREVIOUS_COOKIE]) response.cookies.set(name, "", { path: "/", maxAge: 0 })
  return response
}
