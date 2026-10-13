import { notFound } from "next/navigation";
import Link from "next/link";
import { formatInr, getProduct, site } from "@/config/site";
import { QuestionPage } from "@/components/guide/QuestionPage";
import { AuthorCard } from "@/components/site/AuthorCard";
import { JsonLd } from "@/components/site/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { BundleCard } from "@/components/product/BundleCard";
import { Faq } from "@/components/product/Faq";
import { FitList } from "@/components/product/FitList";
import { FollowUpDemo } from "@/components/product/FollowUpDemo";
import { HeroVisual } from "@/components/product/HeroVisual";
import { ModuleList } from "@/components/product/ModuleList";
import { PageViewer } from "@/components/product/PageViewer";
import { PriceBlock } from "@/components/product/PriceBlock";
import { ReviewList } from "@/components/product/ReviewList";
import { SamplePages } from "@/components/product/SamplePages";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { WaitlistForm } from "@/components/product/WaitlistForm";
import { productFaq } from "@/content/faq";
import { listGuideSlugs } from "@/lib/content/load";
import {
  demoQuestion,
  guideFacts,
  priceInfo,
  productOnSale,
  sampleQuestions,
  visibleProducts,
} from "@/lib/catalog";
import { previewImages } from "@/lib/previews";
import { publishedReviews } from "@/lib/reviews";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return visibleProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  const hasGuide = listGuideSlugs().includes(slug);
  const facts = hasGuide ? guideFacts(slug) : null;
  const description =
    facts && facts.questions > 0
      ? `${facts.questions} backend interview questions, each with ${facts.followUpRange} follow-ups, what they test, and a strong answer. For engineers with 2–8 years switching jobs.`
      : product.tagline;
  return pageMetadata({
    title: product.name,
    description,
    path: `/guides/${slug}`,
    og: {
      title: product.name,
      kicker: `guides / ${slug}`,
      note: product.status === "available" ? "read real pages before you pay" : "coming next",
    },
  });
}

const tagShort: Record<string, string> = {
  "payments-and-idempotency": "payments",
  "queues-and-async": "queues",
  "databases-and-transactions": "databases",
};

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product || product.status === "hidden") notFound();
  if (!listGuideSlugs().includes(slug)) return <ComingSoon slug={slug} />;

  const facts = guideFacts(slug);
  const onSale = productOnSale(slug);
  const price = priceInfo(product);
  const demo = demoQuestion(slug);
  const samples = sampleQuestions(slug);
  const images = previewImages(slug);
  const reviews = await publishedReviews(slug);
  const bundle = getProduct("switch-kit")!;
  const priceNote = price.launch
    ? `${formatInr(price.regular)} after ${price.launchEndsLabel}`
    : "incl. GST";

  return (
    <>
      <SiteHeader active="guides" />
      <main id="main">
        <section
          id="hero"
          className="mx-auto flex max-w-[1160px] flex-wrap items-start gap-14 px-4 pt-12 pb-16 sm:px-6 sm:pt-14"
        >
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
            <span className="label">
              <Link href="/guides" className="text-muted no-underline">
                guides
              </Link>{" "}
              / {slug} / v{facts.version}
            </span>
            <h1 className="h-display m-0 text-[clamp(40px,5vw,60px)]">{product.name}</h1>
            <p className="text-body m-0 text-[19px] leading-relaxed">
              {facts.questions > 0
                ? `${facts.questions} backend interview questions. Each one comes with the ${facts.followUpRange} follow-ups that come next, what they test, and a strong answer in a few moves.`
                : product.tagline}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="chip">{facts.modulesList.length} modules</span>
              <span className="chip">A4 + phone edition</span>
              <span className="chip">language-agnostic</span>
              <span className="chip">{site.delivery.updatesMonths} months of updates</span>
            </div>
            <div id="buy" className="mt-1.5 scroll-mt-6">
              <PriceBlock product={product} onSale={onSale} />
            </div>
            {samples.length ? (
              <a
                href="#pages"
                className="inline-flex min-h-11 items-center text-base font-semibold no-underline"
              >
                Read {samples.length} full pages first ↓
              </a>
            ) : null}
          </div>
          {demo ? (
            <HeroVisual
              q={demo.q}
              phoneFollowUp={demo.demo.followUpIndex}
              guideTitle={facts.title}
              version={facts.version}
            />
          ) : null}
        </section>

        {demo ? (
          <section
            id="demo"
            className="mx-auto flex max-w-[900px] flex-col gap-5 px-4 pb-20 sm:px-6"
          >
            <div className="flex flex-col gap-2.5">
              <span className="label">// try it live</span>
              <h2 className="h-section m-0">Can you handle the second question?</h2>
              <span className="hand text-red -rotate-[1.5deg] self-start text-2xl">
                pick how you’d start, then watch them push back
              </span>
            </div>
            <FollowUpDemo
              label={demo.q.label}
              question={demo.q.title}
              options={demo.demo.options}
              followUp={demo.q.follow_ups[demo.demo.followUpIndex]}
              rejectionSignal={demo.q.rejection_signals[demo.q.rejection_signals.length - 1]}
              ctaHref="#buy"
              ctaLabel={
                onSale
                  ? `Get all ${facts.questions} questions · ${formatInr(price.price)}`
                  : "See what’s inside"
              }
            />
          </section>
        ) : null}

        {samples.length ? (
          <section id="pages" className="border-ink bg-card/75 scroll-mt-4 border-y-[1.5px]">
            <div className="mx-auto flex max-w-[1160px] flex-col gap-8 px-4 py-20 sm:px-6">
              <div className="flex flex-col gap-2.5">
                <span className="label">// page viewer</span>
                <h2 className="h-section m-0">Read real pages before you pay.</h2>
                <p className="text-body m-0 text-[17px]">
                  Pick a page. This is exactly what’s in the PDF.
                </p>
              </div>
              <PageViewer
                pages={samples.map((q) => ({
                  id: q.id,
                  label: q.label,
                  tag: tagShort[q.module] ?? q.module,
                  short: q.title,
                }))}
                moreNote={
                  facts.questions > samples.length
                    ? `${facts.questions - samples.length} more where these came from`
                    : undefined
                }
              >
                {samples.map((q) => (
                  <QuestionPage
                    key={q.id}
                    q={q}
                    guideTitle={facts.title}
                    version={facts.version}
                    footer="stamped for you@email.com"
                    showDraftMark={facts.preview}
                  />
                ))}
              </PageViewer>
              {images.length ? (
                <div className="flex flex-col gap-3">
                  <span className="label">
                    // {images.length} pages from the PDF · tap to open full screen
                  </span>
                  <SamplePages images={images} />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="mx-auto flex max-w-[1160px] flex-wrap items-stretch gap-7 px-4 py-20 sm:px-6">
          <ModuleList modules={facts.modulesList} counts={facts} />
          <FitList />
        </section>

        <section className="mx-auto max-w-[1160px] px-4 pb-20 sm:px-6">
          <AuthorCard variant="product" />
        </section>

        <section className="mx-auto flex max-w-[1160px] flex-col gap-6 px-4 pb-20 sm:px-6">
          <h2 className="h-section m-0">From buyers</h2>
          <ReviewList reviews={reviews} />
        </section>

        <section className="bg-ink text-paper">
          <div className="mx-auto flex max-w-[1160px] flex-col gap-8 px-4 py-20 sm:px-6">
            <div className="flex flex-col gap-2.5">
              <span className="font-mono text-[13px] text-[#BDB4A0]">// pick your prep</span>
              <h2 className="h-section text-card m-0">
                Less than one dinner out.{" "}
                <span className="text-marker">Prep for the round that sets your salary.</span>
              </h2>
            </div>
            <div className="flex flex-wrap items-stretch gap-6">
              <div className="text-ink min-w-0 flex-[1_1_360px] [&>div]:max-w-none [&>div]:shadow-[8px_8px_0_var(--marker)]">
                <PriceBlock product={product} onSale={onSale} compact />
              </div>
              <BundleCard bundle={bundle} />
            </div>
          </div>
        </section>

        <Faq items={productFaq} title="Before you buy" />
      </main>
      <SiteFooter />
      {onSale ? <StickyBuyBar price={formatInr(price.price)} note={priceNote} /> : null}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.tagline,
          sku: product.slug,
          brand: { "@type": "Brand", name: site.name },
          image: absoluteUrl(`/og?title=${encodeURIComponent(product.name)}`),
          url: absoluteUrl(`/guides/${slug}`),
          offers: {
            "@type": "Offer",
            price: price.price,
            priceCurrency: "INR",
            availability: onSale ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
            url: absoluteUrl(`/guides/${slug}`),
            ...(price.launch ? { priceValidUntil: site.launch.endsAt.slice(0, 10) } : {}),
          },
          ...(reviews.length
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: (reviews.reduce((n, r) => n + r.rating, 0) / reviews.length).toFixed(
                    1,
                  ),
                  reviewCount: reviews.length,
                },
              }
            : {}),
        }}
      />
    </>
  );
}

function ComingSoon({ slug }: { slug: string }) {
  const product = getProduct(slug)!;
  return (
    <>
      <SiteHeader active="guides" />
      <main id="main" className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 py-20 sm:px-6">
        <span className="label">
          <Link href="/guides" className="text-muted no-underline">
            guides
          </Link>{" "}
          / {slug}
        </span>
        <h1 className="h-display m-0 text-[clamp(38px,5vw,56px)]">{product.name}</h1>
        <span className="stamp self-start">COMING NEXT</span>
        <p className="text-body m-0 text-[19px] leading-relaxed">{product.tagline}</p>
        {product.extras?.map((x) => (
          <p key={x} className="text-body m-0 text-base">
            Includes: {x}
          </p>
        ))}
        <p className="text-body m-0 text-base">
          Planned price: <strong>{formatInr(product.price)}</strong>, GST included. One email when
          it’s out; nothing else.
        </p>
        <WaitlistForm product={slug} />
        <Link href="/guides/backend" className="font-semibold">
          Available now: Backend Switch Guide →
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
