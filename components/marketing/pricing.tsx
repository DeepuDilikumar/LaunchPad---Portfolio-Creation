import { Check, RotateCcw, ShieldCheck } from "lucide-react"

import {
  PAYMENT_NOTE,
  PLANS,
  REFUND_LINE,
  bundleSavingsPaise,
  formatPrice,
} from "@/config/pricing"
import { cn } from "@/lib/utils"
import { Section } from "./section"

export function Pricing() {
  const savings = bundleSavingsPaise()

  return (
    <Section
      id="pricing"
      title="Simple, one-time pricing"
      lead="Start free. You only pay after you've seen your score, and only for what you want."
    >
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const highlighted = Boolean(plan.highlight)
          return (
            <li
              key={plan.key}
              className={cn(
                "relative flex flex-col rounded-xl border bg-card p-5 md:p-6",
                highlighted ? "border-primary ring-1 ring-primary" : "border-border"
              )}
            >
              {highlighted ? (
                <p className="absolute -top-3 left-5 rounded-full bg-primary px-2.5 py-0.5 text-caption font-semibold text-primary-foreground">
                  {plan.highlight}
                  {savings > 0 ? ` · save ${formatPrice(savings)}` : ""}
                </p>
              ) : null}
              <h3 className="text-base font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="tabular font-mono text-[2rem] leading-none font-semibold tracking-tight">
                  {formatPrice(plan.amountPaise)}
                </span>
                <span className="text-caption text-muted-foreground">
                  {plan.amountPaise === 0 ? "forever" : "one-time"}
                </span>
              </p>
              <ul className="mt-5 flex flex-col gap-2.5 border-t border-border pt-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>

      <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6">
        <li className="inline-flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0" aria-hidden />
          {PAYMENT_NOTE}
        </li>
        <li className="inline-flex items-center gap-2">
          <RotateCcw className="size-4 shrink-0" aria-hidden />
          {REFUND_LINE}
        </li>
      </ul>
    </Section>
  )
}
