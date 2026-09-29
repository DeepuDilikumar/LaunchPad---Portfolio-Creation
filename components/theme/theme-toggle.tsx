"use client"

import { Moon, Sun } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { setTheme, useTheme } from "./use-theme"

/**
 * Desktop: a single icon button that flips light ⇄ dark.
 * The icon and label are chosen by the `.dark` class (set before paint),
 * so the server HTML is correct for every user and nothing flickers on hydration.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
    >
      <Moon className="size-5 dark:hidden" aria-hidden />
      <Sun className="hidden size-5 dark:block" aria-hidden />
      <span className="sr-only dark:hidden">Switch to dark theme</span>
      <span className="sr-only hidden dark:inline">Switch to light theme</span>
    </button>
  )
}
