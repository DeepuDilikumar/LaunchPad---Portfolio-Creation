import { ChevronDown } from "lucide-react"

import { FAQ } from "@/content/faq"
import { Section } from "./section"

/** Native <details> accordion: zero JS, keyboard and screen-reader friendly, one open at a time. */
export function Faq() {
  return (
    <Section id="faq" tone="surface" eyebrow="FAQ" title="Questions, answered">
      <div className="max-w-3xl overflow-hidden rounded-2xl bg-card shadow-e1">
        {FAQ.map((item, index) => (
          <details key={item.question} name="faq" className="group border-b border-border last:border-b-0" open={index === 0}>
            <summary className="flex min-h-14 list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium transition-colors duration-(--dur-fast) hover:bg-muted/60 md:px-6 [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDown
                className="size-5 shrink-0 text-muted-foreground transition-transform duration-(--dur-base) ease-out-expo group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-5 pb-5 text-muted-foreground md:px-6">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}
