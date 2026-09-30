import {
  COMMON_CLONES,
  RUBRIC,
  RUBRIC_TARGET,
  RUBRIC_VERSION,
  ROLE_KEYWORDS,
  type PillarKey,
  type RubricPillar,
} from "@/lib/prompts/diagnostic"
import type { CheckResult, DiagnosticInput, PillarResult, PillarStatus, Report } from "./types"

/**
 * Deterministic rule-based judgements for every check, plus the scoring maths.
 * Same input → same output, always. AI judgements (when available) replace only the
 * "ai" checks' met/evidence; the score is still computed here.
 */

export function statusFor(score: number): PillarStatus {
  if (score >= RUBRIC_TARGET) return "passing"
  if (score >= 60) return "needs_work"
  return "critical"
}

function projectText(input: DiagnosticInput) {
  const { projects, experience } = input.profile
  return [
    ...projects.map((p) => [p.title, p.description, ...p.bullets, p.tech.join(" ")].join(" ")),
    ...experience.map((e) => [e.role, e.company, ...e.bullets].join(" ")),
  ]
    .join("\n")
    .toLowerCase()
}

function cloneTitles(input: DiagnosticInput) {
  return input.profile.projects
    .slice(0, 2)
    .filter((p) => COMMON_CLONES.some((c) => `${p.title} ${p.description}`.toLowerCase().includes(c)))
    .map((p) => p.title)
}

type Judge = (input: DiagnosticInput) => { met: boolean; evidence: string }

const rules: Record<string, Judge> = {
  u1: (input) => {
    const top = input.profile.projects.slice(0, 2)
    if (top.length === 0) return { met: false, evidence: "No projects were found on your resume." }
    const clones = cloneTitles(input)
    return clones.length
      ? { met: false, evidence: `Common builds among your top projects: ${clones.join(", ")}.` }
      : { met: true, evidence: `Your top projects (${top.map((p) => p.title).join(", ")}) aren't common tutorial builds.` }
  },
  u2: (input) => {
    const specific = input.profile.projects.find(
      (p) =>
        !COMMON_CLONES.some((c) => p.title.toLowerCase().includes(c)) &&
        /\b(for|helps?|lets|used by|allows?|enables?|students|users|teams|clubs|shops|small business|farmers|patients)\b/i.test(
          `${p.description} ${p.bullets.join(" ")}`
        )
    )
    return specific
      ? { met: true, evidence: `"${specific.title}" says who it helps.` }
      : { met: false, evidence: "No project says who it's for or what problem it solves." }
  },
  u3: (input) => {
    const m = projectText(input).match(
      /real[- ]?time|websocket|queue|cache|caching|distributed|scheduler|recommendation|search|payment|rate[- ]limit|concurren|stream|webhook|crdt|vector|embedding|ml model|pipeline|oauth|sharding|replication/
    )
    return m
      ? { met: true, evidence: `A project involves "${m[0]}", which goes beyond basic CRUD.` }
      : { met: false, evidence: "Projects describe standard create/read/update/delete features only." }
  },
  u4: (input) => {
    const solid = input.profile.projects.filter((p) => p.bullets.length >= 2 || p.description.length >= 80)
    return solid.length >= 2
      ? { met: true, evidence: `${solid.length} projects have enough detail.` }
      : { met: false, evidence: `${solid.length} project${solid.length === 1 ? " has" : "s have"} enough detail (need 2).` }
  },
  u5: (input) => {
    const ps = input.profile.projects
    const complete = ps.filter((p) => p.tech.length > 0 && p.link).length
    return ps.length > 0 && complete / ps.length >= 0.5
      ? { met: true, evidence: `${complete} of ${ps.length} projects list tech and a link.` }
      : { met: false, evidence: `${complete} of ${ps.length} projects list both tech and a link.` }
  },
  a1: (i) => keyword(i, /redis|cach(e|ing)|memcache|cdn/, "caching"),
  a2: (i) => keyword(i, /queue|kafka|rabbitmq|bullmq|celery|sqs|background job|worker|pub\/?sub|cron/, "queues or background jobs"),
  a3: (i) => keyword(i, /\bindex(es|ing)?\b|schema design|normali[sz]|query optimi[sz]|pagination|er diagram|data model/, "data modelling or indexing"),
  a4: (i) => keyword(i, /jwt|oauth|authenticat|authori[sz]|rbac|bcrypt|hash(ed|ing) password|session/, "authentication"),
  a5: (i) => keyword(i, /retr(y|ies)|idempoten|timeout|circuit breaker|rate[- ]limit|backoff|fallback|dead[- ]letter|graceful/, "failure handling"),
  a6: (i) => keyword(i, /unit test|integration test|jest|junit|pytest|mocha|vitest|test coverage|github actions|\bci\b|tdd|cypress|playwright/, "testing or CI"),
  t1: (i) =>
    i.layout === "two-column"
      ? { met: false, evidence: "Your resume uses two columns." }
      : { met: true, evidence: i.layout === "single-column" ? "Your resume is single-column." : "No multi-column layout detected." },
  t2: (i) => (i.hasTables ? { met: false, evidence: "We found text laid out in a table." } : { met: true, evidence: "No text tables detected." }),
  t3: (i) => {
    const text = i.resumeText.toLowerCase()
    const found = ["education", "skills", "projects", "experience"].filter((h) => new RegExp(`(^|\\n)\\s*[a-z ]*${h}`, "m").test(text))
    return found.length >= 3
      ? { met: true, evidence: `Found standard headings: ${found.join(", ")}.` }
      : { met: false, evidence: `Only found: ${found.join(", ") || "none"}.` }
  },
  t4: (i) => {
    const email = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(i.resumeText)
    const phone = /(?:\d[\s-]?){9}\d/.test(i.resumeText)
    return email && phone
      ? { met: true, evidence: "Email and phone are readable." }
      : { met: false, evidence: `Missing: ${[!email && "email", !phone && "phone"].filter(Boolean).join(" and ")}.` }
  },
  t5: (i) => {
    const dated = /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*'?\d{2,4}|\b(19|20)\d{2}\b/i.test(i.resumeText)
    return dated ? { met: true, evidence: "Dates are readable." } : { met: false, evidence: "No readable dates found." }
  },
  t6: (i) => {
    const role = i.profile.targetRole || "fullstack"
    const terms = ROLE_KEYWORDS[role] ?? ROLE_KEYWORDS.fullstack
    const text = i.resumeText.toLowerCase()
    const found = terms.filter((t) => text.includes(t.toLowerCase()))
    const missing = terms.filter((t) => !found.includes(t))
    return found.length / terms.length >= 0.6
      ? { met: true, evidence: `Covers ${found.length} of ${terms.length} common terms.` }
      : { met: false, evidence: `Covers ${found.length} of ${terms.length}. Missing: ${missing.slice(0, 5).join(", ")}.` }
  },
  g1: (i) =>
    i.github && i.github.activeWeeks >= 8
      ? { met: true, evidence: `Active in ${i.github.activeWeeks} of the last 12 weeks.` }
      : { met: false, evidence: `Active in ${i.github?.activeWeeks ?? 0} of the last 12 weeks.` },
  g2: (i) =>
    i.github && i.github.topRepos > 0 && i.github.reposWithReadme / i.github.topRepos >= 0.6
      ? { met: true, evidence: `${i.github.reposWithReadme} of your top ${i.github.topRepos} repos have a README.` }
      : { met: false, evidence: `${i.github?.reposWithReadme ?? 0} of your top ${i.github?.topRepos ?? 0} repos have a useful README.` },
  g3: (i) =>
    i.github && i.github.originalDescribedRepos >= 3
      ? { met: true, evidence: `${i.github.originalDescribedRepos} original repos have descriptions.` }
      : { met: false, evidence: `${i.github?.originalDescribedRepos ?? 0} original repos have descriptions.` },
  g4: (i) =>
    i.github && i.github.descriptiveCommitRatio >= 0.7
      ? { met: true, evidence: `${Math.round(i.github.descriptiveCommitRatio * 100)}% of recent commit messages are descriptive.` }
      : { met: false, evidence: `${Math.round((i.github?.descriptiveCommitRatio ?? 0) * 100)}% of recent commit messages are descriptive.` },
  d1: (i) => keyword(i, /trade-?off|chose|decid|design(ed)?|architect|instead of|so that|to reduce|to avoid/, "design decisions"),
  d2: (i) => {
    const bullets = [...i.profile.projects.flatMap((p) => p.bullets), ...i.profile.experience.flatMap((e) => e.bullets)]
    const numbered = bullets.filter((b) => /\d+(\.\d+)?\s*(%|x|ms|s\b|users|requests|rps|qps|k\b|\+|hours|mins?)|\b\d{2,}\b/i.test(b))
    return numbered.length >= 2
      ? { met: true, evidence: `${numbered.length} bullets include measured results.` }
      : { met: false, evidence: `${numbered.length} bullet${numbered.length === 1 ? "" : "s"} include a measured result (need 2).` }
  },
  d3: (i) => {
    const layers = i.profile.projects.map((p) => {
      const t = `${p.tech.join(" ")} ${p.description} ${p.bullets.join(" ")}`.toLowerCase()
      return [/react|angular|vue|next|flutter|android|html/, /node|express|spring|django|flask|fastapi|nest|go\b|\.net/, /sql|mongo|postgres|firebase|dynamo|sqlite/, /redis|kafka|rabbit|queue|worker|cache|docker|s3/].filter((r) => r.test(t)).length
    })
    const best = Math.max(0, ...layers)
    return best >= 3
      ? { met: true, evidence: "At least one project combines 3 or more layers (e.g. UI, API, database, cache)." }
      : { met: false, evidence: `Your most complex project uses ${best} layer${best === 1 ? "" : "s"}.` }
  },
  d4: (i) => keyword(i, /deploy|hosted|vercel|netlify|render|railway|heroku|aws|gcp|azure|docker|kubernetes|\.app\b|live at/, "deployment"),
}

function keyword(input: DiagnosticInput, pattern: RegExp, what: string) {
  const m = projectText(input).match(pattern)
  return m
    ? { met: true, evidence: `Your projects mention "${m[0]}".` }
    : { met: false, evidence: `No sign of ${what} in your projects or experience.` }
}

export type AiVerdicts = Record<string, { met: boolean; evidence: string }>

function scorePillar(pillar: RubricPillar, input: DiagnosticInput, ai: AiVerdicts | null): PillarResult {
  if (pillar.key === "github" && !input.github) {
    return {
      key: pillar.key,
      title: pillar.title,
      short: pillar.short,
      status: "not_assessed",
      score: null,
      notices: ["Connect GitHub to include this pillar. It isn't counted in your overall score until then."],
      fixes: [],
      checks: pillar.checks.map((c) => ({ id: c.id, label: c.label, weight: c.weight, met: false, evidence: "Not assessed yet." })),
    }
  }
  const checks: CheckResult[] = pillar.checks.map((c) => {
    const verdict = c.judge === "ai" && ai?.[c.id] ? ai[c.id] : rules[c.id](input)
    return { id: c.id, label: c.label, weight: c.weight, met: verdict.met, evidence: verdict.evidence }
  })
  const total = checks.reduce((s, c) => s + c.weight, 0)
  const earned = checks.filter((c) => c.met).reduce((s, c) => s + c.weight, 0)
  const score = Math.round((earned / total) * 100)
  const failed = pillar.checks.filter((c) => !checks.find((r) => r.id === c.id)?.met)
  // Biggest-weight gaps first: that's where the points are.
  failed.sort((a, b) => b.weight - a.weight)
  const clones = pillar.key === "uniqueness" ? cloneTitles(input) : []
  return {
    key: pillar.key,
    title: pillar.title,
    short: pillar.short,
    status: statusFor(score),
    score,
    notices: failed.length
      ? failed.slice(0, 3).map((c) =>
          c.id === "u1" && clones.length
            ? `Your top projects include ${clones.join(" and ")}, which screeners see as common tutorial builds.`
            : c.notice
        )
      : ["This looks strong. Keep it as it is."],
    fixes: failed.slice(0, 3).map((c) => c.fix),
    checks,
  }
}

export function buildReport(input: DiagnosticInput, ai: AiVerdicts | null): Report {
  const pillars = RUBRIC.map((p) => scorePillar(p, input, ai))
  const assessed = pillars.filter((p) => p.score !== null)
  const overall = Math.round(assessed.reduce((s, p) => s + (p.score ?? 0), 0) / Math.max(1, assessed.length))
  return {
    rubricVersion: RUBRIC_VERSION,
    target: RUBRIC_TARGET,
    overall,
    source: ai ? "ai" : "rules",
    createdAt: new Date().toISOString(),
    pillars,
  }
}

export function aiChecks() {
  return RUBRIC.flatMap((p) => p.checks.filter((c) => c.judge === "ai"))
}

export function pillarByKey(report: Report, key: PillarKey) {
  return report.pillars.find((p) => p.key === key)
}
