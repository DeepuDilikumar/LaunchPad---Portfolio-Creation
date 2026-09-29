import { ArrowRight, LogOut, Settings2 } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { connection } from "next/server"

import { StatePanel } from "@/components/shared/state-panel"
import { Button, buttonVariants } from "@/components/ui/button"
import { START_HREF } from "@/config/site"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { getUser } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Your account",
  robots: { index: false },
}

const PROVIDER_LABELS: Record<string, string> = { google: "Google", github: "GitHub" }

export default async function AccountPage() {
  // Always per-request: this page depends on the visitor's session and runtime env.
  await connection()

  if (!isSupabaseConfigured()) {
    return (
      <div className="px-4 py-16 md:py-24">
        <StatePanel icon={Settings2} title="Sign-in isn't set up yet">
          <p>
            Add the Supabase URL and publishable key to <code className="font-mono">.env.local</code>{" "}
            (see <code className="font-mono">.env.example</code>), then reload.
          </p>
        </StatePanel>
      </div>
    )
  }

  const user = await getUser()
  if (!user) redirect("/login?next=/account")

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.user_name as string | undefined) ??
    user.email ??
    "there"
  const provider = PROVIDER_LABELS[user.app_metadata?.provider ?? ""] ?? "your account"

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 md:py-20">
      <h1 className="text-h1 font-semibold md:text-h1-lg">Hi, {name.split(" ")[0]}</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in with {provider}
        {user.email ? (
          <>
            {" "}as <span className="text-foreground [overflow-wrap:anywhere]">{user.email}</span>
          </>
        ) : null}
        .
      </p>

      <section
        aria-labelledby="next-step"
        className="mt-8 rounded-xl border border-border bg-card p-5 md:p-6"
      >
        <h2 id="next-step" className="text-h3 font-semibold">
          Your portfolio isn&apos;t live yet
        </h2>
        <p className="mt-1.5 text-muted-foreground">
          Upload your resume and we&apos;ll set it up for you. Takes about 2 minutes.
        </p>
        <Link
          href={START_HREF}
          className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full sm:w-auto")}
        >
          Upload resume
          <ArrowRight aria-hidden />
        </Link>
      </section>

      <form action="/auth/signout" method="post" className="mt-8">
        <Button type="submit" variant="ghost" className="-ml-3">
          <LogOut aria-hidden />
          Sign out
        </Button>
      </form>
    </div>
  )
}
