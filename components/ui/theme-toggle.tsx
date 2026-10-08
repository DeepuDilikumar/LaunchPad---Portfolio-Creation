"use client";

import { setThemePref, useTheme } from "@/lib/theme";
import { cn } from "@/lib/cn";
import { IconMoon, IconSun } from "./icons";

/** Switches between light and dark. "System" lives in Settings. */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved } = useTheme();
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setThemePref(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      data-theme-toggle
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full text-text-2 transition-colors duration-200 hover:bg-surface-2 hover:text-text-1",
        className,
      )}
    >
      {resolved === "dark" ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  );
}
