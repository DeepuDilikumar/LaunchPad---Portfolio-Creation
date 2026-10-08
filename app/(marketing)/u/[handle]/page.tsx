import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/content/catalog";
import { getPublicProfile } from "@/lib/public-profile";
import { getSessionUser } from "@/lib/auth/session";
import { AccentAvatar, StatusChip } from "@/components/ui/pill";
import { CopyButton } from "@/components/ui/copy-button";
import { IconGithub, IconArrowUpRight } from "@/components/ui/icons";
import { ProfileViewed } from "@/components/proof/profile-view";

type Params = { handle: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data || !data.profile.isPublic) return { title: "Profile not found", robots: { index: false } };
  const name = data.profile.name || `@${data.profile.handle}`;
  return {
    title: `${name} · build record`,
    description: data.profile.headline || `${name}'s verified projects, numbers and engineering decisions.`,
    alternates: { canonical: `/u/${data.profile.handle}` },
    robots: data.profile.handle === "sample" ? { index: false } : undefined,
  };
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data) notFound();
  const viewer = await getSessionUser();
  const isOwner = viewer?.id === data.profile.userId;
  if (!data.profile.isPublic && !isOwner) notFound();
  const { profile, packs, decisions } = data;
  const name = profile.name || `@${profile.handle}`;
  const allBullets = packs.flatMap((p) => p.bullets);
  const featured = decisions.filter((d) => packs.some((p) => p.featuredDecisionIds.includes(d.id))).slice(0, 3);

  return (
    <div className="container-bp max-w-[960px] pb-24 pt-28 md:pt-36">
      {!isOwner ? <ProfileViewed handle={profile.handle} /> : null}
      {profile.handle === "sample" ? (
        <p className="mb-6 rounded-[14px] border border-dashed border-line-strong px-4 py-3 t-small text-text-2" data-sample-banner>
          This is a sample profile with fictional data, so you can see what a proof page looks like. It isn&apos;t a real learner.
        </p>
      ) : null}
      {!profile.isPublic && isOwner ? (
        <p className="mb-6 rounded-[14px] border border-line bg-surface-1 px-4 py-3 t-small text-text-1">
          Your profile is private. Only you can see this page. Turn on Public profile in <Link href="/settings" className="underline">Settings</Link>.
        </p>
      ) : null}

      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <span className="inline-flex size-16 items-center justify-center rounded-full bg-surface-3 text-[24px] text-text-1">{name.replace("@", "").slice(0, 1).toUpperCase()}</span>
          <div>
            <h1 className="t-h2 text-text-1">{name}</h1>
            {profile.headline ? <p className="mt-1 t-body text-text-2">{profile.headline}</p> : null}
            <div className="mt-2 flex flex-wrap gap-3 t-small text-text-2">
              {profile.githubUsername ? (
                <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1.5 hover:text-text-1">
                  <IconGithub size={14} /> {profile.githubUsername}
                </a>
              ) : null}
              <span>
                {packs.length} published {packs.length === 1 ? "project" : "projects"}
              </span>
            </div>
          </div>
        </div>
        {allBullets.length ? <CopyButton text={allBullets.map((b) => `• ${b}`).join("\n")} label="Copy resume bullets" variant="pill" data-copy="resume-bullets" /> : null}
      </header>

      <section aria-labelledby="projects" className="mt-12">
        <h2 id="projects" className="sr-only">
          Projects
        </h2>
        {packs.length === 0 ? (
          <p className="rounded-[20px] border border-line bg-surface-1 p-6 t-body text-text-2">No published projects yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {packs.map((pk) => {
              const p = getProject(pk.project);
              if (!p) return null;
              return (
                <article key={pk.id} className="flex flex-col rounded-[24px] border border-line bg-surface-1 p-5 md:p-6" data-project-card={pk.project}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <AccentAvatar color={p.accent} label={p.name} size={30} />
                      <div>
                        <h3 className="t-h3 text-text-1">{p.name}</h3>
                        <p className="t-small text-text-2">{p.title}</p>
                      </div>
                    </div>
                    {pk.verified ? (
                      <span data-verified-badge>
                        <StatusChip status="passed">Verified build</StatusChip>
                      </span>
                    ) : null}
                  </div>
                  {pk.metrics.length ? (
                    <dl className="mt-5 grid grid-cols-3 gap-3">
                      {pk.metrics.slice(0, 3).map((m) => (
                        <div key={m.label}>
                          <dt className="text-[11.5px] leading-4 text-text-3">{m.label}</dt>
                          <dd className="mt-1 font-mono text-[13px] text-text-1">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-4 pt-5 t-small">
                    {pk.liveUrl ? (
                      <a href={pk.liveUrl} target="_blank" rel="noreferrer noopener nofollow" className="inline-flex items-center gap-1 text-text-1 hover:underline">
                        Live demo <IconArrowUpRight size={12} />
                      </a>
                    ) : null}
                    {pk.repoUrl ? (
                      <a href={pk.repoUrl} target="_blank" rel="noreferrer noopener nofollow" className="inline-flex items-center gap-1 text-text-1 hover:underline">
                        Repo <IconArrowUpRight size={12} />
                      </a>
                    ) : null}
                    <Link href={`/u/${profile.handle}/${pk.project}`} className="text-text-2 hover:text-text-1">
                      Case study
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {featured.length ? (
        <section aria-labelledby="decisions" className="mt-12">
          <h2 id="decisions" className="t-h3 text-text-1">
            Featured decisions
          </h2>
          <ul className="mt-4 space-y-3">
            {featured.map((d) => (
              <li key={d.id} className="rounded-[20px] border border-line bg-surface-1 p-4">
                <p className="t-small text-text-3">{getProject(d.project)?.name}</p>
                <p className="mt-1 whitespace-pre-wrap t-body text-text-1">{d.text}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
