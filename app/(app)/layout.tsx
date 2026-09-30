import { FlaskConical } from "lucide-react"
import { redirect } from "next/navigation"

import { AccountMenu } from "@/components/app/account-menu"
import { BottomNav, DesktopTabs } from "@/components/app/app-nav"
import { Logo } from "@/components/layout/logo"
import { getCurrentUser } from "@/lib/auth/session"
import { getProfile } from "@/lib/data/profiles"

/** Signed-in area: top bar (tabs on desktop) + bottom navigation on phones. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const profile = await getProfile(user.id)
  const name = profile?.data.fullName || user.name || ""

  return (
    <>
      {user.isDemo ? (
        <p className="flex items-center justify-center gap-2 bg-tonal px-4 py-1.5 text-center text-caption text-tonal-foreground">
          <FlaskConical className="size-3.5 shrink-0" aria-hidden />
          Demo mode: payments, GitHub and AI are simulated or rule-based, and clearly labelled.
        </p>
      ) : null}
      <header className="sticky top-0 z-(--z-header) border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <DesktopTabs />
          <AccountMenu name={name} email={user.email} isDemo={user.isDemo} />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 pb-24 outline-none md:pb-12">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
