import { timingSafeEqual } from "node:crypto"

import { Octokit } from "@octokit/rest"
import { NextResponse, type NextRequest } from "next/server"

import { safeNextPath } from "@/lib/auth/redirect"
import { getCurrentUser } from "@/lib/auth/session"
import { isGithubConfigured } from "@/lib/env"
import { saveGithubConnection } from "@/lib/github/client"

function sameState(a: string | undefined, b: string | null) {
  if (!a || !b || a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function GET(request: NextRequest) {
  const next = safeNextPath(request.cookies.get("lp_gh_next")?.value ?? "/program")
  const back = (status: string) => {
    const url = new URL(next, request.url)
    url.searchParams.set("github", status)
    const response = NextResponse.redirect(url)
    response.cookies.set("lp_gh_state", "", { path: "/api/github", maxAge: 0 })
    response.cookies.set("lp_gh_next", "", { path: "/api/github", maxAge: 0 })
    return response
  }

  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL("/login", request.url))
  if (!isGithubConfigured()) return back("not_configured")
  if (request.nextUrl.searchParams.get("error")) return back("cancelled")
  if (!sameState(request.cookies.get("lp_gh_state")?.value, request.nextUrl.searchParams.get("state"))) return back("failed")

  const code = request.nextUrl.searchParams.get("code")
  if (!code) return back("failed")

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  }).catch(() => null)
  const token = (await tokenResponse?.json().catch(() => null)) as { access_token?: string; scope?: string } | null
  if (!token?.access_token) return back("failed")

  try {
    const { data } = await new Octokit({ auth: token.access_token }).users.getAuthenticated()
    await saveGithubConnection(user.id, token.access_token, { id: data.id, login: data.login }, token.scope ?? "")
  } catch {
    return back("failed")
  }
  return back("connected")
}
