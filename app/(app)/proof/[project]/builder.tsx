"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Field, Input, Textarea } from "@/components/ui/inputs";
import { StatusChip } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Check = { ok: boolean; detail: string; at: string };
type Metric = { label: string; value: string };

interface Initial {
  repoUrl: string;
  liveUrl: string;
  metrics: Metric[];
  featuredDecisionIds: string[];
  caseStudyMd: string;
  bullets: string[];
  architecture: string;
  checks: Partial<Record<string, Check>>;
  verified: boolean;
  publishedAt: string | null;
}

function Step({ n, title, children, done }: { n: number; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <section className="rounded-[24px] border border-line bg-surface-1 p-5 md:p-7" aria-labelledby={`step-${n}`}>
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex size-7 items-center justify-center rounded-full t-badge", done ? "bg-passed text-black" : "bg-surface-3 text-text-1")}>{n}</span>
        <h2 id={`step-${n}`} className="t-h3 text-text-1">
          {title}
        </h2>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export function ProofBuilder({
  project,
  projectName,
  handle,
  githubUsername,
  mockMode,
  siteUrl,
  token,
  metaTag,
  checkLabels,
  initial,
  decisions,
}: {
  project: string;
  projectName: string;
  handle: string;
  githubUsername: string | null;
  mockMode: boolean;
  siteUrl: string;
  token: string;
  metaTag: string;
  checkLabels: Record<string, string>;
  initial: Initial;
  decisions: { id: string; text: string; isPublic: boolean }[];
}) {
  const toast = useToast();
  const [repoUrl, setRepoUrl] = useState(initial.repoUrl);
  const [liveUrl, setLiveUrl] = useState(initial.liveUrl);
  const [checks, setChecks] = useState(initial.checks);
  const [verified, setVerified] = useState(initial.verified);
  const [metrics, setMetrics] = useState<Metric[]>(initial.metrics);
  const [featured, setFeatured] = useState<string[]>(initial.featuredDecisionIds);
  const [caseStudy, setCaseStudy] = useState(initial.caseStudyMd);
  const [bullets, setBullets] = useState<string[]>(initial.bullets);
  const [architecture, setArchitecture] = useState(initial.architecture);
  const [publishedAt, setPublishedAt] = useState(initial.publishedAt);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [generatedNote, setGeneratedNote] = useState<string | null>(null);

  const save = async (extra: Record<string, unknown> = {}, label = "save") => {
    setBusy(label);
    setErr(null);
    const res = await fetch(`/api/proof/${project}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        repoUrl,
        liveUrl,
        metrics: metrics.filter((m) => m.label.trim() && m.value.trim()),
        featuredDecisionIds: featured,
        caseStudyMd: caseStudy,
        bullets: bullets.map((b) => b.trim()).filter(Boolean),
        architecture,
        ...extra,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; issues?: { path: string; message: string }[]; publishedAt?: string | null; verified?: boolean };
    setBusy(null);
    if (!res.ok) {
      setErr(data.issues?.length ? `Check ${data.issues.map((i) => i.path).join(", ")}: ${data.issues[0]!.message}` : (data.error ?? "That didn't save."));
      return false;
    }
    if (data.verified === false && verified) {
      setVerified(false);
      setChecks({});
    }
    if ("publishedAt" in data) setPublishedAt(data.publishedAt ?? null);
    return true;
  };

  const verify = async () => {
    if (!(await save({}, "verify"))) return;
    setBusy("verify");
    const res = await fetch(`/api/proof/${project}/verify`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { checks?: Record<string, Check>; verified?: boolean; error?: string };
    setBusy(null);
    if (!res.ok) return setErr(data.error ?? "Verification didn't run.");
    setChecks(data.checks ?? {});
    setVerified(!!data.verified);
    toast(data.verified ? "All checks passed" : "Some checks need attention", data.verified ? "passed" : "failed");
  };

  const generate = async () => {
    if (!(await save({}, "generate"))) return;
    setBusy("generate");
    const res = await fetch(`/api/proof/${project}/generate`, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { caseStudy?: string; bullets?: string[]; dropped?: number; error?: string };
    setBusy(null);
    if (!res.ok) return setErr(data.error ?? "The draft couldn't be generated.");
    setCaseStudy(data.caseStudy ?? "");
    setBullets(data.bullets ?? []);
    setGeneratedNote(data.dropped ? `${data.dropped} bullet${data.dropped === 1 ? "" : "s"} dropped because it used a number you didn't enter.` : null);
  };

  const publish = async () => {
    if (await save({ publish: true }, "publish")) toast("Published", "passed");
  };

  const publicUrl = `${siteUrl}/u/${handle}/${project}`;
  const publicDecisions = decisions.filter((d) => d.isPublic);

  return (
    <div className="mt-8 space-y-4">
      <Step n={1} title="Link your repo and live URL" done={!!initial.repoUrl && !!initial.liveUrl}>
        <Field label="GitHub repo" htmlFor="pf-repo" hint={githubUsername ? `Must be public and owned by ${githubUsername}.` : undefined}>
          <Input id="pf-repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder={`https://github.com/${githubUsername ?? "you"}/${project}`} />
        </Field>
        {!githubUsername ? (
          <p className="t-small text-text-1">
            Add your GitHub username in <Link href="/settings" className="underline underline-offset-4">Settings</Link> so we can check the repo is yours.
          </p>
        ) : null}
        <Field label="Live URL" htmlFor="pf-live">
          <Input id="pf-live" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://your-app.example.com" />
        </Field>
        <div>
          <p className="t-small text-text-2">Add this tag to the &lt;head&gt; of your live site. It proves you control the deployment.</p>
          <div className="mt-2 flex items-center gap-2 rounded-[12px] border border-line bg-black px-3 py-2">
            <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-text-1">{metaTag}</code>
            <CopyButton text={metaTag} />
          </div>
          {mockMode ? (
            <p className="mt-2 t-small text-text-3">
              Local mock mode: GitHub is simulated (repos ending in -verify-pass pass), and you can use{" "}
              <button type="button" className="underline underline-offset-2" onClick={() => setLiveUrl(`${siteUrl}/api/mock/deploy/${token}`)}>
                a mock deployment URL
              </button>
              .
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void verify()} disabled={!!busy || !repoUrl || !liveUrl} data-action="verify">
            {busy === "verify" ? "Checking…" : "Run verification"}
          </Button>
          {verified ? (
            <span data-verified-badge>
              <StatusChip status="passed">Verified build</StatusChip>
            </span>
          ) : null}
        </div>
        {Object.keys(checks).length ? (
          <ul className="space-y-2" data-checks>
            {Object.entries(checkLabels).map(([id, label]) => {
              const c = checks[id];
              return (
                <li key={id} className="flex items-start gap-3 rounded-[12px] bg-black/30 px-3 py-2.5" data-check={id} data-ok={c?.ok ? "true" : "false"}>
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: c?.ok ? "var(--status-passed)" : "var(--status-failed)" }} />
                  <div className="min-w-0">
                    <p className="t-small text-text-1">{label}</p>
                    <p className="t-small text-text-2">
                      {c?.detail ?? "Not run"}
                      {c?.at ? ` · ${new Date(c.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </p>
                  </div>
                  <span className="sr-only">{c?.ok ? "passed" : "failed"}</span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Step>

      <Step n={2} title="Enter the numbers you measured" done={metrics.length > 0}>
        <p className="t-small text-text-2">Only numbers you measured yourself: p95 latency, load-test users, test count, coverage. Nothing is filled in for you.</p>
        <div className="space-y-2">
          {metrics.map((m, i) => (
            <div key={i} className="flex gap-2">
              <Input aria-label={`Metric ${i + 1} name`} value={m.label} placeholder="p95 latency" onChange={(e) => setMetrics(metrics.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <Input aria-label={`Metric ${i + 1} value`} value={m.value} placeholder="84 ms at 3,000 sockets" onChange={(e) => setMetrics(metrics.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <Button variant="ghost" onClick={() => setMetrics(metrics.filter((_, j) => j !== i))} aria-label={`Remove metric ${i + 1}`}>
                Remove
              </Button>
            </div>
          ))}
        </div>
        {metrics.length < 8 ? (
          <Button variant="secondary" size="sm" onClick={() => setMetrics([...metrics, { label: "", value: "" }])} data-action="add-metric">
            Add a metric
          </Button>
        ) : null}
      </Step>

      <Step n={3} title="Feature up to 3 decisions" done={featured.length > 0}>
        {publicDecisions.length === 0 ? (
          <p className="t-small text-text-2">
            None of your {projectName} decisions are public yet. Make some public in your <Link href="/journal" className="underline underline-offset-4">build journal</Link>.
          </p>
        ) : (
          <ul className="space-y-2">
            {publicDecisions.map((d) => {
              const on = featured.includes(d.id);
              return (
                <li key={d.id}>
                  <label className={cn("flex cursor-pointer gap-3 rounded-[14px] border p-3", on ? "border-line-strong bg-surface-2" : "border-line")}>
                    <input
                      type="checkbox"
                      className="mt-1 accent-white"
                      checked={on}
                      disabled={!on && featured.length >= 3}
                      onChange={() => setFeatured(on ? featured.filter((x) => x !== d.id) : [...featured, d.id])}
                    />
                    <span className="t-small text-text-1">{d.text}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {decisions.length > publicDecisions.length ? <p className="t-small text-text-3">{decisions.length - publicDecisions.length} private decisions hidden.</p> : null}
      </Step>

      <Step n={4} title="Generate a case study and resume bullets" done={!!caseStudy}>
        <p className="t-small text-text-2">The draft only uses the numbers and decisions you entered above. Edit before you use this.</p>
        <Button variant="secondary" onClick={() => void generate()} disabled={!!busy} data-action="generate">
          {busy === "generate" ? "Drafting…" : caseStudy ? "Regenerate draft" : "Generate draft"}
        </Button>
        {generatedNote ? <p className="t-small text-text-2">{generatedNote}</p> : null}
        <Field label="Case study (markdown: ## headings, paragraphs, - lists)" htmlFor="pf-case">
          <Textarea id="pf-case" value={caseStudy} onChange={(e) => setCaseStudy(e.target.value)} rows={14} className="font-mono text-[13px]" />
        </Field>
        <div className="space-y-2">
          <p className="t-small font-medium text-text-1">Resume bullets</p>
          {bullets.map((b, i) => (
            <div key={i} className="flex gap-2">
              <Textarea aria-label={`Bullet ${i + 1}`} value={b} onChange={(e) => setBullets(bullets.map((x, j) => (j === i ? e.target.value : x)))} rows={2} className="min-h-[64px]" />
              <Button variant="ghost" onClick={() => setBullets(bullets.filter((_, j) => j !== i))} aria-label={`Remove bullet ${i + 1}`}>
                Remove
              </Button>
            </div>
          ))}
          {bullets.length < 5 ? (
            <Button variant="ghost" size="sm" onClick={() => setBullets([...bullets, ""])}>
              Add a bullet
            </Button>
          ) : null}
        </div>
        <Field label="Architecture diagram (optional, Mermaid)" htmlFor="pf-arch" hint="Shown on your public page. Paste the diagram from your ARCHITECTURE.md.">
          <Textarea id="pf-arch" value={architecture} onChange={(e) => setArchitecture(e.target.value)} rows={5} className="font-mono text-[12.5px]" placeholder={"flowchart LR\n  Client --> Gateway --> Postgres"} />
        </Field>
      </Step>

      <Step n={5} title="Publish" done={!!publishedAt}>
        <p className="t-small text-text-2">
          Your page shows the live demo, repo, numbers, featured decisions and case study.{" "}
          {verified ? "It will carry the Verified build badge." : "It won't show a Verified build badge until every check passes."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void publish()} disabled={!!busy} data-action="publish">
            {publishedAt ? "Update" : "Publish"}
          </Button>
          <Button variant="secondary" onClick={() => void save({}, "save").then((ok) => ok && toast("Saved"))} disabled={!!busy}>
            Save draft
          </Button>
          {publishedAt ? (
            <>
              <LinkButton href={`/u/${handle}/${project}`} variant="ghost" data-public-link>
                View public page
              </LinkButton>
              <a
                className="t-small text-text-2 underline underline-offset-4 hover:text-text-1"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                Share on LinkedIn
              </a>
            </>
          ) : null}
        </div>
        {bullets.length ? <CopyButton text={bullets.map((b) => `• ${b}`).join("\n")} label="Copy resume bullets" variant="pill" /> : null}
      </Step>

      {err ? (
        <p role="alert" className="t-small text-failed">
          {err}
        </p>
      ) : null}
    </div>
  );
}
