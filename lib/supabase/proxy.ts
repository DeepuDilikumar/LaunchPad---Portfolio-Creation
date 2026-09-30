import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { getSupabaseEnv } from "./env"

/** Signed-in areas. Everything before "publish" works without an account. */
export const PROTECTED_PREFIXES = ["/home", "/portfolio", "/report", "/program", "/settings", "/account"]

const DEMO_COOKIE = "lp_demo_uid"

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function toLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = "/login"
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`
  return NextResponse.redirect(url)
}

function demoMode(configured: boolean) {
  if (configured && process.env.LAUNCHPAD_DEMO_MODE !== "1") return false
  if (process.env.LAUNCHPAD_DEMO_MODE === "1") return true
  return process.env.NODE_ENV !== "production"
}

/**
 * Refreshes the Supabase session cookie on each matched request and sends signed-out
 * visitors to sign-in (then back) when they open a signed-in page.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const env = getSupabaseEnv()

  if (demoMode(Boolean(env))) {
    if (isProtected(request.nextUrl.pathname) && !request.cookies.get(DEMO_COOKIE)?.value) {
      return toLogin(request)
    }
    return response
  }
  if (!env) return isProtected(request.nextUrl.pathname) ? toLogin(request) : response

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        // Supabase asks for no-cache headers whenever it writes auth cookies.
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value))
      },
    },
  })

  // Do not run code between createServerClient and getUser(): it keeps the session in sync.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && isProtected(request.nextUrl.pathname)) return toLogin(request)
  return response
}
