import { Logo } from "@/components/layout/logo"
import { ThemeToggle } from "@/components/theme/theme-toggle"

/** Focused onboarding layout: no site navigation, one task per screen. */
export default function FlowLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-(--z-header) border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <ThemeToggle />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
    </>
  )
}
