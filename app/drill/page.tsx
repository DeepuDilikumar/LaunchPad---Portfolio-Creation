import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { DrillClient, DrillLogin } from "@/components/drill/DrillClient";
import { publishedQuestions } from "@/lib/content/load";
import { currentDrillUser, hasDrillAccess } from "@/lib/drill";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Follow-up drill",
  description: "Practise answering follow-ups with an AI interviewer.",
  path: "/drill",
  noindex: true,
});

/** Phase 6: the AI follow-up drill. Off unless NEXT_PUBLIC_FEATURE_DRILL=1. */
export default async function DrillPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  if (!site.features.drill) notFound();
  const sp = await searchParams;
  const email = await currentDrillUser();
  const allowed = email ? await hasDrillAccess(email) : false;
  const questions = publishedQuestions("backend").map((q) => ({
    id: q.id,
    label: q.label,
    title: q.title,
    module: q.moduleTitle,
  }));
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto flex max-w-[760px] flex-col gap-6 px-4 py-14 sm:px-6">
        <span className="label">// follow-up drill · beta</span>
        <h1 className="h-display m-0 text-[clamp(34px,5vw,50px)]">
          The follow-ups a <span className="marker">PDF can’t ask</span>.
        </h1>
        <p className="text-body m-0">
          Answer a question. The interviewer pushes back with {site.drill.maxFollowUps} follow-ups
          at most, built on what you said, then scores you and shows the strong answer.{" "}
          {site.drill.dailySessionCap} drills a day.
        </p>
        {sp.error ? (
          <p role="alert" className="text-red-dark m-0">
            That login link has expired. Ask for a new one.
          </p>
        ) : null}
        {allowed ? <DrillClient questions={questions} /> : <DrillLogin />}
      </main>
      <SiteFooter />
    </>
  );
}
