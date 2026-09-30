import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { LogoMark } from "@/components/layout/logo"
import { PortfolioView } from "@/components/portfolio/portfolio-view"
import { getPublishedPortfolio } from "@/lib/data/portfolios"
import { getProgramBadge } from "@/lib/program/badge"

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const row = await getPublishedPortfolio(slug)
  if (!row) return { title: "Portfolio not found", robots: { index: false } }
  const { profile, headline, summary } = row.content
  const title = `${profile.fullName} · ${headline}`
  return {
    title: { absolute: title },
    description: summary,
    alternates: { canonical: `/p/${slug}` },
    openGraph: { type: "profile", title, description: summary, url: `/p/${slug}` },
    twitter: { card: "summary_large_image", title, description: summary },
  }
}

/** Public portfolio, server-rendered. */
export default async function PublicPortfolioPage({ params }: PageProps<"/p/[slug]">) {
  const { slug } = await params
  const row = await getPublishedPortfolio(slug)
  if (!row) notFound()
  const badge = await getProgramBadge(row.user_id)

  return (
    <div className="flex min-h-dvh flex-col">
      <main id="main" className="flex-1">
        <PortfolioView content={row.content} badge={badge} />
      </main>
      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-6 text-caption text-muted-foreground sm:px-8">
          <span>© {new Date().getFullYear()} {row.content.profile.fullName}</span>
          <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 hover:text-foreground">
            <LogoMark className="size-4" />
            Made with LaunchPad
          </Link>
        </div>
      </footer>
    </div>
  )
}
