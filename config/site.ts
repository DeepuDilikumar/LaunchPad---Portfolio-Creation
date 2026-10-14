/**
 * Single source of truth for brand, prices, launch dates, support and business details.
 * Every page, email and API route reads from here. Values marked `PENDING:` are decisions or
 * business details that still need confirming; `pnpm preflight` fails while any remain.
 */

export type ProductStatus = "available" | "coming-soon" | "hidden";

export interface Product {
  slug: string;
  name: string;
  shortName: string;
  /** Guide slugs delivered by this product. A bigger bundle always contains every smaller one. */
  guides: string[];
  /** Regular price in rupees, GST included. */
  price: number;
  /** Optional real launch price; only charged before `site.launch.endsAt`. */
  launchPrice?: number;
  status: ProductStatus;
  tagline: string;
  extras?: string[];
}

export const site = {
  name: "secondquestion",
  logoMark: "Q2",
  domain: "secondquestion.in",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://secondquestion.in",
  description:
    "Backend interview guides built around the follow-up questions, for engineers with 2–8 years of experience who are switching jobs.",
  locale: "en_IN",

  author: {
    named: true,
    name: "Deepu",
    role: "backend engineer · payments and distributed systems",
    linkedin: "PENDING: LinkedIn profile URL",
    photo: null as string | null,
    bio: [
      "I wrote these guides because the second question is where interviews are decided, and almost nobody practises it.",
      "Every page is one I would want to read the week before my own loop. I review each question myself before it ships, and I fix anything you report within a week.",
    ],
  },

  support: {
    email: "support@secondquestion.in",
    responseTime: "replies within 1 business day",
  },

  business: {
    legalName: "PENDING: registered business name",
    address: "PENDING: business address",
    city: "Trivandrum, Kerala",
    gstin: null as string | null,
    grievanceOfficer: "PENDING: grievance officer name",
  },

  social: {
    instagram: "PENDING: Instagram URL",
    linkedin: "PENDING: LinkedIn page URL",
  },

  /** Real launch window. The launch price ends at `endsAt` and never resets. */
  launch: {
    startsAt: "2026-11-08T00:00:00+05:30",
    endsAt: "2026-11-15T23:59:59+05:30",
    label: "15 Nov",
  },

  refund: {
    days: 7,
    policy: "7-day refund on your first guide",
  },

  delivery: {
    linkHours: 24,
    maxDownloads: 5,
    updatesMonths: 12,
    promise: "PDF in your inbox in 2 min",
  },

  referral: {
    enabled: true,
    friendDiscount: 100,
    buyerReward: 100,
  },

  features: {
    drill: process.env.NEXT_PUBLIC_FEATURE_DRILL === "1",
  },

  drill: {
    passDays: 90,
    dailySessionCap: 5,
    maxFollowUps: 4,
    model: process.env.DRILL_MODEL ?? "claude-opus-5-5",
    monthlyBudgetInr: 3000,
  },
} as const;

export const products: Product[] = [
  {
    slug: "backend",
    name: "Backend Switch Guide",
    shortName: "Backend guide",
    guides: ["backend"],
    price: 499,
    launchPrice: 349,
    status: "available",
    tagline: "Backend interview questions with the follow-ups that come next.",
  },
  {
    slug: "system-design",
    name: "System Design Follow-Ups",
    shortName: "System design guide",
    guides: ["system-design"],
    price: 499,
    status: "coming-soon",
    tagline: "HLD and LLD problems, each built around the follow-ups.",
  },
  {
    slug: "switch-kit",
    name: "Switch Kit",
    shortName: "Switch Kit",
    guides: ["backend", "system-design", "switch-playbook"],
    price: 999,
    status: "coming-soon",
    tagline: "Both guides plus a short switch playbook.",
    extras: ["Switch playbook: notice period, offer comparison, negotiation"],
  },
  {
    slug: "drill-pass",
    name: "Drill Pass",
    shortName: "Drill Pass",
    guides: ["backend", "system-design", "switch-playbook"],
    price: 1499,
    status: "hidden",
    tagline: "AI follow-up drill for 90 days, plus every guide.",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function isLaunchActive(now: Date = new Date()): boolean {
  const start = new Date(site.launch.startsAt).getTime();
  const end = new Date(site.launch.endsAt).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}

/** The price charged right now, in rupees. The page and the order API both call this. */
export function currentPrice(product: Product, now: Date = new Date()): number {
  if (product.launchPrice !== undefined && isLaunchActive(now)) return product.launchPrice;
  return product.price;
}

export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
