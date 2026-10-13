import {
  currentPrice,
  getProduct,
  products,
  site,
  isLaunchActive,
  type Product,
} from "@/config/site";
import { loadGuide, previewDrafts, publishedQuestions } from "./content/load";
import { followUpRange, siteCounts } from "./content/stats";

/** A guide is on sale only when it's marked available and has reviewed questions to deliver. */
export function productOnSale(slug: string): boolean {
  const p = getProduct(slug);
  if (!p || p.status !== "available") return false;
  return p.guides.every((g) => siteCounts(g).questions > 0);
}

export interface PriceInfo {
  price: number;
  regular: number;
  launch: boolean;
  launchEndsLabel: string;
  perQuestion: string | null;
}

export function priceInfo(product: Product, now = new Date()): PriceInfo {
  const price = currentPrice(product, now);
  const counts = product.guides.length === 1 ? siteCounts(product.guides[0]) : null;
  const perQuestion =
    counts && counts.questions > 0
      ? (price / counts.questions).toFixed(2).replace(/\.00$/, "")
      : null;
  return {
    price,
    regular: product.price,
    launch: product.launchPrice !== undefined && isLaunchActive(now) && price < product.price,
    launchEndsLabel: site.launch.label,
    perQuestion,
  };
}

export function guideFacts(slug: string) {
  const counts = siteCounts(slug);
  const meta = loadGuide(slug).meta;
  return {
    ...counts,
    followUpRange: followUpRange(counts),
    title: meta.title,
    modulesList: meta.modules,
    preview: previewDrafts(),
  };
}

export function visibleProducts(): Product[] {
  return products.filter((p) => p.status !== "hidden");
}

export function demoQuestion(slug: string) {
  const { meta } = loadGuide(slug);
  const q = publishedQuestions(slug).find((x) => x.id === meta.demo.question);
  if (!q) return null;
  return { q, demo: meta.demo };
}

export function sampleQuestions(slug: string) {
  const { meta } = loadGuide(slug);
  const published = publishedQuestions(slug);
  return meta.samples
    .map((id) => published.find((q) => q.id === id))
    .filter((q): q is NonNullable<typeof q> => Boolean(q));
}
