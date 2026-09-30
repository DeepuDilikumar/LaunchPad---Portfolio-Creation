import { Check, RotateCcw, ShieldCheck } from "lucide-react"

import { PAYMENT_NOTE, PLANS, REFUND_LINE, bundleSavingsPaise, formatPrice } from "@/config/pricing"
import { cn } from "@/lib/utils"
import { Section } from "./section"

export function Pricing() {
  const savings = bundleSavingsPaise()

  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title="Simple, one-time pricing"
      lead="Start free. You only pay after you've seen your score, and only for what you want. No subscriptions."
    >
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const highlighted = Boolean(plan.highlight)
          return (
            <li
              key={plan.key}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6",
                highlighted ? "border-2 border-primary shadow-e2" : "border-border"
              )}
            >
              {highlighted ? (
                <p className="absolute -top-3.5 left-6 rounded-full bg-primary px-3 py-1 text-caption font-medium text-primary-foreground">
                  {plan.highlight}
                  {savings > 0 ? ` · save ${formatPrice(savings)}` : ""}
                </p>
              ) : null}
              <h3 className="text-base font-medium">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="tabular text-[2.25rem] leading-none font-normal tracking-tight">
                  {formatPrice(plan.amountPaise)}
                </span>
                <span className="text-caption text-muted-foreground">
                  {plan.amountPaise === 0 ? "forever" : "one-time"}
                </span>
              </p>
              <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent-text" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>

      <ul className="mt-8 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6">
        <li className="inline-flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-accent-text" aria-hidden />
          {PAYMENT_NOTE}
        </li>
        <li className="inline-flex items-center gap-2">
          <RotateCcw className="size-4 shrink-0 text-accent-text" aria-hidden />
          {REFUND_LINE}
        </li>
      </ul>
    </Section>
  )
}
