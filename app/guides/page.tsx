import Link from "next/link";
import { formatInr, getProduct } from "@/config/site";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { BundleCard } from "@/components/product/BundleCard";
import { guideFacts, priceInfo, productOnSale, visibleProducts } from "@/lib/catalog";
import { listGuideSlugs } from "@/lib/content/load";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Guides",
  description:
    "Interview guides built around the follow-up questions, for engineers with 2–8 years of experience.",
  path: "/guides",
  og: { title: "Guides built around the follow-up questions", kicker: "guides" },
});

export default function GuidesPage() {
  const guides = visibleProducts().filter((p) => p.guides.length === 1);
  const bundle = getProduct("switch-kit")!;
  const slugs = listGuideSlugs();
  return (
    <>
      <SiteHeader active="guides" />
      <main id="main" className="mx-auto flex max-w-[1160px] flex-col gap-10 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-3">
          <span className="label">// guides</span>
          <h1 className="h-display m-0 text-[clamp(38px,5vw,56px)]">
            Prep for the second question.
          </h1>
        </div>
        <div className="flex flex-wrap gap-6">
          {guides.map((p) => {
            const facts = slugs.includes(p.slug) ? guideFacts(p.slug) : null;
            const onSale = productOnSale(p.slug);
            const price = priceInfo(p);
            return (
              <Link
                key={p.slug}
                href={`/guides/${p.slug}`}
                className="card-ink text-ink hover:text-ink flex min-w-0 flex-[1_1_340px] flex-col gap-3 p-6 no-underline"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold tracking-[0.06em]">
                    {p.name.toUpperCase()}
                  </span>
                  {onSale ? (
                    price.launch ? (
                      <span className="stamp">LAUNCH PRICE</span>
                    ) : null
                  ) : (
                    <span className="stamp">COMING</span>
                  )}
                </div>
                <span className="font-head text-2xl leading-tight font-bold">{p.tagline}</span>
                {facts && facts.questions > 0 ? (
                  <span className="text-muted font-mono text-xs">
                    {facts.questions} questions · {facts.followUpRange} follow-ups each ·{" "}
                    {facts.modules} modules
                  </span>
                ) : null}
                <span className="mt-auto flex items-baseline gap-2">
                  <span className="h-display text-4xl">{formatInr(price.price)}</span>
                  {price.launch ? (
                    <span className="text-body text-sm">
                      {formatInr(price.regular)} after {price.launchEndsLabel}
                    </span>
                  ) : null}
                </span>
                <span className="text-blue font-semibold">
                  {onSale ? "See the guide →" : "Join the waitlist →"}
                </span>
              </Link>
            );
          })}
        </div>
        <BundleCard bundle={bundle} variant="strip" />
      </main>
      <SiteFooter />
    </>
  );
}
