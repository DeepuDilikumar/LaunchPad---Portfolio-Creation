import Link from "next/link"

import { LogoMark } from "./logo"

export function SiteFooter() {
  return (
    // Extra bottom padding on mobile so the sticky CTA never covers footer links.
    <footer className="border-t border-border bg-surface pb-28 md:pb-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center gap-2">
          <LogoMark className="size-6" />
          <p className="text-sm text-muted-foreground">
            LaunchPad · Built for students aiming at product companies.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
            <li>
              <Link
                href="/privacy"
                className="inline-flex h-11 items-center px-2 text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/#faq"
                className="inline-flex h-11 items-center px-2 text-muted-foreground hover:text-foreground"
              >
                FAQ
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="inline-flex h-11 items-center px-2 text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
