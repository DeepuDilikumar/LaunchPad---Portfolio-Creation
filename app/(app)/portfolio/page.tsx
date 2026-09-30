import { ArrowRight, LayoutTemplate } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { PortfolioEditor } from "@/components/portfolio/portfolio-editor"
import { StatePanel } from "@/components/shared/state-panel"
import { buttonVariants } from "@/components/ui/button"
import { requireUser } from "@/lib/auth/session"
import { getPortfolioForUser } from "@/lib/data/portfolios"
import { siteUrl } from "@/lib/env"
import { getProgramBadge } from "@/lib/program/badge"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Your portfolio", robots: { index: false } }

export default async function PortfolioPage() {
  const user = await requireUser("/portfolio")
  const row = await getPortfolioForUser(user.id)

  if (!row) {
    return (
      <div className="px-4 py-16">
        <StatePanel
          icon={LayoutTemplate}
          title="You haven't published a portfolio yet"
          action={
            <Link href="/start" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              Create my portfolio
              <ArrowRight aria-hidden />
            </Link>
          }
        >
          <p>Upload your resume and we&apos;ll build it for you. It takes about 2 minutes.</p>
        </StatePanel>
      </div>
    )
  }

  const badge = await getProgramBadge(user.id)
  return (
    <PortfolioEditor
      initial={row.content}
      slug={row.slug}
      url={`${siteUrl()}/p/${row.slug}`}
      initiallyPublished={row.is_published}
      badge={badge}
    />
  )
}
