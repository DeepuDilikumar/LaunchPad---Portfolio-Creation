import { Check } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export const FLOW_STEPS = [
  { key: "upload", label: "Upload", time: "~30 sec" },
  { key: "details", label: "Your details", time: "~1 min" },
  { key: "template", label: "Template", time: "~20 sec" },
  { key: "publish", label: "Publish", time: "~10 sec" },
] as const
export type FlowStep = (typeof FLOW_STEPS)[number]["key"]

/** "Step 2 of 4 · ~1 min" with a segmented bar on phones; a labelled stepper from md. */
export function FlowProgress({ step }: { step: FlowStep }) {
  const index = FLOW_STEPS.findIndex((s) => s.key === step)
  const current = FLOW_STEPS[index]
  return (
    <nav aria-label="Progress" className="w-full">
      <p className="text-caption text-muted-foreground md:hidden">
        Step {index + 1} of {FLOW_STEPS.length} · {current.label} · {current.time}
      </p>
      <ol className="mt-2 grid grid-cols-4 gap-1.5 md:hidden" aria-hidden>
        {FLOW_STEPS.map((s, i) => (
          <li
            key={s.key}
            className={cn("h-1 rounded-full", i <= index ? "bg-primary" : "bg-muted")}
          />
        ))}
      </ol>
      <ol className="hidden items-center gap-2 md:flex">
        {FLOW_STEPS.map((s, i) => {
          const done = i < index
          const active = i === index
          return (
            <li key={s.key} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-caption font-medium",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-tonal text-tonal-foreground ring-2 ring-primary",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn("text-sm", active ? "font-medium text-foreground" : "text-muted-foreground")}>
                {s.label}
                {done ? <span className="sr-only"> (done)</span> : null}
              </span>
              {i < FLOW_STEPS.length - 1 ? <span className="mx-1 h-px w-8 bg-border" aria-hidden /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/** Page shell for a flow step: title, lead, body, and a sticky primary action on phones. */
export function FlowPage({
  step,
  title,
  lead,
  children,
  footer,
}: {
  step: FlowStep
  title: string
  lead?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-6 pb-36 sm:px-6 md:pt-10 md:pb-16">
      <FlowProgress step={step} />
      <h1 className="mt-6 text-h1 font-normal md:text-h1-lg">{title}</h1>
      {lead ? <p className="mt-2 text-muted-foreground md:text-lg">{lead}</p> : null}
      <div className="mt-6 md:mt-8">{children}</div>
      {footer ? (
        <div className="fixed inset-x-0 bottom-0 z-(--z-sticky) bg-background px-4 pt-3 pb-safe shadow-e3 md:static md:mt-10 md:bg-transparent md:p-0 md:shadow-none">
          <div className="mx-auto flex max-w-2xl flex-col gap-2 md:flex-row-reverse md:items-center md:justify-between">
            {footer}
          </div>
        </div>
      ) : null}
    </div>
  )
}
