import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { safeNextPath } from "@/lib/auth/redirect"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getUser } from "@/lib/supabase/server"
import { LoginPanel } from "./login-panel"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams
  const next = safeNextPath(typeof params.next === "string" ? params.next : null)
  const error = typeof params.error === "string" ? params.error : undefined
  const configured = isSupabaseConfigured()

  // Already signed in? Skip the form.
  if (configured && !error && (await getUser())) redirect(next)

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-h1 font-semibold">Sign in to LaunchPad</h1>
      <p className="mt-2 text-muted-foreground">
        Save your portfolio and pick up where you left off, on any device.
      </p>
      <div className="mt-8">
        <LoginPanel next={next} initialError={error} configured={configured} />
      </div>
    </div>
  )
}
