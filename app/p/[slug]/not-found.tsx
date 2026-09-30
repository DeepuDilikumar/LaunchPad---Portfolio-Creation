import { ArrowRight, UserRoundSearch } from "lucide-react"
import Link from "next/link"

import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function PortfolioNotFound() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-4 py-20">
      <StatePanel
        icon={UserRoundSearch}
        title="This portfolio isn't available"
        action={
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
            Make your own portfolio
            <ArrowRight aria-hidden />
          </Link>
        }
      >
        <p>The link may be mistyped, or the owner has unpublished it.</p>
      </StatePanel>
    </main>
  )
}
