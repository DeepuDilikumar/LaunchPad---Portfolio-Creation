import { ArrowRight, Clock, CreditCard, Lock } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { START_HREF } from "@/config/site"
import { cn } from "@/lib/utils"
import { BeforeAfter } from "./before-after"

export function Reassurance({ className }: { className?: string }) {
  const items = [
    { Icon: Clock, text: "Takes 2 min" },
    { Icon: CreditCard, text: "Free, no card needed" },
    { Icon: Lock, text: "Your resume stays private" },
  ]
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-muted-foreground", className)}>
      {items.map(({ Icon, text }) => (
        <li key={text} className="inline-flex items-center gap-1.5">
          <Icon className="size-4 text-accent-text" aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  )
}

export function PrimaryCta({ className, label = "Upload resume — free" }: { className?: string; label?: string }) {
  return (
    <Link href={START_HREF} className={cn(buttonVariants({ size: "lg" }), className)}>
      {label}
      <ArrowRight aria-hidden />
    </Link>
  )
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-12 sm:px-6 md:pt-14 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:px-8 lg:pt-20 lg:pb-20">
        <div className="flex flex-col items-start">
          <p className="inline-flex items-center gap-2 rounded-full bg-tonal px-3 py-1 text-caption font-medium text-tonal-foreground">
            For final-year students &amp; 0–2 yr developers
          </p>
          <h1 id="hero-title" className="mt-5 text-display font-normal md:text-display-lg">
            Your resume, live as a portfolio in{" "}
            <span className="text-accent-text">2 minutes.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Then see exactly why you&apos;re not clearing product-company screens, and fix it by
            building one real project in 14 days.
          </p>
          <div data-cta-sentinel className="mt-7 flex w-full flex-col gap-4 sm:w-auto">
            <PrimaryCta className="w-full sm:w-auto" />
            <Reassurance />
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-5 sm:p-8">
          <BeforeAfter />
        </div>
      </div>
    </section>
  )
}
