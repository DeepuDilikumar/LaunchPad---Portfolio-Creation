import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { JsonLd } from "@/components/site/JsonLd";
import { RoadmapExplorer } from "@/components/roadmap/RoadmapExplorer";
import { layoutRoadmap } from "@/lib/roadmap/layout";
import { buildRoadmapView } from "@/lib/roadmap/view";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { site } from "@/config/site";

export const revalidate = 3600;

export const metadata = pageMetadata({
  title: "System Design Roadmap, from first principles",
  description:
    "A free system design roadmap that explains why each topic comes next, and shows what the interviewer asks about it. Progress saves on your device, no login.",
  path: "/roadmap/system-design",
  og: {
    title: "System design, from first principles. And what they ask next.",
    kicker: "the roadmap · free · no login",
    note: "okay, can we make it faster?",
  },
});

export default function RoadmapPage() {
  const { roadmap, sections, topics } = buildRoadmapView("system-design");
  const layout = layoutRoadmap(roadmap);
  return (
    <>
      <SiteHeader active="roadmap" />
      <main id="main" className="pt-8 pb-16">
        <RoadmapExplorer
          title={roadmap.title}
          subtitle={roadmap.subtitle}
          credit={roadmap.credit}
          basePath="/roadmap/system-design"
          layout={layout}
          sections={sections}
          topics={topics}
        />
      </main>
      <SiteFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Course",
          name: "System Design Roadmap",
          description:
            "System design from first principles, with the interview questions for every topic.",
          url: absoluteUrl("/roadmap/system-design"),
          provider: { "@type": "Organization", name: site.name, url: site.url },
          isAccessibleForFree: true,
          hasPart: sections.map((s) => ({
            "@type": "CreativeWork",
            name: s.title,
            position: s.number,
          })),
        }}
      />
    </>
  );
}
