import { ArrowLeft, Compass } from "lucide-react"
import Link from "next/link"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 px-4 py-20 outline-none md:py-28">
        <StatePanel
          icon={Compass}
          title="We couldn't find that page"
          action={
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              <ArrowLeft aria-hidden />
              Go to home
            </Link>
          }
        >
          <p>The link may be old or mistyped. If someone shared a portfolio link, ask them to send it again.</p>
        </StatePanel>
      </main>
      <SiteFooter />
    </>
  )
}
