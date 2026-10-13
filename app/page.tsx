import Link from "next/link";
import { formatInr, getProduct, site } from "@/config/site";
import { AuthorCard } from "@/components/site/AuthorCard";
import { JsonLd } from "@/components/site/JsonLd";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { BundleCard } from "@/components/product/BundleCard";
import { Faq } from "@/components/product/Faq";
import { FollowUpDemo } from "@/components/product/FollowUpDemo";
import { HeroVisual } from "@/components/product/HeroVisual";
import { PriceBlock } from "@/components/product/PriceBlock";
import { RehearseVsAsk } from "@/components/product/RehearseVsAsk";
import { ReviewList } from "@/components/product/ReviewList";
import { homeFaq } from "@/content/faq";
import { demoQuestion, guideFacts, priceInfo, productOnSale, sampleQuestions } from "@/lib/catalog";
import { publishedReviews } from "@/lib/reviews";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: `${site.name}: answer the follow-up, not just the question`,
  description: site.description,
  path: "/",
  og: { title: "Answer the follow-up, not just the question." },
});

export default async function Home() {
  const flagship = getProduct("backend")!;
  const bundle = getProduct("switch-kit")!;
  const facts = guideFacts("backend");
  const onSale = productOnSale("backend");
  const price = priceInfo(flagship);
  const demo = demoQuestion("backend");
  const samples = sampleQuestions("backend").slice(1, 4);
  const reviews = (await publishedReviews("backend")).slice(0, 4);
  const hasContent = facts.questions > 0;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section
          id="hero"
          className="mx-auto flex max-w-[1160px] flex-wrap items-center gap-14 px-4 pt-12 pb-16 sm:px-6 sm:pt-16"
        >
          <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5">
            <span className="label">// for engineers switching jobs · 2–8 yrs experience</span>
            <h1 className="h-display m-0 text-[clamp(40px,5.4vw,64px)]">
              Answer the <span className="marker">follow-up</span>, not just the question.
            </h1>
            <p className="text-body m-0 max-w-[540px] text-[19px] leading-relaxed">
              You answered fine. Then the interviewer asked “why?”, and it went quiet. This guide
              drills the questions that come next:{" "}
              {hasContent
                ? `${facts.questions} backend questions, each with ${facts.followUpRange} follow-ups,`
                : "backend questions, each with its follow-ups,"}{" "}
              what they test, and what a strong answer has that a rehearsed one doesn’t.
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              {onSale ? (
                <Link href="/guides/backend#buy" className="keycap">
                  Get the guide · {formatInr(price.price)}
                </Link>
              ) : (
                <Link href="/guides/backend" className="keycap">
                  See the guide
                </Link>
              )}
              <Link href="/check" className="keycap-ghost">
                Take the free 2-min check
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-muted font-mono text-xs">
                PDF · A4 + phone edition · {site.delivery.promise.toLowerCase()}
              </span>
              {price.perQuestion ? (
                <span className="hand text-red -rotate-3 text-2xl">
                  that’s ₹{price.perQuestion} a question
                </span>
              ) : null}
            </div>
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

        {hasContent ? (
          <section className="border-chip bg-card/75 border-y-[1.5px] border-dashed">
            <div className="mx-auto flex max-w-[1160px] flex-wrap gap-x-8 gap-y-5 px-4 py-6 sm:px-6">
              {[
                [String(facts.questions), `backend questions across ${facts.modules} modules`],
                [facts.followUpRange, "follow-ups on every question, tagged by type"],
                ["2", "editions: A4 for laptops, phone for commutes"],
                [String(site.delivery.updatesMonths), "months of free updates by email"],
              ].map(([n, t]) => (
                <div key={t} className="flex flex-[1_1_200px] items-baseline gap-2.5">
                  <span className="h-display text-[34px] whitespace-nowrap">{n}</span>
                  <span className="text-body text-sm leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto flex max-w-[1160px] flex-col gap-9 px-4 py-20 sm:px-6">
          <div className="flex max-w-[760px] flex-col gap-3">
            <span className="label">// where interviews actually go quiet</span>
            <h2 className="h-section m-0">
              Everyone rehearses the first answer.{" "}
              <span className="marker">The second question</span> decides the offer.
            </h2>
          </div>
          <RehearseVsAsk />
          <p className="text-body m-0 max-w-[720px] text-[17px] leading-relaxed">
            The guide drills exactly this: every question comes with the follow-ups that come next,
            what each one tests, and how a strong answer handles it.
          </p>
        </section>

        {demo ? (
          <section className="mx-auto flex max-w-[900px] flex-col gap-5 px-4 pb-20 sm:px-6">
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
              ctaHref="/guides/backend#buy"
              ctaLabel={
                onSale
                  ? `Get all ${facts.questions} questions · ${formatInr(price.price)}`
                  : "See the guide"
              }
            />
          </section>
        ) : null}

        {samples.length ? (
          <section className="border-ink bg-card/75 border-y-[1.5px]">
            <div className="mx-auto flex max-w-[1160px] flex-col gap-8 px-4 py-20 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2.5">
                  <span className="label">// real pages, not promises</span>
                  <h2 className="h-section m-0">Read pages before you pay.</h2>
                </div>
                <Link
                  href="/guides/backend#pages"
                  className="inline-flex min-h-11 items-center font-semibold no-underline"
                >
                  Open the page viewer →
                </Link>
              </div>
              <div className="flex flex-wrap gap-6">
                {samples.map((q, i) => (
                  <Link
                    key={q.id}
                    href="/guides/backend#pages"
                    className={`paper-sheet text-ink hover:text-ink flex min-h-[280px] min-w-0 flex-[1_1_280px] flex-col gap-3 p-5 no-underline ${["-rotate-1", "rotate-[0.8deg]", "-rotate-[0.5deg]"][i % 3]}`}
                  >
                    <span className="text-faint font-mono text-[10px] tracking-[0.06em]">
                      MODULE {String(q.moduleNumber).padStart(2, "0")} · {q.label}
                    </span>
                    <span className="font-head text-lg leading-tight font-bold">{q.title}</span>
                    <span className="bg-blue-wash rounded-md px-2 py-1.5 text-xs leading-snug">
                      Tests: {q.intent}
                    </span>
                    <span className="text-xs leading-snug">
                      <span className="decoration-red line-through decoration-2">
                        “{q.weak_answer}”
                      </span>{" "}
                      {q.red_note ? (
                        <span className="hand text-red text-[17px]">{q.red_note}</span>
                      ) : null}
                    </span>
                    <span className="text-body text-xs">
                      {q.follow_ups.length} follow-ups · strong answer in{" "}
                      {q.answer_framework.length} moves
                    </span>
                    <span className="text-blue mt-auto font-mono text-xs font-semibold">
                      tap to read →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section
          id="offer"
          className="mx-auto flex max-w-[1160px] flex-col gap-7 px-4 py-20 sm:px-6"
        >
          <div className="flex flex-wrap items-center gap-12">
            <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-4">
              <span className="label">// the offer</span>
              <h2 className="h-section m-0">
                One guide. Every follow-up. {formatInr(price.price)}.
              </h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0 text-[16.5px]">
                {[
                  hasContent
                    ? `${facts.questions} questions across ${facts.modules} modules`
                    : "Questions across 12 modules",
                  hasContent
                    ? `${facts.followUpRange} follow-ups each, with what they test`
                    : "Follow-ups on every question, with what they test",
                  "A4 edition and a phone edition",
                  `Free updates for ${site.delivery.updatesMonths} months`,
                  site.refund.policy,
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <Check />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0 flex-[1_1_400px]">
              <PriceBlock product={flagship} onSale={onSale} />
            </div>
          </div>
          <BundleCard bundle={bundle} variant="strip" />
        </section>

        <section id="author" className="mx-auto max-w-[1160px] px-4 pb-20 sm:px-6">
          <AuthorCard />
        </section>

        <section className="mx-auto flex max-w-[1160px] flex-col gap-6 px-4 pb-4 sm:px-6">
          <h2 className="h-section m-0">From buyers</h2>
          <ReviewList reviews={reviews} />
        </section>

        <Faq items={homeFaq} />
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          url: site.url,
          email: site.support.email,
          founder: site.author.named ? { "@type": "Person", name: site.author.name } : undefined,
        }}
      />
    </>
  );
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2E7A4B"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M4 13l5 5 11-12" />
    </svg>
  );
}
