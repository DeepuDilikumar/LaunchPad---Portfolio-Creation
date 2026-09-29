"use client"

import { AlertCircle, Lock } from "lucide-react"
import { useState } from "react"

import { GitHubIcon, GoogleIcon } from "@/components/icons/brand"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Provider = "google" | "github"

const ERROR_COPY: Record<string, string> = {
  cancelled: "Sign-in was cancelled. Pick an option below to try again.",
  missing_code: "Sign-in didn't finish. Please try again.",
  exchange_failed: "That sign-in link expired. Please try again.",
  not_configured: "Sign-in isn't set up on this server yet.",
  start_failed: "We couldn't reach the sign-in service. Check your connection and try again.",
}

export function LoginPanel({
  next,
  initialError,
  configured,
}: {
  next: string
  initialError?: string
  configured: boolean
}) {
  const [pending, setPending] = useState<Provider | null>(null)
  const [error, setError] = useState<string | undefined>(
    configured ? initialError : "not_configured"
  )

  async function signIn(provider: Provider) {
    const supabase = createClient()
    if (!supabase) {
      setError("not_configured")
      return
    }
    setPending(provider)
    setError(undefined)
    const redirectTo = new URL("/auth/callback", window.location.origin)
    redirectTo.searchParams.set("next", next)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo.toString() },
    })
    // On success the browser is already navigating to the provider; keep the spinner.
    if (oauthError) {
      setPending(null)
      setError("start_failed")
    }
  }

  const message = error ? (ERROR_COPY[error] ?? ERROR_COPY.missing_code) : null

  return (
    <div className="flex flex-col gap-3">
      {message ? (
        <p
          role="alert"
          className="flex gap-2 rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{message}</span>
        </p>
      ) : null}

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        loading={pending === "google"}
        disabled={!configured || pending !== null}
        onClick={() => signIn("google")}
      >
        {pending === "google" ? null : <GoogleIcon className="size-5" />}
        Continue with Google
      </Button>
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        loading={pending === "github"}
        disabled={!configured || pending !== null}
        onClick={() => signIn("github")}
      >
        {pending === "github" ? null : <GitHubIcon className="size-5" />}
        Continue with GitHub
      </Button>

      <p className="mt-2 flex items-start gap-2 text-caption text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        We only use your name and email to save your work. We never post anything for you.
      </p>
    </div>
  )
}
