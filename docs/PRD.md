# Product requirements

## One-liner

Hands-on notebook courses where you build six production-grade apps with Claude Code or Codex,
then turn each one into proof that gets you hired.

## Who it's for

- **Primary:** software engineers in India with 0–5 years of experience (service companies,
  startups, final-year CS students) moving into product or AI-native roles.
- **Secondary:** self-taught developers worldwide.

## Positioning

Not "learn to vibe code". Build what big tech runs, with agents doing the typing and the learner
doing the engineering. Then prove it with a public build record.

## Pillars

1. **Production-grade, not toys.** Auth, tests, CI/CD, observability, a security pass and load-test
   numbers in every project.
2. **Agent-native workflow.** Every prompt in a Claude Code and a Codex version. The loop is
   spec → plan → build → verify → decide.
3. **Proof over certificates.** Decisions are logged in a build journal that becomes a case study,
   resume bullets and interview answers.

## Scope (v1)

| Area | Requirement |
|------|-------------|
| Marketing | Landing (S1–S9), projects index, syllabus pages with Course JSON-LD, pricing, contact, legal |
| Notebook | Typed MDX cells, progress per cell, resume, keyboard navigation, gating for free/paid |
| Accounts | GitHub/Google/magic link (Supabase), mock auth locally, 3-tap onboarding, dashboard, settings |
| Proof | Build journal, proof pack builder, verification, public profile and project pages, OG images |
| Payments | Razorpay behind `PaymentProvider`, INR/USD by geo, idempotent entitlements, coupons, refunds |
| Tutor | Context-aware streaming tutor with daily limits; case study and bullet generator with a numbers check |
| Ops | Admin (funnel, purchases, refunds, coupons, grants, tutor spend), emails, consent-gated analytics |

## User journeys

J1 cold visitor → first win · J2 evaluator · J3 paywall → purchase · J4 returning learner ·
J5 stuck learner · J6 finisher → proof · J7 recruiter · J8 team/college buyer · J9 admin.
Each is a Playwright test in `tests/e2e`. Details in BUILD spec section 6, mirrored in the tests.

## Success metrics (instrumented, not claimed)

Visitor → sign-up, sign-up → first checkpoint (target: within 10 minutes), paywall view → purchase,
project completion, proof published. Events listed in `lib/analytics/events.ts`.

## Honesty rules

No invented testimonials, student counts, placement rates, salaries, company logos or job
guarantees. Social proof slots are `TODO(proof)` and render nothing in production.

## Non-goals (v1)

Live cohorts, certificates, in-browser code execution, a mobile app, Stripe (interface ready).
