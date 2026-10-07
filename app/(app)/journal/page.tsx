import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import { catalog, getCatalogModule, getProject } from "@/content/catalog";
import { getModule } from "@/lib/content";
import { AppHeader } from "@/components/app/app-header";
import { LinkButton } from "@/components/ui/button";
import { JournalList } from "./journal-list";

export const metadata: Metadata = { title: "Build journal", robots: { index: false } };

export default async function JournalPage() {
  const user = await requireUser("/journal");
  const db = await getDb();
  const rows = await db.select().from(schema.decisions).where(eq(schema.decisions.userId, user.id)).orderBy(desc(schema.decisions.updatedAt));
  const entries = rows
    .filter((r) => r.text.trim())
    .map((r) => {
      const cell = getModule(r.project, r.module)?.cells.find((c) => c.id === r.cellId);
      return {
        id: r.id,
        project: r.project,
        projectName: getProject(r.project)?.name ?? r.project,
        accent: getProject(r.project)?.accent ?? "#E7E7E7",
        moduleTitle: getCatalogModule(r.project, r.module)?.title ?? r.module,
        question: cell?.label.replace(/^Decision:\s*/, "") ?? "",
        href: `/learn/${r.project}/${r.module}#cell-${r.cellId}`,
        text: r.text,
        isPublic: r.isPublic,
        updatedAt: r.updatedAt.toISOString(),
      };
    });
  const projects = catalog.filter((p) => entries.some((e) => e.project === p.slug)).map((p) => ({ slug: p.slug, name: p.name }));

  return (
    <>
      <AppHeader user={user} />
      <main id="main" className="container-bp max-w-[860px] pb-24 pt-10 md:pt-14">
        <h1 className="t-h2 text-text-1">Build journal</h1>
        <p className="mt-3 t-body text-text-2">
          Every decision you write in a module: what the agent proposed, and what you kept, rejected or changed. Public entries can be featured on your proof pages.
        </p>
        {entries.length === 0 ? (
          <div className="mt-10 rounded-[24px] border border-line bg-surface-1 p-6">
            <p className="t-h3 text-text-1">No decisions yet</p>
            <p className="mt-1 t-body text-text-2">Your first one is at the end of Foundations, module 1.</p>
            <LinkButton href="/learn/foundations/setup-agents#cell-decision-instructions" className="mt-5">
              Start Foundations
            </LinkButton>
          </div>
        ) : (
          <JournalList entries={entries} projects={projects} />
        )}
      </main>
    </>
  );
}
