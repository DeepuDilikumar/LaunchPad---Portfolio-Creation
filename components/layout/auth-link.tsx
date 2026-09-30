"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * "Sign in" or "Open app", decided from a non-sensitive hint cookie set at sign-in.
 * Keeps the landing page static and avoids loading the Supabase SDK on it;
 * signed-in pages always verify the session on the server.
 */
function hasSessionHint() {
  return /(?:^|;\s*)(lp_session=1|sb-[^=]+-auth-token(?:\.0)?=)/.test(document.cookie)
}

const noopSubscribe = () => () => {}

export function AuthLink({
  className,
  variant = "ghost",
  fullWidth = false,
}: {
  className?: string
  variant?: "ghost" | "secondary" | "outline"
  fullWidth?: boolean
}) {
  const signedIn = useSyncExternalStore(noopSubscribe, hasSessionHint, () => false)

  return (
    <Link
      href={signedIn ? "/home" : "/login"}
      className={cn(buttonVariants({ variant }), fullWidth && "w-full", className)}
    >
      {signedIn ? "Open my dashboard" : "Sign in"}
    </Link>
  )
}
