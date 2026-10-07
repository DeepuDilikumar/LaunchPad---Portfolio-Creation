import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { statusColors } from "@/lib/accents";

/** Small rounded label. Monochrome by default. */
export function Pill({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-1 px-3 h-7 t-badge text-text-1",
    href && "hover:bg-surface-2 transition-colors",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return <span className={cls}>{children}</span>;
}

export type Status = "working" | "passed" | "failed" | "idle";

/** Status chip: colored dot + text. The only place status color appears. */
export function StatusChip({
  status,
  children,
  className,
}: {
  status: Status;
  children: ReactNode;
  className?: string;
}) {
  const color = status === "idle" ? "var(--text-3)" : statusColors[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 h-6 t-badge whitespace-nowrap",
        className,
      )}
      style={{ color: status === "idle" ? "var(--text-2)" : color }}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: color }} />
      {children}
    </span>
  );
}

/** Rounded-square avatar in a project accent color. */
export function AccentAvatar({
  color,
  label,
  size = 28,
  className,
  round = false,
}: {
  color: string;
  label?: string;
  size?: number;
  className?: string;
  round?: boolean;
}) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={cn("inline-flex shrink-0 items-center justify-center font-medium text-black/80", round ? "rounded-full" : "rounded-[8px]", className)}
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.42) }}
    >
      {label ? label.slice(0, 1).toUpperCase() : null}
    </span>
  );
}
