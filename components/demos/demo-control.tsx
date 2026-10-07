"use client";

import { cn } from "@/lib/cn";
import { IconPause, IconPlay } from "@/components/ui/icons";

/** Pause/play for auto-playing content longer than 5s (WCAG 2.2.2). */
export function DemoControl({
  paused,
  onToggle,
  label,
  className,
}: {
  paused: boolean;
  onToggle: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? `Play ${label}` : `Pause ${label}`}
      aria-pressed={paused}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full bg-surface-2 text-text-2 hover:bg-surface-3 hover:text-text-1 transition-colors",
        className,
      )}
    >
      {paused ? <IconPlay size={12} /> : <IconPause size={12} />}
    </button>
  );
}
