export const SITE = {
  name: "LaunchPad",
  /** Used for metadata, OG tags and absolute links. Set NEXT_PUBLIC_SITE_URL in each environment. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  title: "LaunchPad — Your resume, live as a portfolio in 2 minutes",
  description:
    "Upload your resume and get a live portfolio in 2 minutes. See exactly why you're not clearing product-company screens, then build one real project in 14 days.",
} as const

/** Primary CTA destination (Feature B upload flow). */
export const START_HREF = "/start"

export const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#samples", label: "Samples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
] as const
