"use client"

import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseEnv } from "./env"

/** Browser client. Returns null when Supabase isn't configured. */
export function createClient() {
  const env = getSupabaseEnv()
  if (!env) return null
  return createBrowserClient(env.url, env.key)
}
