"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * "Sign in" or "Account", decided from the presence of the Supabase auth cookie.
 * This keeps the landing page static and avoids loading the Supabase SDK on it;
 * the account page itself verifies the session on the server.
 */
function hasSessionCookie() {
  return /(?:^|;\s*)sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie)
}

const noopSubscribe = () => () => {}

export function AuthLink({
  className,
  variant = "ghost",
  fullWidth = false,
}: {
  className?: string
  variant?: "ghost" | "secondary"
  fullWidth?: boolean
}) {
  const signedIn = useSyncExternalStore(noopSubscribe, hasSessionCookie, () => false)

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className={cn(buttonVariants({ variant }), fullWidth && "w-full", className)}
    >
      {signedIn ? "Account" : "Sign in"}
    </Link>
  )
}
