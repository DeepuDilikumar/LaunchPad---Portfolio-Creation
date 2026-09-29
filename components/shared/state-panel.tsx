import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * One layout for empty, error and info states (design system §7):
 * what this is / what happened → why it matters → one clear action.
 */
export function StatePanel({
  icon: Icon,
  title,
  children,
  action,
  tone = "neutral",
  className,
  headingLevel = "h1",
}: {
  icon: LucideIcon
  title: string
  children?: ReactNode
  action?: ReactNode
  tone?: "neutral" | "danger"
  className?: string
  headingLevel?: "h1" | "h2"
}) {
  const Heading = headingLevel
  return (
    <div
      className={cn("mx-auto flex max-w-md flex-col items-center text-center", className)}
      role={tone === "danger" ? "alert" : undefined}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-xl",
          tone === "danger" ? "bg-danger-bg text-danger" : "bg-muted text-foreground"
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <Heading className="mt-5 text-h2 font-semibold">{title}</Heading>
      {children ? <div className="mt-2 text-muted-foreground">{children}</div> : null}
      {action ? <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto">{action}</div> : null}
    </div>
  )
}
