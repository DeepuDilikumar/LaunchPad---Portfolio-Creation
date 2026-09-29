/**
 * THE single source of truth for LaunchPad prices and what each plan includes.
 * Change a price here and every surface (landing, paywall, checkout, receipts) follows.
 *
 * Amounts are integers in paise (₹1 = 100 paise), the unit Razorpay expects.
 * The server always prices orders from this file, never from client input.
 */

export type ProductKey = "free" | "report" | "program" | "bundle"

/** What a paid product unlocks. `bundle` grants both. */
export type Entitlement = "report" | "program"

export type Plan = {
  key: ProductKey
  name: string
  /** Paise. 0 for free. */
  amountPaise: number
  /** Short line under the price. */
  tagline: string
  /** What you get, in plain language. Keep each under ~60 characters. */
  features: string[]
  entitlements: Entitlement[]
  /** Visually highlighted on pricing surfaces. At most one plan. */
  highlight?: string
}

export const CURRENCY = "INR" as const

export const PLANS: readonly Plan[] = [
  {
    key: "free",
    name: "Free",
    amountPaise: 0,
    tagline: "See where you stand",
    features: [
      "Live portfolio site from your resume",
      "Your overall profile score",
      "1 of 5 diagnostic pillars, fully explained",
    ],
    entitlements: [],
  },
  {
    key: "report",
    name: "Full report",
    amountPaise: 299_00,
    tagline: "Know exactly what to fix",
    features: [
      "All 5 pillars, with how each was scored",
      "Specific fixes for every weak spot",
      "ATS-friendly resume rewrite",
      "Download as PDF and LaTeX (Overleaf-ready)",
    ],
    entitlements: ["report"],
  },
  {
    key: "program",
    name: "14-Day Build Program",
    amountPaise: 799_00,
    tagline: "Build one project that stands out",
    features: [
      "5 project options matched to your target role",
      "GitHub repo with a starter scaffold",
      "Daily tasks with hints and a mentor chat",
      "Streak tracker verified by your real commits",
      "Interview defense prep + LinkedIn post drafts",
    ],
    entitlements: ["program"],
  },
  {
    key: "bundle",
    name: "Report + Program",
    amountPaise: 999_00,
    tagline: "Everything, for less",
    features: [
      "Everything in Full report",
      "Everything in the 14-Day Build Program",
    ],
    entitlements: ["report", "program"],
    highlight: "Best value",
  },
] as const

/** Shown next to every price and pay button. */
export const PAYMENT_NOTE = "One-time payment · UPI, cards and netbanking"

/**
 * Refund line shown near every pay button.
 * TODO(owner): confirm the refund policy before launch.
 */
export const REFUND_LINE = "Not useful? Full refund within 7 days."

export function getPlan(key: ProductKey): Plan {
  const plan = PLANS.find((p) => p.key === key)
  if (!plan) throw new Error(`Unknown plan: ${key}`)
  return plan
}

/** Formats paise as rupees for display, e.g. 99900 → "₹999", 0 → "₹0". */
export function formatPrice(amountPaise: number): string {
  const rupees = amountPaise / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: CURRENCY,
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  }).format(rupees)
}

/** How much the bundle saves versus buying the report and program separately. */
export function bundleSavingsPaise(): number {
  return (
    getPlan("report").amountPaise +
    getPlan("program").amountPaise -
    getPlan("bundle").amountPaise
  )
}
