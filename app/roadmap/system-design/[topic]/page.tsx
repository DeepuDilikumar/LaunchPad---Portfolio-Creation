import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { JsonLd } from "@/components/site/JsonLd";
import { ProgressProvider } from "@/components/roadmap/ProgressContext";
import { TopicBody } from "@/components/roadmap/TopicBody";
import { WhyPill } from "@/components/roadmap/RoadmapExplorer";
import { buildRoadmapView } from "@/lib/roadmap/view";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

/** One indexable page per topic, so every concept can rank on its own. */
export function generateStaticParams() {
  return buildRoadmapView()
    .topics.filter((t) => t.visible)
    .map((t) => ({ topic: t.id }));
}

function find(id: string) {
  const view = buildRoadmapView();
  const i = view.topics.findIndex((t) => t.id === id);
  if (i < 0 || !view.topics[i].visible) return null;
  return {
    view,
    t: view.topics[i],
    prev: view.topics[i - 1] ?? null,
    next: view.topics[i + 1] ?? null,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const f = find((await params).topic);
  if (!f) return {};
  return pageMetadata({
    title: `${f.t.title}: system design interview questions`,
    description: `${f.t.summary.slice(0, 150)}…`,
    path: f.t.href,
    type: "article",
    og: {
      title: f.t.title,
      kicker: `system design roadmap · ${f.t.sectionTitle.toLowerCase()}`,
      note: f.t.whyHere.slice(0, 58),
    },
  });
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const f = find((await params).topic);
  if (!f) notFound();
  const { t, prev, next, view } = f;
  const nextWhy =
    next && next.sectionId !== t.sectionId
      ? (view.sections.find((s) => s.id === next.sectionId)?.why ?? null)
      : null;
  const free = t.free[0];
  return (
    <>
      <SiteHeader active="roadmap" />
      <main id="main" className="mx-auto flex max-w-[760px] flex-col gap-5 px-4 py-12 sm:px-6">
        <span className="label">
          <Link href="/roadmap/system-design" className="text-muted no-underline">
            roadmap
          </Link>{" "}
          / {String(t.sectionNumber).padStart(2, "0")} · {t.sectionTitle.toLowerCase()}
        </span>
        <h1 className="h-display m-0 text-[clamp(34px,5vw,50px)]">{t.title}</h1>
        <ProgressProvider>
          <TopicBody
            t={t}
            next={next ? { title: next.title, why: nextWhy, href: next.href } : undefined}
          />
        </ProgressProvider>
        <div className="border-rule flex flex-wrap items-center justify-between gap-3 border-t border-dashed pt-4 text-[15px]">
          {prev ? <Link href={prev.href}>← {prev.title}</Link> : <span />}
          <Link href="/roadmap/system-design" className="font-semibold">
            See it on the map
          </Link>
        </div>
        {nextWhy ? (
          <div className="flex justify-center">
            <WhyPill text={nextWhy} />
          </div>
        ) : null}
      </main>
      <SiteFooter />
      {free ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: free.text,
                acceptedAnswer: { "@type": "Answer", text: free.moves.join(" ") },
              },
            ],
          }}
        />
      ) : null}
    </>
  );
}
