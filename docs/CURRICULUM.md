# Curriculum

Source of truth for structure: `content/catalog.ts`. Module content: `content/projects/<slug>/<nn>-<module>.mdx`.

## Track 0 — Foundations (free)

Goal: first passing checkpoint within 10 minutes; a small deployed app within 90 minutes.

1. Set up Claude Code and Codex; how agents read your repo; `CLAUDE.md` and `AGENTS.md`.
2. The loop: spec, plan before building (plan mode), review the plan, then build.
3. Tests as guardrails: failing tests first, reading diffs, when to take the wheel.
4. Context and cost: focused sessions, skills, subagents, hooks for deterministic checks.
5. Mini-build: a URL shortener with a rate limiter, tests, CI and a live deploy.

## The six projects

| # | Name | Accent | What you build | Signature problem (M5) |
|---|------|--------|----------------|------------------------|
| 01 | Pulse | `#3CCFB4` | Real-time messenger | WebSocket fan-out with Redis pub/sub |
| 02 | Ledger | `#E7C04A` | Payments + wallet API | Double-entry ledger and idempotency |
| 03 | Reel | `#EF5A4C` | Short-video platform | Transcoding queue + HLS |
| 04 | Dispatch | `#F28C38` | Ride-hailing / delivery | Geospatial matching + trip state machine |
| 05 | Scribe | `#8B6CF0` | Collaborative docs | CRDTs with Yjs, offline-first |
| 06 | Atlas | `#3B82F6` | AI answer engine | Retrieval, citations and an eval harness |

Project stack: TypeScript, Next.js front ends, Node (Fastify) services, Postgres, Redis,
S3-compatible storage (Cloudflare R2), Docker, GitHub Actions, OpenTelemetry + Sentry, k6.

## Module template (M0–M10)

| Module | Purpose |
|--------|---------|
| M0 Spec + system design | PRD and architecture with the agent; ADRs; diagrams |
| M1 Repo + agent setup | Scaffold, CLAUDE.md/AGENTS.md, conventions, CI skeleton, hooks |
| M2 Data model | Schema, migrations, seed data, constraints that protect correctness |
| M3–M4 Core slices | Main features, one vertical slice at a time |
| M5 The hard part | The project's signature problem |
| M6 Testing | Unit, integration, e2e; property tests where they matter |
| M7 Security | Auth, authorization, rate limits, validation, secrets, OWASP pass |
| M8 Observability | Logs, metrics, traces, error tracking, dashboards |
| M9 Deploy + scale | Containers, CI/CD, load test, find and fix the bottleneck, re-measure |
| M10 Proof pack | Case study, resume bullets, demo script, interview defense drills |

## Authoring status

- **Published (Part A):** Foundations M1–M5, Pulse M0–M2. These are the free tier.
- **Outline:** everything else (`status: "outline"`), rendered as "Releasing soon" with "Notify me".

## Cell components

`<Explain>`, `<Prompt id claude codex cursor? mode>`, `<Expect kind>`, `<Checkpoint id cmd pass required>`,
`<Pitfall title recovery>`, `<Decision id question>`, `<Interview q>`, `<Quiz options answer why>`,
`<Diagram>`, `<Callout kind>`. Every interactive cell has a stable, unique `id`.

Progress: a module is complete when every `required` checkpoint is passed and every decision is
saved with ≥40 characters. A project is complete when all its published modules are complete.

## Authoring rules

- Prompts are the product. Every prompt has a Claude Code and a Codex version.
- `<Expect>` output must come from a real run. If you didn't run it, it doesn't go in.
  Part A modules mark illustrative output as "Example output" where it was not captured from a run.
- Explain the "why" the way a senior engineer would in a design review.
- 15–30 cells per module, at least 1 required checkpoint, 1 decision, 1 pitfall, 2 interview cells.

## Part B (per project)

```
Read CLAUDE.md, docs/CURRICULUM.md, and everything in content/projects/<slug>/.
Author modules M0–M10 for <slug>, replacing the outlines.
...
```

The full Part B prompt is kept in the original build spec; run it once per project in a fresh session.
