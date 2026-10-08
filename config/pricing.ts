/**
 * Every price and plan detail lives here. Components and the server read from this file;
 * the client never sends an amount.
 */
export type Currency = "INR" | "USD";

export type ProductSlug = "pro-project" | "pro-all" | "review";

export interface Product {
  slug: ProductSlug;
  kind: "project" | "bundle" | "review";
  name: string;
  /** Smallest currency unit (paise / cents). */
  price: Record<Currency, number>;
  /** Entitlement scope granted on purchase. `project:*` is resolved at checkout. */
  grants: "project" | "all" | "all+review";
}

export const products: Record<ProductSlug, Product> = {
  "pro-project": {
    slug: "pro-project",
    kind: "project",
    name: "Pro · one project",
    price: { INR: 1_499_00, USD: 25_00 },
    grants: "project",
  },
  "pro-all": {
    slug: "pro-all",
    kind: "bundle",
    name: "Pro · all six",
    price: { INR: 3_999_00, USD: 59_00 },
    grants: "all",
  },
  review: {
    slug: "review",
    kind: "review",
    name: "Pro + Review",
    price: { INR: 9_999_00, USD: 149_00 },
    grants: "all+review",
  },
};

export interface Plan {
  id: "free" | "pro" | "review";
  name: string;
  cta: string;
  /** Products shown on this card. Pro has a toggle between two. */
  products: ProductSlug[];
  toggleLabels?: string[];
  includes: string[];
}

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    cta: "Start free",
    products: [],
    includes: ["Foundations track", "Pulse modules 0–2", "Public profile"],
  },
  {
    id: "pro",
    name: "Pro",
    cta: "Get Pro",
    products: ["pro-project", "pro-all"],
    toggleLabels: ["One project", "All six"],
    includes: [
      "Lifetime access",
      "All updates",
      "AI tutor (fair-use daily limit)",
      "Proof pages with verification",
    ],
  },
  {
    id: "review",
    name: "Pro + Review",
    cta: "Apply for Review",
    products: ["review"],
    includes: [
      "Everything in Pro, all six projects",
      "A code review on each project from a working engineer",
      "One mock system-design interview",
    ],
  },
];

export const pricingConfig = {
  defaultCurrency: "USD" as Currency,
  /** Country codes that get INR pricing. */
  inrCountries: ["IN"],
  note: "Prices include GST. Refunds within 7 days if you've completed less than 20% of a project.",
  refund: {
    days: 7,
    maxCompletionPercent: 20,
    faq: "Yes. Ask within 7 days of purchase and you get a full refund, as long as you've completed less than 20% of the project you bought.",
  },
  review: {
    /** Seats per month. `remainingSeats` is only shown when it's a real number from the admin. */
    seatsPerMonth: 10,
    remainingSeats: null as number | null,
  },
  tutor: {
    /** USD per million tokens for the admin cost estimate. Update when ANTHROPIC_MODEL changes. */
    costPerMTok: { input: 4, output: 20 },
    dailyLimit: { free: 10, pro: 60 },
    maxOutputTokens: 1200,
    maxInputChars: 8000,
  },
} as const;

export function formatPrice(amountMinor: number, currency: Currency): string {
  const major = amountMinor / 100;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: major % 1 === 0 ? 0 : 2,
  }).format(major);
}
