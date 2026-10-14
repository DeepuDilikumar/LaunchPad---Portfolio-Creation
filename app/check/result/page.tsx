import Link from "next/link";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { loadQuiz } from "@/lib/quiz-data";
import { pageMetadata } from "@/lib/seo";

/** Shareable result: the preview image shows the score; the page invites the visitor to take the check. */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const s = Math.max(0, Math.min(8, Number(sp.s) || 0));
  const area = loadQuiz("backend").areas.find((a) => a.id === sp.w);
  const meta = pageMetadata({
    title: `${s} of 8 strong on the Readiness Check`,
    description: "Eight real backend follow-up questions. How many would you get?",
    path: "/check",
    og: { image: `/og/check?s=${s}&t=8${area ? `&w=${area.id}` : ""}` },
    noindex: true,
  });
  return meta;
}

export default async function ResultPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const s = Math.max(0, Math.min(8, Number(sp.s) || 0));
  const area = loadQuiz("backend").areas.find((a) => a.id === sp.w);
  return (
    <>
      <SiteHeader active="check" />
      <main id="main" className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-20 sm:px-6">
        <span className="label">// readiness check result</span>
        <h1 className="h-display m-0 text-[clamp(34px,5vw,50px)]">
          {s} of 8 strong
          {area ? (
            <>
              . Weak spot: <span className="marker">{area.title.toLowerCase()}</span>.
            </>
          ) : (
            "."
          )}
        </h1>
        <p className="text-body m-0 text-lg">
          Eight real backend follow-up questions. About two minutes. How many would you get?
        </p>
        <Link href="/check" className="keycap self-start">
          Take the free check
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
