import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { catalog, getCatalogModule, getProject } from "@/content/catalog";
import { projectSummaries } from "@/lib/content";
import { requireUser } from "@/lib/auth/session";
import { activeScopes, scopesAllow } from "@/lib/entitlements";
import { getUserProgress, toProgressState } from "@/lib/progress-store";
import { moduleProgress, streakDays } from "@/lib/progress";
import { features } from "@/config/features";
import { AppHeader } from "@/components/app/app-header";
import { AccentAvatar } from "@/components/ui/pill";
import { LinkButton } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { IconLock } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  if (!user.profile.onboardedAt) redirect("/onboarding?next=/dashboard");
  const { rows, decisions } = await getUserProgress(user.id);
  const scopes = await activeScopes(user.id);

  // Most recent activity decides "Continue".
  const activity = [
    ...rows.filter((r) => r.kind !== "milestone").map((r) => ({ project: r.project, module: r.module, at: r.updatedAt })),
    ...decisions.map((d) => ({ project: d.project, module: d.module, at: d.updatedAt })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
  const last = activity.find((a) => getCatalogModule(a.project, a.module));

  const projectsView = catalog.map((p) => {
    const summaries = projectSummaries(p.slug).filter((m) => m.status === "published");
    let done = 0;
    let total = 0;
    for (const m of summaries) {
      const pr = moduleProgress(m, toProgressState(rows, decisions, p.slug, m.slug));
      done += pr.done;
      total += pr.total;
    }
    const unlocked = p.kind === "track" || user.isAdmin || scopesAllow(scopes, p.slug);
    return { p, ratio: total ? done / total : 0, done, total, unlocked, published: summaries.length };
  });

  let cont: { href: string; label: string; ratio: number; accent: string; projectName: string } | null = null;
  if (last) {
    const p = getProject(last.project)!;
    const m = getCatalogModule(last.project, last.module)!;
    const summary = projectSummaries(last.project).find((s) => s.slug === last.module);
    const pr = summary ? moduleProgress(summary, toProgressState(rows, decisions, last.project, last.module)) : null;
    cont = {
      href: `/learn/${p.slug}/${m.slug}`,
      label: `${p.name} · Module ${m.order} · ${m.title}`,
      ratio: pr?.ratio ?? 0,
      accent: p.accent,
      projectName: p.name,
    };
  }

  const passedDates = rows
    .filter((r) => r.kind === "checkpoint" && r.status === "passed")
    .map((r) => new Date(typeof r.payload.passedAt === "string" ? r.payload.passedAt : r.updatedAt));
  const streak = streakDays(passedDates);
  const recent = decisions.filter((d) => d.text.trim().length > 0).slice(0, 4);
  const firstName = (user.profile.name || "").split(" ")[0];

  return (
    <>
      <AppHeader user={user} />
      <main id="main" className="container-bp pb-24 pt-10 md:pt-14">
        <h1 className="t-h2 text-text-1">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>

        <section aria-label="Continue" className="mt-8">
          {cont ? (
            <div className="flex flex-col gap-6 rounded-[24px] border border-line bg-surface-1 p-5 md:flex-row md:items-center md:p-8" data-continue>
              <AccentAvatar color={cont.accent} label={cont.projectName} size={48} />
              <div className="min-w-0 flex-1">
                <p className="t-small text-text-2">Continue</p>
                <p className="mt-1 t-h3 text-text-1" data-continue-label>
                  {cont.label}
                </p>
                <div className="mt-4 h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(cont.ratio * 100)} aria-label="Module progress">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(4, cont.ratio * 100)}%`, background: cont.accent }} />
                </div>
              </div>
              <LinkButton href={cont.href} className="md:self-center">
                Continue
              </LinkButton>
            </div>
          ) : (
            <div className="flex flex-col gap-5 rounded-[24px] border border-line bg-surface-1 p-5 md:flex-row md:items-center md:p-8" data-continue>
              <div className="flex-1">
                <p className="t-h3 text-text-1">Start with Foundations</p>
                <p className="mt-1 t-body text-text-2">Your first checkpoint takes about ten minutes.</p>
              </div>
              <LinkButton href="/learn/foundations/setup-agents">Start Foundations</LinkButton>
            </div>
          )}
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <section aria-labelledby="projects-title">
            <h2 id="projects-title" className="t-h3 text-text-1">
              Projects
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {projectsView.map(({ p, ratio, unlocked, published, done, total }) => (
                <Link key={p.slug} href={`/projects/${p.slug}`} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface-1 p-4 transition-colors hover:bg-surface-2" data-project={p.slug}>
                  <AccentAvatar color={p.accent} label={p.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="t-small font-medium text-text-1">{p.name}</p>
                    <p className="truncate text-[12px] text-text-2">
                      {published === 0 ? "Releasing soon" : !unlocked ? `${p.modules.filter((m) => m.free).length ? "Free modules available" : "Locked"}` : total ? `${done} of ${total} steps done` : p.title}
                    </p>
                  </div>
                  {!unlocked && !p.modules.some((m) => m.free) ? (
                    <IconLock size={14} className="text-text-3" aria-label="Locked" />
                  ) : (
                    <ProgressRing value={ratio} color={p.accent} size={22} label={`${Math.round(ratio * 100)}% complete`} />
                  )}
                </Link>
              ))}
            </div>
          </section>

          <aside className="space-y-8">
            {projectsView.some((v) => v.p.kind === "project" && v.total > 0 && v.done === v.total) ? (
              <section aria-labelledby="proof-title" className="rounded-[18px] border border-line-strong bg-surface-1 p-4">
                <h2 id="proof-title" className="t-small text-text-2">
                  Ready for a proof pack
                </h2>
                <ul className="mt-2 space-y-2">
                  {projectsView
                    .filter((v) => v.p.kind === "project" && v.total > 0 && v.done === v.total)
                    .map((v) => (
                      <li key={v.p.slug}>
                        <LinkButton href={`/proof/${v.p.slug}`} size="sm" data-proof-link={v.p.slug}>
                          Build your {v.p.name} proof pack
                        </LinkButton>
                      </li>
                    ))}
                </ul>
              </section>
            ) : null}
            {features.streaks ? (
              <section aria-labelledby="streak-title" className="rounded-[18px] border border-line bg-surface-1 p-4">
                <h2 id="streak-title" className="t-small text-text-2">
                  Streak
                </h2>
                <p className="mt-1 t-h3 text-text-1">
                  {streak} {streak === 1 ? "day" : "days"}
                </p>
                <p className="mt-1 t-small text-text-2">Days in a row with a passed checkpoint.</p>
              </section>
            ) : null}
            <section aria-labelledby="recent-title">
              <div className="flex items-center justify-between">
                <h2 id="recent-title" className="t-h3 text-text-1">
                  Recent decisions
                </h2>
                <Link href="/journal" className="t-small text-text-2 hover:text-text-1">
                  Journal
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="mt-3 t-small text-text-2">Decisions you write in modules show up here and in your build journal.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recent.map((d) => (
                    <li key={d.id}>
                      <Link href={`/learn/${d.project}/${d.module}#cell-${d.cellId}`} className="block rounded-[14px] border border-line bg-surface-1 p-3 hover:bg-surface-2">
                        <p className="text-[12px] text-text-3">
                          {getProject(d.project)?.name} · {getCatalogModule(d.project, d.module)?.title}
                        </p>
                        <p className="mt-1 line-clamp-3 t-small text-text-1">{d.text}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
