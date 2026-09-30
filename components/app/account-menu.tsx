"use client"

import { LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { ThemeSegmented } from "@/components/theme/theme-segmented"
import { ResponsiveSheet } from "@/components/ui/responsive-sheet"

export function AccountMenu({ name, email, isDemo }: { name: string; email: string | null; isDemo: boolean }) {
  const [open, setOpen] = useState(false)
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "Me"
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
        aria-label="Account and settings"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-tonal text-sm font-medium text-tonal-foreground">
          {initials}
        </span>
      </button>
      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={name || "Your account"}
        description={isDemo ? "Demo account · data stays on this computer" : (email ?? undefined)}
      >
        <div className="flex flex-col gap-5 pb-2">
          <ThemeSegmented />
          <div className="flex flex-col">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="-mx-2 flex h-12 items-center gap-3 rounded-full px-3 hover:bg-muted"
            >
              <Settings className="size-5 text-muted-foreground" aria-hidden />
              Settings and privacy
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="-mx-2 flex h-12 w-full items-center gap-3 rounded-full px-3 text-left hover:bg-muted">
                <LogOut className="size-5 text-muted-foreground" aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </ResponsiveSheet>
    </>
  )
}
