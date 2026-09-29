import { ArrowLeft, FileUp } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Upload your resume",
  robots: { index: false },
}

/**
 * Placeholder for Feature B (resume upload + auto-fill), which ships in Phase 2.
 * Keeps the landing CTA from dead-ending during development.
 */
export default function StartPage() {
  return (
    <div className="px-4 py-16 md:py-24">
      <p className="mb-8 text-center font-mono text-caption text-muted-foreground">
        Step 1 of 4 · ~2 min
      </p>
      <StatePanel
        icon={FileUp}
        title="Resume upload is almost ready"
        action={
          <Link href="/" className={cn(buttonVariants({ variant: "secondary" }), "w-full sm:w-auto")}>
            <ArrowLeft aria-hidden />
            Back to home
          </Link>
        }
      >
        <p>
          Soon you&apos;ll drop your PDF, DOCX or TXT here and we&apos;ll fill in your
          profile for you. Nothing is uploaded until you choose to publish.
        </p>
      </StatePanel>
    </div>
  )
}
