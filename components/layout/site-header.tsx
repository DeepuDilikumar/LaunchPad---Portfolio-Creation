import Link from "next/link"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { NAV_LINKS } from "@/config/site"
import { AuthLink } from "./auth-link"
import { Logo } from "./logo"
import { MobileMenu } from "./mobile-menu"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-(--z-header) border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors duration-(--dur-fast) hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          <AuthLink />
        </div>

        <div className="md:hidden">
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
