"use client";

import { Caret } from "@/components/ui/caret";
import { LinkButton } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { track } from "@/lib/analytics/client";
import dynamic from "next/dynamic";
import { useSignedIn } from "@/lib/auth/signed-in-flag";

// The demo is below the fold on phones; load its code after the headline.
const HeroDemo = dynamic(() => import("@/components/demos/hero-demo").then((m) => m.HeroDemo), {
  ssr: false,
  loading: () => <div className="h-[488px] rounded-[16px] border border-line bg-surface-1 md:h-[548px]" />,
});

export function Hero() {
  const signedIn = useSignedIn();
  return (
    <section className="relative pt-32 md:pt-40" aria-labelledby="hero-title">
      <div className="container-bp text-center">
        <Pill href="/projects/pulse" className="mx-auto">
          New: build a real-time messenger <span aria-hidden>↗</span>
        </Pill>
        <h1 id="hero-title" className="t-hero mx-auto mt-6 max-w-[880px] text-text-1">
          Build what big tech runs
          <span className="ml-2 inline-block align-[-0.06em] md:ml-3">
            <Caret size={56} intro track className="h-[34px] w-auto md:h-[52px]" />
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] t-body text-text-2">
          Hands-on notebooks that take you through six production-grade apps with Claude Code or Codex. Then turn each one into proof that gets you hired.
        </p>
        <div id="hero-ctas" className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <LinkButton
            href={signedIn ? "/dashboard" : "/login?next=/learn/foundations/setup-agents"}
            data-cta="hero-start"
            onClick={() => track("hero_cta_click", { cta: "start_free" })}
          >
            Start free
          </LinkButton>
          <LinkButton href="/projects" variant="secondary" onClick={() => track("hero_cta_click", { cta: "see_projects" })}>
            See the projects
          </LinkButton>
        </div>
      </div>
      <div className="container-bp mt-14 md:mt-20">
        <HeroDemo />
      </div>
    </section>
  );
}
