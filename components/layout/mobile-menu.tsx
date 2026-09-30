"use client"

import { ArrowRight, Menu } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { ThemeSegmented } from "@/components/theme/theme-segmented"
import { buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NAV_LINKS, START_HREF } from "@/config/site"
import { cn } from "@/lib/utils"
import { AuthLink } from "./auth-link"

/** Mobile navigation as a bottom sheet: links, 3-way theme control, and the one primary action. */
export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-mr-2")}
        aria-label="Open menu"
      >
        <Menu className="size-5" aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-[28px] px-4 pt-3 pb-safe"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden />
        <SheetTitle className="pr-12 text-h3">Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Site navigation, theme and sign in
        </SheetDescription>

        <nav aria-label="Main" className="mt-2">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="-mx-2 flex h-12 items-center rounded-full px-2 text-base text-foreground hover:bg-muted"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ThemeSegmented className="mt-4" />

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={START_HREF}
            onClick={close}
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Upload resume — free
            <ArrowRight aria-hidden />
          </Link>
          <AuthLink variant="secondary" fullWidth />
        </div>
      </SheetContent>
    </Sheet>
  )
}
