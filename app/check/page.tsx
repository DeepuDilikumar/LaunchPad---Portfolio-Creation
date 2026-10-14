import Link from "next/link";
import { formatInr, getProduct, site } from "@/config/site";
import { Logo } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { QuizEngine } from "@/components/check/QuizEngine";
import { priceInfo, productOnSale } from "@/lib/catalog";
import { loadQuiz } from "@/lib/quiz-data";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Free Readiness Check",
  description:
    "Eight real backend follow-up questions. Find your weakest area in about two minutes. Your score shows straight away, no email needed.",
  path: "/check",
  og: {
    title: "Find your weakest follow-up area before the interviewer does.",
    kicker: "readiness check · free · 2 min",
  },
});

export default function CheckPage() {
  const quiz = loadQuiz("backend");
  const product = getProduct("backend")!;
  const p = priceInfo(product);
  return (
    <>
      <header className="border-ink bg-paper border-b-[1.5px]">
        <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />
          <span className="text-muted font-mono text-xs">readiness check · free · 2 min</span>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[720px] px-4 pt-12 pb-20 sm:px-6">
        <QuizEngine
          quiz={quiz}
          guideHref="/guides/backend?utm_source=check&utm_medium=result"
          priceLabel={formatInr(p.price)}
          priceNote={p.launch ? `${formatInr(p.regular)} after ${p.launchEndsLabel}` : "incl. GST"}
          onSale={productOnSale("backend")}
        />
        <p className="text-muted mt-10 text-sm">
          The check uses questions from the Backend Switch Guide. Answers you submit are stored
          without your email unless you ask for the report. See <Link href="/privacy">privacy</Link>
          . Questions? {site.support.email}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
