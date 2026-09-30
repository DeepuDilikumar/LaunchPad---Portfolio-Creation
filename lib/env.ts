import "server-only"

import { isSupabaseConfigured } from "./supabase/env"

/**
 * Which real services are connected. Every feature works in two modes:
 * - Real: the service's keys are set (see .env.example).
 * - Demo: keys are missing. Features fall back to clearly labelled local behaviour
 *   (demo account, local file database, rule-based analysis, test payments).
 *
 * Demo mode is on in development whenever Supabase isn't configured, and can be forced
 * with LAUNCHPAD_DEMO_MODE=1 (used for preview builds). It is never on in production
 * when Supabase is configured.
 */
export function isDemoMode(): boolean {
  if (isSupabaseConfigured() && process.env.LAUNCHPAD_DEMO_MODE !== "1") return false
  if (process.env.LAUNCHPAD_DEMO_MODE === "1") return true
  return process.env.NODE_ENV !== "production"
}

export function hasServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

/** Real database only when Supabase is configured with a server key and we're not forced into demo. */
export function supabaseStoreEnabled(): boolean {
  return isSupabaseConfigured() && hasServiceRole() && !isDemoMode()
}

export function isLLMConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export function isGithubConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.GITHUB_TOKEN_ENC_KEY
  )
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL)
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")
}

/** A snapshot the UI can use to label demo behaviour honestly. */
export function serviceStatus() {
  return {
    demo: isDemoMode(),
    ai: isLLMConfigured(),
    payments: isRazorpayConfigured(),
    github: isGithubConfigured(),
    email: isEmailConfigured(),
  }
}
export type ServiceStatus = ReturnType<typeof serviceStatus>
