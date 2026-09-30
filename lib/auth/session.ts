import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { isDemoMode } from "@/lib/env"
import { getUser as getSupabaseUser } from "@/lib/supabase/server"

export const DEMO_COOKIE = "lp_demo_uid"
/** Remembers the demo account after sign-out, so signing back in restores the same progress. */
export const DEMO_PREVIOUS_COOKIE = "lp_demo_prev"
/** Non-sensitive hint so static pages can show "Open app" instead of "Sign in". */
export const SESSION_HINT_COOKIE = "lp_session"

export type AppUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
  provider: "google" | "github" | "demo" | "email"
  isDemo: boolean
}

/** The signed-in user from Supabase, or the demo account in demo mode. */
export async function getCurrentUser(): Promise<AppUser | null> {
  // Always per-request: never let a build-time "signed out" answer get prerendered.
  await connection()
  if (isDemoMode()) {
    const store = await cookies()
    const id = store.get(DEMO_COOKIE)?.value
    if (!id || !/^[0-9a-f-]{36}$/.test(id)) return null
    return {
      id,
      email: "demo.student@example.com",
      name: null,
      avatarUrl: null,
      provider: "demo",
      isDemo: true,
    }
  }

  const user = await getSupabaseUser()
  if (!user) return null
  const meta = user.user_metadata ?? {}
  const provider = user.app_metadata?.provider
  return {
    id: user.id,
    email: user.email ?? null,
    name: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
    avatarUrl: (meta.avatar_url as string | undefined) ?? null,
    provider: provider === "google" || provider === "github" ? provider : "email",
    isDemo: false,
  }
}

/** For server pages: the user, or a redirect to sign-in that returns here afterwards. */
export async function requireUser(nextPath: string): Promise<AppUser> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`)
  return user
}

export const SESSION_HINT_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30,
}
