import { ArrowRight, Clock, Lock, UserRound } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { START_HREF } from "@/config/site"
import { cn } from "@/lib/utils"
import { BeforeAfter } from "./before-after"

export function Reassurance({ className }: { className?: string }) {
  const items = [
    { Icon: Clock, text: "Takes 2 min" },
    { Icon: UserRound, text: "No sign-up" },
    { Icon: Lock, text: "Your resume stays private" },
  ]
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground",
        className
      )}
    >
      {items.map(({ Icon, text }) => (
        <li key={text} className="inline-flex items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  )
}

export function PrimaryCta({ className }: { className?: string }) {
  return (
    <Link href={START_HREF} className={cn(buttonVariants({ size: "lg" }), className)}>
      Upload resume — free
      <ArrowRight aria-hidden />
    </Link>
  )
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative overflow-hidden"
    >
      {/* The one allowed wash: very subtle, behind the visual only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_70%_40%,color-mix(in_oklab,var(--primary)_6%,transparent),transparent)]"
      />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-14 sm:px-6 md:pt-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
        <div className="flex flex-col items-start">
          <p className="rounded-full border border-border bg-card px-3 py-1 text-caption text-muted-foreground">
            For final-year students &amp; 0–2 yr developers
          </p>
          <h1
            id="hero-title"
            className="mt-4 text-display font-semibold md:text-display-lg"
          >
            Your resume, live as a portfolio in 2 minutes.
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Then find out exactly why you&apos;re not clearing product-company screens,
            and fix it by building one real project in 14 days.
          </p>
          <div data-cta-sentinel className="mt-6 flex w-full flex-col gap-3 sm:w-auto">
            <PrimaryCta className="w-full sm:w-auto" />
            <Reassurance />
          </div>
        </div>

        <BeforeAfter />
      </div>
    </section>
  )
}
