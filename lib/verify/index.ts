import "server-only";
import { env, mockEndpointsEnabled } from "@/lib/env";
import { site } from "@/config/site";
import { safeFetchText, UnsafeUrlError } from "./safe-fetch";

export type CheckId = "repo_public_owned" | "commits" | "workflows" | "tests" | "live_url";
export type CheckResult = { ok: boolean; detail: string; at: string };
export type Checks = Record<CheckId, CheckResult>;

export const checkLabels: Record<CheckId, string> = {
  repo_public_owned: "Repo is public, owned by your linked GitHub account, and contains your token",
  commits: "At least 20 commits",
  workflows: "Has a GitHub Actions workflow",
  tests: "Has test files",
  live_url: "Live URL responds 200 and carries your verification tag",
};

export const MIN_COMMITS = 20;

export function parseRepoUrl(raw: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(raw);
    if (u.hostname !== "github.com") return null;
    const [owner, repo] = u.pathname.replace(/^\/|\/$/g, "").replace(/\.git$/, "").split("/");
    if (!owner || !repo || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

export function metaTag(token: string) {
  return `<meta name="${site.verifyMetaName}" content="${token}">`;
}

export function hasVerifyMeta(html: string, token: string): boolean {
  const re = new RegExp(`<meta\\s+[^>]*name=["']${site.verifyMetaName}["'][^>]*>`, "gi");
  for (const m of html.match(re) ?? []) {
    const content = m.match(/content=["']([^"']+)["']/i)?.[1];
    if (content === token) return true;
  }
  return false;
}

export function allPassed(checks: Partial<Checks> | null | undefined): boolean {
  if (!checks) return false;
  return (Object.keys(checkLabels) as CheckId[]).every((k) => checks[k]?.ok === true);
}

/** GitHub facts the verifier needs. Real implementation uses the REST API; the mock uses fixtures. */
export interface RepoFacts {
  exists: boolean;
  isPrivate: boolean;
  owner: string;
  commits: number;
  hasWorkflow: boolean;
  testFiles: number;
  /** The pack's verify token is committed in the repo (.buildproof file or README). Proves the learner controls it. */
  hasToken: boolean;
  rateLimited?: boolean;
}

async function gh(path: string): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "BuildproofVerifier",
      ...(env.githubToken ? { authorization: `Bearer ${env.githubToken}` } : {}),
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
}

const TEST_FILE = /(^|\/)(__tests__\/|tests?\/|e2e\/).+\.[cm]?[jt]sx?$|\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)test_.+\.py$|_test\.(go|py)$/;

export async function githubFacts(owner: string, repo: string, token: string): Promise<RepoFacts> {
  const r = await gh(`/repos/${owner}/${repo}`);
  if (r.status === 403 || r.status === 429) return { exists: false, isPrivate: false, owner: "", commits: 0, hasWorkflow: false, testFiles: 0, hasToken: false, rateLimited: true };
  if (r.status === 404) return { exists: false, isPrivate: true, owner: "", commits: 0, hasWorkflow: false, testFiles: 0, hasToken: false };
  const meta = (await r.json()) as { private: boolean; owner: { login: string }; default_branch: string };
  const commitsRes = await gh(`/repos/${owner}/${repo}/commits?per_page=1&sha=${encodeURIComponent(meta.default_branch)}`);
  let commits = 0;
  if (commitsRes.ok) {
    const last = commitsRes.headers.get("link")?.match(/[?&]page=(\d+)>;\s*rel="last"/)?.[1];
    commits = last ? Number(last) : ((await commitsRes.json()) as unknown[]).length;
  }
  const wf = await gh(`/repos/${owner}/${repo}/contents/.github/workflows`);
  const hasWorkflow = wf.ok && ((await wf.json()) as { name: string }[]).some((f) => /\.ya?ml$/.test(f.name));
  const tree = await gh(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(meta.default_branch)}?recursive=1`);
  const testFiles = tree.ok ? ((await tree.json()) as { tree: { path: string; type: string }[] }).tree.filter((t) => t.type === "blob" && TEST_FILE.test(t.path)).length : 0;
  let hasToken = false;
  for (const file of [".buildproof", "README.md"]) {
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(meta.default_branch)}/${file}`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (res.ok && (await res.text()).slice(0, 200_000).includes(token)) {
      hasToken = true;
      break;
    }
  }
  return { exists: true, isPrivate: meta.private, owner: meta.owner.login, commits, hasWorkflow, testFiles, hasToken };
}

/**
 * Mock GitHub (local mock mode only): repos named "*-verify-pass" behave like a healthy,
 * public repo owned by the URL's owner; anything else looks like an empty repo.
 */
export function mockGithubFacts(owner: string, repo: string): RepoFacts {
  if (repo.endsWith("-verify-pass")) return { exists: true, isPrivate: false, owner, commits: 42, hasWorkflow: true, testFiles: 18, hasToken: true };
  return { exists: true, isPrivate: false, owner, commits: 3, hasWorkflow: false, testFiles: 0, hasToken: false };
}

export async function runVerification(input: { repoUrl: string; liveUrl: string; token: string; githubUsername: string | null }): Promise<Checks> {
  const at = new Date().toISOString();
  const fail = (detail: string): CheckResult => ({ ok: false, detail, at });
  const pass = (detail: string): CheckResult => ({ ok: true, detail, at });
  const checks = {} as Checks;

  const parsed = parseRepoUrl(input.repoUrl);
  if (!parsed) {
    checks.repo_public_owned = fail("Use a GitHub repo URL like https://github.com/you/pulse.");
    checks.commits = fail("Needs a valid repo URL first.");
    checks.workflows = fail("Needs a valid repo URL first.");
    checks.tests = fail("Needs a valid repo URL first.");
  } else {
    let facts: RepoFacts;
    try {
      facts = mockEndpointsEnabled("auth") ? mockGithubFacts(parsed.owner, parsed.repo) : await githubFacts(parsed.owner, parsed.repo, input.token);
    } catch {
      facts = { exists: false, isPrivate: false, owner: "", commits: 0, hasWorkflow: false, testFiles: 0, hasToken: false, rateLimited: true };
    }
    if (facts.rateLimited) {
      const msg = "GitHub is rate-limiting us. Try again in a few minutes.";
      checks.repo_public_owned = fail(msg);
      checks.commits = fail(msg);
      checks.workflows = fail(msg);
      checks.tests = fail(msg);
    } else if (!facts.exists || facts.isPrivate) {
      checks.repo_public_owned = fail("We couldn't see this repo. Make it public, then re-run.");
      checks.commits = fail("Repo isn't visible.");
      checks.workflows = fail("Repo isn't visible.");
      checks.tests = fail("Repo isn't visible.");
    } else {
      const linked = input.githubUsername?.toLowerCase();
      checks.repo_public_owned = !linked
        ? fail("Link your GitHub username in Settings first.")
        : facts.owner.toLowerCase() !== linked
          ? fail(`Owned by ${facts.owner}, but your linked account is ${input.githubUsername}.`)
          : !facts.hasToken
            ? fail("Commit a .buildproof file containing your verification token (or add the token to README.md), then re-run.")
            : pass(`Public, owned by ${facts.owner}, token found`);
      checks.commits = facts.commits >= MIN_COMMITS ? pass(`${facts.commits} commits`) : fail(`${facts.commits} commits; needs at least ${MIN_COMMITS}.`);
      checks.workflows = facts.hasWorkflow ? pass("Found .github/workflows") : fail("No workflow file in .github/workflows.");
      checks.tests = facts.testFiles > 0 ? pass(`${facts.testFiles} test files`) : fail("No test files found (e.g. *.test.ts or tests/).");
    }
  }

  try {
    // In local mock mode the app's own origin is allowed, so the flow can be tested end to end.
    const allowOrigin = mockEndpointsEnabled("auth") ? new URL(env.siteUrl).origin : undefined;
    const res = await safeFetchText(input.liveUrl, { allowOrigin });
    if (res.status !== 200) checks.live_url = fail(`Responded ${res.status}; needs 200.`);
    else if (!hasVerifyMeta(res.body, input.token)) checks.live_url = fail("Responds 200, but the verification meta tag isn't in the first 1MB of the page.");
    else checks.live_url = pass("Responds 200 with your verification tag");
  } catch (e) {
    checks.live_url = fail(e instanceof UnsafeUrlError ? e.message : e instanceof Error && e.name === "TimeoutError" ? "Timed out after 5 seconds." : "We couldn't reach that URL.");
  }
  return checks;
}
