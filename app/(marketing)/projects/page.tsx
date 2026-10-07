import type { Metadata } from "next";
import Link from "next/link";
import { catalog } from "@/content/catalog";
import { projectSummaries } from "@/lib/content";
import { AccentAvatar } from "@/components/ui/pill";
import { IconArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Projects",
  description: "Foundations plus six production-grade projects: a messenger, payments, short video, ride-hailing, collaborative docs and an AI answer engine.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <div className="container-bp pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-[680px] text-center">
        <h1 className="t-hero text-text-1">The projects</h1>
        <p className="mt-5 t-body text-text-2">
          Start with Foundations, then pick any project. Each one is a real system with real constraints, built one module at a time, from spec to load test to proof.
        </p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {catalog.map((p) => {
          const mods = projectSummaries(p.slug);
          const published = mods.filter((m) => m.status === "published").length;
          const free = mods.filter((m) => m.free).length;
          const hours = Math.round(mods.reduce((a, m) => a + m.minutes, 0) / 60);
          return (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="group flex flex-col rounded-[24px] border border-line bg-surface-1 p-5 transition-colors hover:bg-surface-2 md:p-8"
            >
              <div className="flex items-center gap-3">
                <AccentAvatar color={p.accent} label={p.name} size={32} />
                <div>
                  <p className="t-small text-text-2">{p.kind === "track" ? "Track 0 · free" : `Project ${p.number}`}</p>
                  <h2 className="t-h3 text-text-1">{p.name}</h2>
                </div>
              </div>
              <p className="mt-5 t-body text-text-1">{p.title}</p>
              <p className="mt-1.5 t-body text-text-2">{p.tagline}</p>
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 t-small text-text-2">
                <span>{mods.length} modules</span>
                <span>About {hours} hours</span>
                {free ? <span>{free === mods.length ? "Free" : `${free} free modules`}</span> : null}
                {published < mods.length ? <span>{published === 0 ? "Releasing soon" : `${published} published`}</span> : null}
              </div>
              <span className="mt-6 inline-flex items-center gap-1.5 t-small text-text-1">
                View the syllabus <IconArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
