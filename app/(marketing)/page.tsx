import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { Card } from "@/components/ui/card";
import { Caret } from "@/components/ui/caret";
import { LinkButton } from "@/components/ui/button";
import { CheckpointDemo, JournalDemo, PromptTabsDemo, TutorDemo } from "@/components/demos/feature-demos";
import { ProjectSwitcher } from "@/components/marketing/project-switcher";
import { ProofPreview } from "@/components/marketing/proof-preview";
import { VideoCard } from "@/components/marketing/video-card";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { Faq, faqItems } from "@/components/marketing/faq";
import { LandingView, StartFreeButton } from "@/components/marketing/landing-view";
import { site } from "@/config/site";
import { features } from "@/config/features";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const featureCards = [
  {
    title: "Prompts for the agent you use",
    body: "Every prompt has a Claude Code and a Codex version, written for how each one plans, edits, and runs commands.",
    Demo: PromptTabsDemo,
  },
  {
    title: "Checkpoints that prove it runs",
    body: "Run the command and check the result. Move on when tests pass, the load test holds, or the deploy is live.",
    Demo: CheckpointDemo,
  },
  {
    title: "A build journal hiring managers read",
    body: "Each decision you make goes into a journal: what you kept, what you rejected, what you changed. It becomes your case study.",
    Demo: JournalDemo,
  },
  {
    title: "A tutor that knows where you are",
    body: "Stuck? Ask in context. The tutor sees your module, your step, and the error you pasted.",
    Demo: TutorDemo,
  },
];

function SectionHeading({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-[680px] text-center">
      <h2 id={id} className="t-h2 text-text-1">
        {title}
      </h2>
      {sub ? <p className="mt-4 t-body text-text-2">{sub}</p> : null}
    </div>
  );
}

export default function LandingPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: typeof f.a === "string" ? f.a : (f.text ?? "") },
    })),
  };

  return (
    <>
      <LandingView />
      <Hero />

      {/* S2 */}
      <section className="section-y" aria-labelledby="s2-title">
        <div className="container-bp">
          <Card className="relative min-h-[360px] overflow-hidden md:min-h-[420px] md:p-14">
            <div className="relative z-10 max-w-[520px]">
              <h2 id="s2-title" className="t-h2 text-text-1">
                Learn like you&apos;re already on the team
              </h2>
              <p className="mt-4 t-body text-text-2">
                Every module reads like a senior engineer pairing with you: what to build, the exact prompt for your agent, what you should see, and what to do when the agent gets it wrong.
              </p>
            </div>
            <div className="absolute -bottom-28 right-4 md:-bottom-36 md:right-20">
              <Caret size={340} track className="h-[260px] w-auto md:h-[400px]" />
            </div>
          </Card>
        </div>
      </section>

      {/* S3 */}
      <section className="section-y" aria-labelledby="s3-title">
        <div className="container-bp">
          <SectionHeading
            id="s3-title"
            title="Six apps, one system at a time"
            sub="Each project is a real system with real constraints: concurrency, money, video, maps, collaboration, AI. You direct the agent. You own the result."
          />
          <div className="mt-12 grid gap-4 md:mt-16 md:grid-cols-2">
            {featureCards.map(({ title, body, Demo }) => (
              <Card key={title} className="flex flex-col gap-6">
                <Demo />
                <div>
                  <h3 className="t-h3 text-text-1">{title}</h3>
                  <p className="mt-2 t-body text-text-2">{body}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* S4 */}
      <section className="section-y" aria-labelledby="s4-title">
        <div className="container-bp">
          <SectionHeading id="s4-title" title="Pick your first build" />
          <div className="mt-10">
            <ProjectSwitcher />
          </div>
        </div>
      </section>

      {/* S5 */}
      <section className="section-y" aria-labelledby="s5-title">
        <div className="container-bp">
          <SectionHeading
            id="s5-title"
            title="Your work, as proof"
            sub="Finish a project and publish a proof page: live demo, repo, architecture, test and load numbers, and the decisions you made. Link it from your resume. It shows what a certificate can't."
          />
          <div className="mt-12 md:mt-16">
            <ProofPreview />
          </div>
          {/* TODO(proof): learner stories go here once real, consented examples exist. Renders nothing. */}
        </div>
      </section>

      {/* S6 */}
      {features.landingVideo && site.video.src ? (
        <section className="section-y" aria-labelledby="s6-title">
          <div className="container-bp">
            <SectionHeading id="s6-title" title={site.video.title} />
            <div className="mt-12">
              <VideoCard src={site.video.src} poster={site.video.poster} captions={site.video.captions} title={site.video.title} />
            </div>
          </div>
        </section>
      ) : null}

      {/* S7 */}
      <section className="section-y" aria-labelledby="s7-title" id="pricing">
        <div className="container-bp">
          <div className="flex flex-col items-center gap-5 text-center">
            <h2 id="s7-title" className="t-h2 text-text-1">
              Pricing
            </h2>
            <LinkButton href="/contact" variant="secondary" size="sm">
              Team or college? Talk to us
            </LinkButton>
          </div>
          <div className="mt-10">
            <PricingCards />
          </div>
        </div>
      </section>

      {/* S8 */}
      <section className="section-y" aria-labelledby="s8-title">
        <div className="container-bp max-w-[860px]">
          <SectionHeading id="s8-title" title="Questions" />
          <div className="mt-10">
            <Faq />
          </div>
        </div>
      </section>

      {/* S9 */}
      <section className="section-y" aria-labelledby="s9-title">
        <div className="container-bp flex flex-col items-center text-center">
          <Caret size={56} track />
          <h2 id="s9-title" className="mt-8 t-h2 text-text-1">
            Start your first build
          </h2>
          <p className="mt-4 t-body text-text-2">Foundations is free. Your first checkpoint takes about ten minutes.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <StartFreeButton />
            <LinkButton href="/projects" variant="secondary">
              See the projects
            </LinkButton>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
