"use client"

import { RotateCcw, TriangleAlert } from "lucide-react"
import Link from "next/link"

import { StatePanel } from "@/components/shared/state-panel"
import { Button, buttonVariants } from "@/components/ui/button"

/** Route-level error boundary: what happened + one clear way to fix it. Never shows raw error text. */
export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-4 py-20 md:py-28">
      <StatePanel
        icon={TriangleAlert}
        tone="danger"
        title="Something went wrong on our side"
        action={
          <>
            <Button size="lg" className="w-full sm:w-auto" onClick={reset}>
              <RotateCcw aria-hidden />
              Try again
            </Button>
            <Link href="/" className={buttonVariants({ variant: "ghost" })}>
              Go to home
            </Link>
          </>
        }
      >
        <p>This page didn&apos;t load. Your work is saved, so trying again is safe.</p>
      </StatePanel>
    </div>
  )
}
