"use client"

import { Gauge, House, LayoutTemplate, Rocket, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export const APP_NAV: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/home", label: "Home", Icon: House },
  { href: "/portfolio", label: "Portfolio", Icon: LayoutTemplate },
  { href: "/report", label: "Report", Icon: Gauge },
  { href: "/program", label: "Program", Icon: Rocket },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Desktop: tabs in the top bar. */
export function DesktopTabs() {
  const pathname = usePathname()
  return (
    <nav aria-label="App" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {APP_NAV.map(({ href, label }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors duration-(--dur-fast)",
                  active ? "bg-tonal font-medium text-tonal-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Phones: Material-style bottom navigation bar, max 4 destinations. */
export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-(--z-header) border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {APP_NAV.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex h-16 flex-col items-center justify-center gap-1 text-[0.75rem]"
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-(--dur-base)",
                    active ? "bg-tonal text-tonal-foreground" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className={cn(active ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
