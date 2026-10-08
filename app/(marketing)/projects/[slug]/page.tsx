import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, getProject } from "@/content/catalog";
import { projectSummaries } from "@/lib/content";
import { site } from "@/config/site";
import { products } from "@/config/pricing";
import { AccentAvatar } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { IconLock } from "@/components/ui/icons";
import { LaptopFrame, PhoneFrame } from "@/components/ui/card";
import { projectScreens } from "@/components/demos/project-screens";

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: `${p.name}: ${p.title}`,
    description: p.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: { title: `${p.name}: ${p.title}`, description: p.description },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) notFound();
  const mods = projectSummaries(slug);
  const first = mods.find((m) => m.status === "published") ?? mods[0]!;
  const totalMinutes = mods.reduce((a, m) => a + m.minutes, 0);
  const Screen = projectScreens[p.slug];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${p.name}: ${p.title}`,
    description: p.description,
    url: `${site.url}/projects/${slug}`,
    provider: { "@type": "Organization", name: site.name, sameAs: site.url },
    isAccessibleForFree: p.kind === "track",
    educationalLevel: "Intermediate",
    teaches: p.hardParts,
    timeRequired: `PT${Math.round(totalMinutes / 60)}H`,
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online", courseWorkload: `PT${Math.round(totalMinutes / 60)}H` },
    offers:
      p.kind === "track"
        ? { "@type": "Offer", price: 0, priceCurrency: "USD", category: "Free" }
        : { "@type": "Offer", price: products["pro-project"].price.USD / 100, priceCurrency: "USD", category: "Paid" },
    syllabusSections: mods.map((m) => ({ "@type": "Syllabus", name: `Module ${m.order}: ${m.title}`, description: m.summary ?? m.objectives.join(". ") })),
  };

  return (
    <div className="container-bp pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-[760px] text-center">
        <div className="flex justify-center">
          <AccentAvatar color={p.accent} label={p.name} size={40} />
        </div>
        <p className="mt-5 t-small text-text-2">{p.kind === "track" ? "Track 0 · free" : `Project ${p.number}`}</p>
        <h1 className="mt-2 t-hero text-text-1">{p.name}</h1>
        <p className="mt-3 t-h3 font-normal text-text-1">{p.title}</p>
        <p className="mx-auto mt-4 max-w-[620px] t-body text-text-2">{p.description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href={`/learn/${slug}/${first.slug}`}>{first.free ? "Start the free modules" : "Read module 0"}</LinkButton>
          {p.kind === "project" ? (
            <LinkButton href="/pricing" variant="secondary">
              See pricing
            </LinkButton>
          ) : null}
        </div>
      </div>

      <div className="mt-16 flex justify-center">
        {p.frame === "phone" ? (
          <PhoneFrame label={`${p.name} app preview`}>
            <Screen />
          </PhoneFrame>
        ) : (
          <LaptopFrame label={`${p.name} app preview`}>
            <Screen />
          </LaptopFrame>
        )}
      </div>

      <div className="mx-auto mt-20 grid max-w-[1000px] gap-10 md:grid-cols-[1fr_300px]">
        <section aria-labelledby="syllabus">
          <h2 id="syllabus" className="t-h2 text-text-1">
            Syllabus
          </h2>
          <p className="mt-2 t-small text-text-2">
            {mods.length} modules · about {Math.round(totalMinutes / 60)} hours
          </p>
          <ol className="mt-8 divide-y divide-line border-y border-line">
            {mods.map((m) => (
              <li key={m.slug}>
                <Link href={`/learn/${slug}/${m.slug}`} className="group flex gap-4 py-5">
                  <span className="w-6 shrink-0 pt-0.5 t-small text-text-3">{m.order}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="t-h3 text-text-1 group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{m.title}</h3>
                      {m.free ? <span className="rounded-full bg-surface-2 px-2 py-0.5 t-badge text-text-1">Free</span> : null}
                      {m.status === "outline" ? <span className="rounded-full bg-surface-2 px-2 py-0.5 t-badge text-text-2">Releasing soon</span> : null}
                      {!m.free ? <IconLock size={13} className="text-text-3" aria-label="Paid" /> : null}
                    </div>
                    {m.summary ? <p className="mt-1.5 t-small text-text-2">{m.summary}</p> : null}
                    <ul className="mt-2 space-y-1">
                      {m.objectives.map((o) => (
                        <li key={o} className="t-small text-text-2">
                          · {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className="shrink-0 t-small text-text-3">{m.minutes} min</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
        <aside className="space-y-6">
          <div className="rounded-[24px] border border-line bg-surface-1 p-5">
            <h2 className="t-h3 text-text-1">The hard parts</h2>
            <ul className="mt-3 space-y-1.5">
              {p.hardParts.map((h) => (
                <li key={h} className="t-small text-text-2">
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] border border-line bg-surface-1 p-5">
            <h2 className="t-h3 text-text-1">Interview topics</h2>
            <ul className="mt-3 space-y-1.5">
              {p.interviewTopics.map((h) => (
                <li key={h} className="t-small text-text-2">
                  {h}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] border border-line bg-surface-1 p-5">
            <h2 className="t-h3 text-text-1">Stack</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.stack.map((s) => (
                <span key={s} className="rounded-full bg-surface-2 px-2.5 py-1 t-badge text-text-1">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </div>
  );
}
