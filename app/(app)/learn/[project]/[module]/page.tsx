import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject } from "@/content/catalog";
import { getModule, nextModule, projectSummaries } from "@/lib/content";
import { teaserSource } from "@/lib/content/parse";
import { MdxContent } from "@/lib/content/render";
import { getSessionUser } from "@/lib/auth/session";
import { activeScopes, canAccess, scopesAllow } from "@/lib/entitlements";
import { getModuleState, getUserProgress, toProgressState } from "@/lib/progress-store";
import { moduleProgress } from "@/lib/progress";
import { NotebookProvider, type Tool } from "@/components/notebook/context";
import { NotebookShell, type RailModule } from "@/components/notebook/shell";
import { NotifyMe, UpgradeCard } from "@/components/notebook/gates";

type Params = { project: string; module: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { project, module } = await params;
  const p = getProject(project);
  const m = getModule(project, module);
  if (!p || !m) return {};
  return {
    title: `${m.frontmatter.title} · ${p.name}`,
    description: m.frontmatter.summary ?? m.frontmatter.objectives.join(". "),
    alternates: { canonical: `/learn/${project}/${module}` },
    robots: m.frontmatter.status === "outline" ? { index: false } : undefined,
  };
}

export default async function LearnPage({ params }: { params: Promise<Params> }) {
  const { project, module } = await params;
  const p = getProject(project);
  const m = getModule(project, module);
  if (!p || !m) notFound();

  const fm = m.frontmatter;
  const user = await getSessionUser();
  const access = await canAccess(user, project, module);
  const outline = fm.status === "outline";

  const summaries = projectSummaries(project);
  const scopes = user ? await activeScopes(user.id) : new Set<string>();
  const projectUnlocked = !!user && (user.isAdmin || scopesAllow(scopes, project));
  const all = user ? await getUserProgress(user.id) : null;
  const rail: RailModule[] = summaries.map((s) => {
    const prog = all ? moduleProgress(s, toProgressState(all.rows, all.decisions, project, s.slug)) : null;
    return {
      slug: s.slug,
      title: s.title,
      order: s.order,
      minutes: s.minutes,
      ratio: prog?.ratio ?? 0,
      complete: prog?.complete ?? false,
      locked: !s.free && !projectUnlocked,
      outline: s.status === "outline",
    };
  });

  const state = user && access ? await getModuleState(user.id, project, module) : { checkpoints: {}, decisions: {}, lastCell: null };
  const nxt = nextModule(project, module);
  const required = m.cells.filter((c) => c.kind === "Checkpoint" && c.required).map((c) => c.id);
  const decisionIds = m.cells.filter((c) => c.kind === "Decision").map((c) => c.id);

  const header = (
    <header className="mb-10">
      <p className="t-small text-text-2">
        {p.name} · Module {fm.order} · {fm.minutes} min
      </p>
      <h1 className="mt-2 t-h2 text-text-1">{fm.title}</h1>
      <ul className="mt-5 space-y-1.5">
        {fm.objectives.map((o) => (
          <li key={o} className="flex gap-2.5 t-small text-text-2">
            <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-text-3" />
            {o}
          </li>
        ))}
      </ul>
    </header>
  );

  let body: React.ReactNode;
  if (!access) {
    // Paid content is never sent to visitors without access: only the first Explain cell.
    body = (
      <div className="space-y-6">
        <MdxContent source={teaserSource(m.body, m.cells)} />
        <UpgradeCard project={project} projectName={p.name} module={module} moduleTitle={fm.title} releasingSoon={outline} />
      </div>
    );
  } else if (outline) {
    body = (
      <div className="space-y-6">
        <MdxContent source={teaserSource(m.body, m.cells)} />
        <div className="rounded-[24px] border border-line bg-surface-1 p-5 md:p-8" data-releasing-soon>
          <p className="t-h3 text-text-1">Releasing soon</p>
          <p className="mt-2 t-body text-text-2">
            We publish a module only after building it end to end with the exact prompts in it. Get an email when this one is ready.
          </p>
          <div className="mt-5">
            <NotifyMe moduleSlug={`${project}/${module}`} signedIn={!!user} />
          </div>
        </div>
      </div>
    );
  } else {
    body = <MdxContent source={m.body} />;
  }

  return (
    <NotebookProvider
      init={{
        project,
        projectName: p.name,
        module,
        moduleTitle: fm.title,
        moduleOrder: fm.order,
        user: user ? { id: user.id, handle: user.profile.handle, preferredTool: user.profile.preferredTool as Tool } : null,
        checkpoints: state.checkpoints,
        decisions: state.decisions,
        requiredCheckpoints: access && !outline ? required : [],
        decisionIds: access && !outline ? decisionIds : [],
        lastCell: state.lastCell,
      }}
    >
      <NotebookShell
        accent={p.accent}
        rail={rail}
        locked={!access || outline}
        next={nxt ? { href: `/learn/${project}/${nxt.slug}`, title: `Module ${nxt.order} · ${nxt.title}` } : null}
      >
        {header}
        <div className="space-y-6">{body}</div>
      </NotebookShell>
    </NotebookProvider>
  );
}
