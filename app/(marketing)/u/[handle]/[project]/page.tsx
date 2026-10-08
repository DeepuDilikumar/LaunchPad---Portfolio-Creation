import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/content/catalog";
import { getPublicPack } from "@/lib/public-profile";
import { getSessionUser } from "@/lib/auth/session";
import { checkLabels, type CheckId } from "@/lib/verify";
import { AccentAvatar, StatusChip } from "@/components/ui/pill";
import { CopyButton } from "@/components/ui/copy-button";
import { IconArrowUpRight } from "@/components/ui/icons";
import { SafeMarkdown } from "@/components/proof/safe-markdown";
import { ProfileViewed } from "@/components/proof/profile-view";
import { Diagram } from "@/components/notebook/cells/interactive";

type Params = { handle: string; project: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { handle, project } = await params;
  const data = await getPublicPack(handle, project);
  const p = getProject(project);
  if (!data || !p || !data.profile.isPublic) return { title: "Not found", robots: { index: false } };
  const name = data.profile.name || `@${data.profile.handle}`;
  return {
    title: `${p.name} by ${name}`,
    description: `${p.title}. ${data.pack.metrics.slice(0, 2).map((m) => `${m.label}: ${m.value}`).join(" · ")}`,
    alternates: { canonical: `/u/${data.profile.handle}/${project}` },
    robots: data.profile.handle === "sample" ? { index: false } : undefined,
  };
}

export default async function ProofPublicPage({ params }: { params: Promise<Params> }) {
  const { handle, project } = await params;
  const data = await getPublicPack(handle, project);
  const p = getProject(project);
  if (!data || !p) notFound();
  const viewer = await getSessionUser();
  const isOwner = viewer?.id === data.profile.userId;
  if (!data.profile.isPublic && !isOwner) notFound();
  const { profile, pack, featured } = data;
  const name = profile.name || `@${profile.handle}`;
  const checks = pack.checks as Partial<Record<CheckId, { ok: boolean; at: string }>>;

  return (
    <div className="container-bp max-w-[860px] pb-24 pt-28 md:pt-36">
      {!isOwner ? <ProfileViewed handle={profile.handle} project={project} /> : null}
      {profile.handle === "sample" ? (
        <p className="mb-6 rounded-[14px] border border-dashed border-line-strong px-4 py-3 t-small text-text-2">
          Sample page with fictional data. It isn&apos;t a real learner and it isn&apos;t verified.
        </p>
      ) : null}
      <Link href={`/u/${profile.handle}`} className="t-small text-text-2 hover:text-text-1">
        ← {name}
      </Link>
      <header className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <AccentAvatar color={p.accent} label={p.name} size={44} />
          <div>
            <h1 className="t-h2 text-text-1">{p.name}</h1>
            <p className="t-body text-text-2">{p.title}</p>
          </div>
        </div>
        {pack.verified ? (
          <span data-verified-badge>
            <StatusChip status="passed">Verified build</StatusChip>
          </span>
        ) : null}
      </header>

      <div className="mt-6 flex flex-wrap gap-3">
        {pack.liveUrl ? (
          <a href={pack.liveUrl} target="_blank" rel="noreferrer noopener nofollow" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-invert px-[18px] text-[15px] font-medium text-invert-text">
            Live demo <IconArrowUpRight size={14} />
          </a>
        ) : null}
        {pack.repoUrl ? (
          <a href={pack.repoUrl} target="_blank" rel="noreferrer noopener nofollow" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-[18px] text-[15px] font-medium text-text-1">
            Repo <IconArrowUpRight size={14} />
          </a>
        ) : null}
        {pack.bullets.length ? <CopyButton text={pack.bullets.map((b) => `• ${b}`).join("\n")} label="Copy resume bullets" variant="pill" /> : null}
      </div>

      {pack.metrics.length ? (
        <dl className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {pack.metrics.map((m) => (
            <div key={m.label} className="rounded-[18px] border border-line bg-surface-1 p-4">
              <dt className="t-small text-text-2">{m.label}</dt>
              <dd className="mt-1 font-mono text-[15px] text-text-1">{m.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {pack.architecture ? (
        <section aria-labelledby="arch" className="mt-10">
          <h2 id="arch" className="t-h3 text-text-1">
            Architecture
          </h2>
          <div className="mt-4">
            <Diagram id="architecture" chart={pack.architecture} caption={`${p.name} architecture`} />
          </div>
        </section>
      ) : null}

      {featured.length ? (
        <section aria-labelledby="featured" className="mt-10">
          <h2 id="featured" className="t-h3 text-text-1">
            Decisions
          </h2>
          <ul className="mt-4 space-y-3">
            {featured.map((d) => (
              <li key={d.id} className="whitespace-pre-wrap rounded-[18px] border border-line bg-surface-1 p-4 t-body text-text-1">
                {d.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {pack.caseStudyMd ? (
        <section aria-labelledby="case" className="mt-10">
          <h2 id="case" className="t-h3 text-text-1">
            Case study
          </h2>
          <div className="mt-4">
            <SafeMarkdown source={pack.caseStudyMd} />
          </div>
        </section>
      ) : null}

      {pack.bullets.length ? (
        <section aria-labelledby="bullets" className="mt-10">
          <h2 id="bullets" className="t-h3 text-text-1">
            Resume bullets
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 t-body text-text-2">
            {pack.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="verification" className="mt-10 rounded-[20px] border border-line bg-surface-1 p-5">
        <h2 id="verification" className="t-h3 text-text-1">
          Verification
        </h2>
        {Object.keys(checks).length === 0 ? (
          <p className="mt-2 t-small text-text-2">Not verified.</p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {(Object.keys(checkLabels) as CheckId[]).map((id) => (
              <li key={id} className="flex items-center gap-2 t-small text-text-2">
                <span aria-hidden className="size-1.5 rounded-full" style={{ background: checks[id]?.ok ? "var(--status-passed)" : "var(--status-failed)" }} />
                {checkLabels[id]}
                <span className="sr-only">{checks[id]?.ok ? "passed" : "not passed"}</span>
                {checks[id]?.at ? <span className="text-text-3">· {new Date(checks[id]!.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
