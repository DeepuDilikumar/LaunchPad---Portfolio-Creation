import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { getProject } from "@/content/catalog";
import { isProjectComplete } from "@/lib/milestones";
import { getOrCreateProofPack, isVerified } from "@/lib/proof";
import { getDb, schema } from "@/lib/db";
import { mock, env } from "@/lib/env";
import { metaTag, checkLabels, type Checks } from "@/lib/verify";
import { projectSummaries } from "@/lib/content";
import { getUserProgress, toProgressState } from "@/lib/progress-store";
import { moduleProgress } from "@/lib/progress";
import { AppHeader } from "@/components/app/app-header";
import { LinkButton } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProofBuilder } from "./builder";

export const metadata: Metadata = { title: "Proof pack", robots: { index: false } };

export default async function ProofPage({ params }: { params: Promise<{ project: string }> }) {
  const { project } = await params;
  const p = getProject(project);
  if (!p || p.kind !== "project") notFound();
  const user = await requireUser(`/proof/${project}`);
  const complete = user.isAdmin || (await isProjectComplete(user.id, project));

  if (!complete) {
    const { rows, decisions } = await getUserProgress(user.id);
    const mods = projectSummaries(project).filter((m) => m.status === "published");
    return (
      <>
        <AppHeader user={user} />
        <main id="main" className="container-bp max-w-[720px] pb-24 pt-10 md:pt-14">
          <h1 className="t-h2 text-text-1">{p.name} proof pack</h1>
          <p className="mt-3 t-body text-text-2">The proof pack builder unlocks when every published module in {p.name} is complete: required checkpoints passed and decisions written.</p>
          <ul className="mt-8 space-y-2">
            {mods.map((m) => {
              const pr = moduleProgress(m, toProgressState(rows, decisions, project, m.slug));
              return (
                <li key={m.slug}>
                  <a href={`/learn/${project}/${m.slug}`} className="flex items-center gap-3 rounded-[14px] border border-line bg-surface-1 p-3.5 hover:bg-surface-2">
                    <ProgressRing value={pr.ratio} color={p.accent} size={20} label={`${Math.round(pr.ratio * 100)}%`} />
                    <span className="flex-1 t-small text-text-1">
                      Module {m.order} · {m.title}
                    </span>
                    <span className="t-small text-text-2">
                      {pr.done}/{pr.total}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          <LinkButton href={`/projects/${project}`} variant="secondary" className="mt-8">
            Back to {p.name}
          </LinkButton>
        </main>
      </>
    );
  }

  const pack = await getOrCreateProofPack(user.id, project);
  const db = await getDb();
  const decisions = await db
    .select()
    .from(schema.decisions)
    .where(and(eq(schema.decisions.userId, user.id), eq(schema.decisions.project, project)));

  return (
    <>
      <AppHeader user={user} />
      <main id="main" className="container-bp max-w-[820px] pb-24 pt-10 md:pt-14">
        <p className="t-small text-text-2">Proof pack</p>
        <h1 className="mt-1 t-h2 text-text-1">{p.name}</h1>
        <ProofBuilder
          project={project}
          projectName={p.name}
          handle={user.profile.handle}
          githubUsername={user.profile.githubUsername}
          mockMode={mock.auth}
          siteUrl={env.siteUrl}
          token={pack.verifyToken}
          metaTag={metaTag(pack.verifyToken)}
          checkLabels={checkLabels}
          initial={{
            repoUrl: pack.repoUrl ?? "",
            liveUrl: pack.liveUrl ?? "",
            metrics: pack.metrics,
            featuredDecisionIds: pack.featuredDecisionIds,
            caseStudyMd: pack.caseStudyMd ?? "",
            bullets: pack.bullets,
            architecture: pack.architecture ?? "",
            checks: pack.checks as Partial<Checks>,
            verified: isVerified(pack),
            publishedAt: pack.publishedAt?.toISOString() ?? null,
          }}
          decisions={decisions
            .filter((d) => d.text.trim().length >= 40)
            .map((d) => ({ id: d.id, text: d.text, isPublic: d.isPublic }))}
        />
      </main>
    </>
  );
}
