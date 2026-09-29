import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/layout/logo"
import { ThemeToggle } from "@/components/theme/theme-toggle"

/** Focused layout for sign-in: no nav, one task. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <ThemeToggle />
      </header>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 flex-col items-center px-4 pt-10 pb-16 outline-none sm:justify-center sm:pt-0"
      >
        {children}
        <Link
          href="/"
          className="mt-10 inline-flex h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>
      </main>
    </>
  )
}
