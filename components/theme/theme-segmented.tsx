"use client"

import { Monitor, Moon, Sun } from "lucide-react"

import type { Theme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { setTheme, useTheme } from "./use-theme"

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
]

/** Mobile menu: a 3-way segmented control built on native radios (keyboard + screen-reader friendly). */
export function ThemeSegmented({ className }: { className?: string }) {
  const { theme } = useTheme()

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="mb-2 text-caption text-muted-foreground">Theme</legend>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-1">
        {OPTIONS.map(({ value, label, Icon }) => (
          <label
            key={value}
            className={cn(
              "flex h-11 items-center justify-center gap-1.5 rounded-md text-sm transition-colors duration-(--dur-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring",
              theme === value
                ? "bg-background font-semibold text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <input
              type="radio"
              name="launchpad-theme"
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
              className="sr-only"
            />
            <Icon className="size-4" aria-hidden />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
