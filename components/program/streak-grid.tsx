import { Check, Lock, Minus } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export type DayCell = { day: number; state: "done" | "today" | "open" | "missed" | "locked"; title: string }

const LABEL: Record<DayCell["state"], string> = {
  done: "completed",
  today: "today",
  open: "open to catch up",
  missed: "not done yet",
  locked: "locked",
}

/** 14 cells: 2 rows of 7 on phones, one row on desktop. Every cell has a text label. */
export function StreakGrid({ cells }: { cells: DayCell[] }) {
  return (
    <ol className="grid grid-cols-7 gap-1.5 md:grid-cols-14" aria-label="Your 14 days">
      {cells.map((c) => {
        const content = (
          <>
            <span className="tabular font-mono text-caption">{c.day}</span>
            {c.state === "done" ? (
              <Check className="size-3.5" aria-hidden />
            ) : c.state === "locked" ? (
              <Lock className="size-3" aria-hidden />
            ) : c.state === "missed" ? (
              <Minus className="size-3.5" aria-hidden />
            ) : null}
          </>
        )
        const className = cn(
          "flex aspect-square min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-colors duration-(--dur-fast)",
          c.state === "done" && "bg-primary text-primary-foreground",
          c.state === "today" && "bg-tonal text-tonal-foreground ring-2 ring-primary",
          c.state === "open" && "bg-surface text-foreground ring-1 ring-border hover:bg-muted",
          c.state === "missed" && "bg-muted text-muted-foreground hover:bg-muted/70",
          c.state === "locked" && "border border-dashed border-border text-muted-foreground"
        )
        return (
          <li key={c.day}>
            {c.state === "locked" ? (
              <span className={className} aria-label={`Day ${c.day}, ${LABEL[c.state]}`}>
                {content}
              </span>
            ) : (
              <Link href={`/program/day/${c.day}`} className={className} aria-label={`Day ${c.day}: ${c.title}, ${LABEL[c.state]}`}>
                {content}
              </Link>
            )}
          </li>
        )
      })}
    </ol>
  )
}
