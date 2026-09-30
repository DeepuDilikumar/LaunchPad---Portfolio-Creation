import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
  className,
  tone = "default",
}: {
  id: string
  eyebrow?: string
  title: string
  lead?: ReactNode
  children: ReactNode
  className?: string
  tone?: "default" | "surface"
}) {
  const titleId = `${id}-title`
  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn("py-16 md:py-24", tone === "surface" && "bg-surface", className)}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          {eyebrow ? (
            <p className="mb-2 text-sm font-medium text-accent-text">{eyebrow}</p>
          ) : null}
          <h2 id={titleId} className="text-h1 font-normal md:text-h1-lg">
            {title}
          </h2>
          {lead ? <p className="mt-3 text-base text-muted-foreground md:text-lg">{lead}</p> : null}
        </div>
        <div className="mt-10 md:mt-12">{children}</div>
      </div>
    </section>
  )
}
