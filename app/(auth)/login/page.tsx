import { FlaskConical, Lock } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { Button } from "@/components/ui/button"
import { safeNextPath } from "@/lib/auth/redirect"
import { getCurrentUser } from "@/lib/auth/session"
import { isDemoMode } from "@/lib/env"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { LoginPanel } from "./login-panel"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
}

const REASONS: Record<string, string> = {
  "/start/publish": "Sign in to publish your portfolio. Everything you've filled in is saved.",
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams
  const next = safeNextPath(typeof params.next === "string" ? params.next : null)
  const error = typeof params.error === "string" ? params.error : undefined
  const demo = isDemoMode()
  const configured = isSupabaseConfigured() && !demo

  // Already signed in? Skip the form.
  if (!error && (await getCurrentUser())) redirect(next)

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-h1 font-normal">Sign in to LaunchPad</h1>
      <p className="mt-2 text-muted-foreground">
        {REASONS[next.split("?")[0]] ?? "Save your work and pick up where you left off, on any device."}
      </p>

      <div className="mt-8">
        {demo ? (
          <div className="flex flex-col gap-3">
            <form action="/auth/demo" method="post">
              <input type="hidden" name="next" value={next} />
              <Button type="submit" size="lg" className="w-full">
                Continue with a demo account
              </Button>
            </form>
            <p className="flex gap-2 rounded-2xl bg-tonal p-3 text-sm text-tonal-foreground">
              <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Demo mode: this server isn&apos;t connected to Google or GitHub sign-in yet. Your
                demo account and its data stay on this computer.
              </span>
            </p>
          </div>
        ) : (
          <LoginPanel next={next} initialError={error} configured={configured} />
        )}
      </div>

      <p className="mt-6 flex items-start gap-2 text-caption text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        We only use your name and email to save your work. We never post anything for you.
      </p>
    </div>
  )
}
