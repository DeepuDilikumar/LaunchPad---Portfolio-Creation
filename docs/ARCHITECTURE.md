# Architecture

## Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Framework | Next.js 16 (App Router, RSC), React 19, TypeScript strict | `proxy.ts` replaces middleware |
| Styling | Tailwind CSS v4 (CSS-first `@theme`) | tokens in `app/globals.css` |
| Motion | `motion/react` | |
| Content | MDX via `@mdx-js/mdx` + gray-matter + zod | see ADR-001 |
| Code highlighting | Shiki (custom theme from tokens) | server-rendered |
| Diagrams | Mermaid, lazy client import | |
| DB | Postgres via Drizzle ORM; PGlite locally | see ADR-002 |
| Auth | Supabase Auth (GitHub, Google, magic link); signed-cookie mock locally | |
| Payments | Razorpay behind `PaymentProvider`; mock provider in non-production | |
| Email | Resend REST; console transport in mock mode | |
| AI | Anthropic SDK; model from `ANTHROPIC_MODEL` | canned reply in mock mode |
| Rate limits | Upstash Redis REST; in-memory fallback | |
| Analytics | PostHog, loaded only after cookie consent | |
| Errors | Sentry-compatible reporter (`lib/observability.ts`) | SDK wiring is a TODO, see PROGRESS |
| Tests | Vitest + Playwright | |
| Deploy | Vercel, pnpm | |

## Folders

```
app/(marketing)   public pages: /, /projects, /pricing, /contact, /legal/*, /u/*, /login
app/(app)         signed-in: /onboarding, /dashboard, /learn/*, /journal, /proof/*, /settings, /checkout/success
app/(admin)       /admin (role-gated)
app/api           route handlers (auth, progress, decisions, checkout, webhooks, tutor, verify, ...)
components/ui         primitives (Button, Pill, Card, AppWindow, PhoneFrame, LaptopFrame, ...)
components/marketing  landing sections, header, footer, cookie card
components/notebook   notebook shell + cells
components/demos      looping mini demos (hero demo, feature demos, project screens)
content/              catalog.ts + projects/<slug>/<nn>-<module>.mdx
config/               site.ts, pricing.ts, features.ts
lib/                  auth, db, entitlements, payments, ai, verify, analytics, email, rate-limit, content
db/                   schema.ts, migrations/, rls.sql
tests/unit, tests/e2e
```

## Mock mode

`lib/env.ts` computes `MOCK_MODE` per provider: a provider is mocked when its keys are missing,
or everything is mocked when `MOCK_MODE=true`. In production (`NODE_ENV=production` and
`VERCEL_ENV=production`) mock payments and mock auth throw at startup.

| Provider | Real when | Mock behaviour |
|----------|-----------|----------------|
| DB | `DATABASE_URL` | PGlite at `.data/pglite`, migrated + seeded on first use |
| Auth | `NEXT_PUBLIC_SUPABASE_URL` + anon key | sign-in page offers "Continue as demo learner" or any email; signed cookie |
| Payments | `RAZORPAY_KEY_ID` + secret | order + capture happen instantly server-side |
| Email | `RESEND_API_KEY` | printed to the server console |
| AI | `ANTHROPIC_API_KEY` | canned streaming answer that echoes the attached context |
| Rate limit | Upstash URL + token | in-memory sliding window |
| Analytics | `NEXT_PUBLIC_POSTHOG_KEY` | events logged to console in dev |

## Data model

See `db/schema.ts`. Tables: profiles, products, purchases, entitlements, coupons,
coupon_redemptions, webhook_events, progress, decisions, proof_packs, tutor_messages,
notify_requests, leads, plus `users` (mock-auth identities; in Supabase this maps to `auth.users`)
and `analytics_events` (server-side funnel counts for the admin view).

Key constraints:
- `purchases.provider_payment_id` unique → a payment can only be recorded once.
- `entitlements (user_id, scope, source, source_id)` unique → grants are idempotent.
- `webhook_events (provider, event_id)` unique → webhooks are stored once, processed once.
- `progress (user_id, cell_id)` unique → upsert per cell.
- `coupon_redemptions (coupon_id, user_id)` unique.

## Entitlements

`canAccess(user, project, module)`:
1. Module frontmatter `free: true` → allowed (even logged out).
2. No user → denied.
3. Admin → allowed.
4. Active (non-revoked) entitlement with scope `all` or `project:<slug>` → allowed.

Used by the learn page, the MDX renderer (paid content is never sent to unentitled users),
and API routes (progress/decision writes for paid modules).

## Payments flow

1. `POST /api/checkout` with `{ productSlug, currency, returnTo }`. Server reads the amount from
   `config/pricing.ts`, creates the order through the provider and a `pending` purchase row.
2. Client opens Razorpay checkout (or the mock provider confirms immediately).
3. `POST /api/checkout/verify` verifies the signature (HMAC-SHA256 of `order_id|payment_id`),
   then `grantPurchase()` runs in a transaction: upsert purchase by `provider_payment_id`, insert
   entitlement with `ON CONFLICT DO NOTHING`.
4. Redirect to `/checkout/success?returnTo=...` which forwards to the stored module.
5. `POST /api/webhooks/razorpay`: verify `x-razorpay-signature`, insert into `webhook_events`
   (unique), then `payment.captured` → `grantPurchase()`; `refund.processed` → revoke.

## Verification

`lib/verify`: GitHub REST (optional token, handles 403 rate limits) checks public repo, owner
matches linked GitHub username, ≥20 commits, `.github/workflows/` exists, test files exist.
Live URL fetch with SSRF protection: http/https only, DNS-resolve and block private, loopback,
link-local and CGNAT ranges, 5s timeout, 1MB cap, no redirects to blocked hosts. Looks for
`<meta name="buildproof-verify" content="{token}">`. Results per check are stored with dates.

## Security

RLS on every user table (`db/rls.sql`), service credentials server-only, zod on every input,
rate limits on auth, tutor, verify and contact, CSP + security headers in `next.config.ts`,
webhook signature checks, user text rendered as text.

## ADRs

**ADR-001 — Content layer.** We compile MDX with `@mdx-js/mdx` directly and validate frontmatter
with zod, instead of Velite/Content Collections. Reason: both add a bundler plugin whose Next 16
support lags; our needs (frontmatter, AST extraction of cell ids, RSC rendering) are ~200 lines.
Build-time validation runs in `pnpm content:check` and inside `next build` via `generateStaticParams`.

**ADR-002 — PGlite for local dev.** One Drizzle schema and one query path for local and
production. PGlite gives real Postgres semantics (unique constraints, transactions, `ON CONFLICT`)
so idempotency tests mean something. Trade-off: single process only, fine for dev and e2e.

**ADR-003 — Mock auth via signed cookie.** HMAC-signed `bp_session` cookie with a user id. Lets
journeys run with zero keys. Disabled in production.
