import { randomBytes } from "node:crypto"

import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth/redirect"
import { getCurrentUser } from "@/lib/auth/session"
import { isGithubConfigured, siteUrl } from "@/lib/env"

/** Starts GitHub OAuth (scope public_repo: create the project repo and read its commits). */
export async function GET(request: NextRequest) {
  const next = safeNextPath(request.nextUrl.searchParams.get("next") ?? "/program")
  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, request.url))
  if (!isGithubConfigured()) {
    return NextResponse.redirect(new URL(`${next}${next.includes("?") ? "&" : "?"}github=not_configured`, request.url))
  }
  const state = randomBytes(16).toString("hex")
  const authorize = new URL("https://github.com/login/oauth/authorize")
  authorize.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!)
  authorize.searchParams.set("scope", "public_repo read:user")
  authorize.searchParams.set("state", state)
  authorize.searchParams.set("redirect_uri", `${siteUrl()}/api/github/callback`)
  authorize.searchParams.set("allow_signup", "true")

  const response = NextResponse.redirect(authorize)
  const cookie = { httpOnly: true, sameSite: "lax" as const, path: "/api/github", maxAge: 600, secure: process.env.NODE_ENV === "production" }
  response.cookies.set("lp_gh_state", state, cookie)
  response.cookies.set("lp_gh_next", next, cookie)
  return response
}
