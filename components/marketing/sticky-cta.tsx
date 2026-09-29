"use client"

import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import { buttonVariants } from "@/components/ui/button"
import { START_HREF } from "@/config/site"
import { cn } from "@/lib/utils"

/**
 * Mobile-only bottom bar with the primary action.
 * Appears once the hero CTA scrolls away; hides whenever any in-page CTA
 * (marked with data-cta-sentinel) is on screen, so two identical buttons never show at once.
 */
export function StickyCta() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const sentinels = Array.from(document.querySelectorAll("[data-cta-sentinel]"))
    if (sentinels.length === 0) return
    const onScreen = new Set<Element>()
    let pastHero = false

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target)
        else onScreen.delete(entry.target)
        if (entry.target === sentinels[0]) {
          pastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0
        }
      }
      setVisible(pastHero && onScreen.size === 0)
    })
    sentinels.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-(--z-sticky) border-t border-border bg-background/95 px-4 pt-3 pb-safe backdrop-blur-md transition-[transform,opacity] duration-(--dur-slow) ease-out-expo md:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      )}
      aria-hidden={!visible}
      inert={!visible}
    >
      <Link href={START_HREF} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
        Upload resume — free
        <ArrowRight aria-hidden />
      </Link>
      <p className="mt-1.5 text-center text-caption text-muted-foreground">
        Free · ~2 min · No sign-up
      </p>
    </div>
  )
}
