import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabaseEnv } from "./env"

/**
 * Server client for Server Components, Route Handlers and Server Actions.
 * Create one per request. Returns null when Supabase isn't configured.
 */
export async function createClient() {
  const env = getSupabaseEnv()
  if (!env) return null
  const cookieStore = await cookies()

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: proxy.ts refreshes the session on every matched request.
        }
      },
    },
  })
}

/** The signed-in user, verified with Supabase Auth (not just decoded from the cookie). */
export async function getUser() {
  const supabase = await createClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}
