# Buildproof

Hands-on notebook courses where learners build six production-grade apps with Claude Code or Codex, then turn each one
into proof that gets them hired: a build journal, verified projects, case studies and a public profile.

The brand name lives in `config/site.ts`. Prices live in `config/pricing.ts`.

## User journeys

Screenshots from a production build running in local mock mode (no keys). Each journey is also an end-to-end test in
`tests/e2e/`. To regenerate them, see [Screenshots](#screenshots) below.

### J1 — Cold visitor → first win

Landing → "Start free" → sign in → three-tap onboarding → Foundations module 1 → first checkpoint passed, in 6 clicks.

| Landing | Sign in |
|---|---|
| ![Landing page with the scripted notebook demo](docs/screenshots/j1-1-landing.jpg) | ![Sign-in page](docs/screenshots/j1-2-sign-in.jpg) |
| **Onboarding (3 taps)** | **First checkpoint passed** |
| ![Onboarding: experience level](docs/screenshots/j1-3-onboarding.jpg) | ![Checkpoint passed with the first-win celebration](docs/screenshots/j1-4-first-checkpoint.jpg) |

### J2 — Evaluator researching before buying

Projects → syllabus → a free module read in full while logged out → interacting asks to sign in and returns to the
same step → a paid module shows the teaser and upgrade card.

| Projects | Syllabus |
|---|---|
| ![Projects index](docs/screenshots/j2-1-projects.jpg) | ![Pulse syllabus](docs/screenshots/j2-2-syllabus.jpg) |
| **Free module, logged out** | **"Save your progress" on interaction** |
| ![Pulse module 2 read logged out, with real captured output](docs/screenshots/j2-3-free-module-logged-out.jpg) | ![Sign-in prompt that returns to the same cell](docs/screenshots/j2-4-sign-in-to-save.jpg) |
| **Paid module teaser** | |
| ![Paid module: first cell and upgrade card](docs/screenshots/j2-5-paywall.jpg) | |

### J3 — Free learner hits the paywall → buys → continues

INR pricing for a visitor from India → checkout (amount set on the server) → payment (mock provider locally) → back in
the same module, unlocked.

| Paywall in INR | Checkout |
|---|---|
| ![Upgrade card priced in rupees](docs/screenshots/j3-1-paywall-inr.jpg) | ![Checkout with project picker and discount code](docs/screenshots/j3-2-checkout.jpg) |
| **Payment** | **Back in the module, unlocked** |
| ![Mock payment dialog](docs/screenshots/j3-3-payment.jpg) | ![Module unlocked after purchase](docs/screenshots/j3-4-back-unlocked.jpg) |

### J4 — Returning learner

One primary action on the dashboard, resume at the last cell touched, and the build journal.

| Dashboard | Resumed at the last cell |
|---|---|
| ![Dashboard with the Continue card](docs/screenshots/j4-1-dashboard.jpg) | ![Module opened at the last touched cell](docs/screenshots/j4-2-resumed.jpg) |
| **Build journal** | |
| ![Build journal with public/private toggles](docs/screenshots/j4-3-journal.jpg) | |

### J5 — Stuck learner

Pitfall with a recovery prompt → "Ask the tutor" with the current cell attached → a diagnosis and a copyable recovery
prompt → a clear message at the daily limit.

| Pitfall | Tutor in context |
|---|---|
| ![Pitfall cell with recovery prompt](docs/screenshots/j5-1-pitfall.jpg) | ![Tutor drawer reply with a recovery prompt](docs/screenshots/j5-2-tutor.jpg) |
| **Daily limit** | |
| ![Tutor daily limit message with reset time](docs/screenshots/j5-3-daily-limit.jpg) | |

### J6 — Finisher → job seeker

Proof pack builder: verification checks (repo ownership with a committed token, commits, CI, tests, live URL with a
meta tag) → measured numbers → a generated draft that only uses those numbers → publish → public page with the
"Verified build" badge.

| Verification | Generated draft |
|---|---|
| ![All verification checks passed](docs/screenshots/j6-1-verification.jpg) | ![Case study and resume bullets draft](docs/screenshots/j6-2-draft.jpg) |
| **Published proof page** | |
| ![Public proof page with Verified build badge](docs/screenshots/j6-3-public-proof-page.jpg) | |

### J7 — Recruiter on a phone

No sign-up, no prompts, fast on mobile (LCP ≈ 0.6s on throttled 4G in the J7 test).

| Profile | Project page |
|---|---|
| <img src="docs/screenshots/j7-1-profile-mobile.jpg" alt="Public profile on a phone" width="320"> | <img src="docs/screenshots/j7-2-project-mobile.jpg" alt="Project proof page on a phone" width="320"> |

### J8 — Team or college buyer

Contact form → admin creates bulk access codes → students redeem them (seat limits and expiry enforced).

| Contact | Code redeemed |
|---|---|
| ![Teams and colleges contact form](docs/screenshots/j8-1-contact.jpg) | ![Access code redeemed on the pricing page](docs/screenshots/j8-2-code-redeemed.jpg) |

### J9 — Admin

Funnel, manual access, bulk codes, purchases with refunds, tutor usage and cost, leads.

| Funnel and tools | Purchases, tutor cost, leads |
|---|---|
| ![Admin funnel, manual access and coupon creation](docs/screenshots/j9-1-admin-funnel.jpg) | ![Admin purchases with refund, tutor usage, coupons and leads](docs/screenshots/j9-2-admin-purchases.jpg) |

## Run it locally (no keys needed)

Requirements: Node 22+, pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

With no environment variables the app runs in **mock mode**:

| Provider | Mock behaviour |
|----------|----------------|
| Database | Embedded Postgres (PGlite) in `.data/pglite`, migrated and seeded on first request |
| Auth | `/login` simulates GitHub/Google sign-up, signs in by email, or as the seeded demo learner or admin |
| Payments | Checkout opens a "Mock payment" dialog; webhooks can be simulated at `/api/webhooks/mock` |
| Email | Printed to the server console |
| Tutor and generator | Canned streamed reply / deterministic template built only from the learner's inputs |
| GitHub verification | Repos named `*-verify-pass` pass; use the "mock deployment URL" link in the proof builder. For real: the repo must be public, owned by the learner's GitHub account, contain a `.buildproof` file with the pack's token, have 20+ commits, a workflow and tests |
| Rate limits | In memory |

To try a production build locally: `pnpm build && ALLOW_MOCK=1 pnpm start`. Without `ALLOW_MOCK=1` a production
server refuses to start while any of auth, payments, database or rate limits would be mocked. `ALLOW_MOCK` is ignored
when `VERCEL_ENV=production` or `APP_ENV=production`.

Seeded accounts: `demo@buildproof.dev` (learner), `admin@buildproof.dev` (admin, sees `/admin`), and a clearly
labelled fictional sample profile at `/u/sample`. To reset local data, stop the server and delete `.data/`.

## Commands

```bash
pnpm dev              # dev server
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # unit tests (Vitest, in-memory Postgres)
pnpm test:e2e         # journeys J1–J9 (Playwright): builds, starts on :3100 with a fresh DB in mock mode
pnpm build            # production build
pnpm content:check    # validate every module's frontmatter, cell ids and authoring minimums
pnpm content:outlines # regenerate "Releasing soon" outline modules from content/catalog.ts
pnpm db:generate      # new SQL migration from db/schema.ts
pnpm db:migrate       # apply migrations (PGlite locally, Postgres with DATABASE_URL)
pnpm screenshots      # screenshots at 390px and 1440px (BASE_URL, SIGNIN=demo, FULL=0, REDUCED=1)
pnpm screenshots:journeys  # regenerate the README journey screenshots (see below)
```

### Screenshots

The images above come from `scripts/journey-screenshots.ts`, which replays J1–J9 against a running build:

```bash
pnpm build
PGLITE_DIR=.data/shots MOCK_MODE=true ALLOW_MOCK=1 TUTOR_BURST_PER_MINUTE=100 DEV_COUNTRY=IN pnpm start -p 3200
BASE_URL=http://localhost:3200 pnpm screenshots:journeys   # writes docs/screenshots/*.jpg
```

Delete `.data/shots` first so every run starts from the seeded state.

Playwright uses the Chromium at `/opt/pw-browsers/chromium-1194`; set `PW_CHROMIUM` to point elsewhere, or run
`pnpm exec playwright install chromium` on a normal machine and set `PW_CHROMIUM` to that binary. To run journeys
against a server you already started: `E2E_BASE_URL=http://localhost:3000 pnpm test:e2e` (the J7 LCP budget is only
meaningful against a production build; add `E2E_PERF=0` in dev).

## How it's built

- Next.js 16 (App Router, RSC), React 19, TypeScript strict, Tailwind v4, `motion/react`, Shiki, Mermaid (lazy).
- Content: `content/catalog.ts` + MDX per module in `content/projects/<slug>/`. See `docs/CURRICULUM.md`.
- Data: Drizzle + Postgres (Supabase), PGlite locally. RLS policies in `db/rls.sql`.
- One access check: `canAccess()` in `lib/entitlements.ts`.
- Docs: `docs/PRD.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/CURRICULUM.md`, `docs/PROGRESS.md`.

## Deploy (Vercel + Supabase + Razorpay)

1. **Supabase.** Create a project. In *Authentication → Providers* enable GitHub and Google (create OAuth apps on
   GitHub and Google Cloud with the callback URL Supabase shows) and email magic links. In *URL configuration* set the
   site URL to your domain and add `https://YOUR_DOMAIN/auth/callback` as a redirect URL.
2. **Database.** Copy the Postgres connection string (use the pooled one for serverless) into `DATABASE_URL`, then:
   ```bash
   DATABASE_URL=... pnpm db:migrate
   DATABASE_URL=... pnpm db:seed          # products only
   psql "$DATABASE_URL" -f db/rls.sql
   ```
   Make yourself admin: `update profiles set role = 'admin' where email = 'you@example.com';` (after signing in once).
3. **Razorpay.** Create API keys (test mode first). Add a webhook to `https://YOUR_DOMAIN/api/webhooks/razorpay` for
   `payment.captured` and `refund.processed`, and copy its secret. Enable international cards if you sell in USD.
4. **Other keys.** Anthropic (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`), Resend (verify your sending domain),
   Upstash Redis, PostHog, Sentry, a GitHub token (fine-grained, public repo read only), `CRON_SECRET`, `AUTH_SECRET`.
5. **Vercel.** Import the repo, set every variable from `.env.example` (production *and* preview), set
   `NEXT_PUBLIC_SITE_URL` to your domain, and deploy. `vercel.json` schedules the first-checkpoint nudge cron
   (hourly needs a Pro plan; on Hobby change it to daily).
6. **Check.** In production the app refuses to start if auth, payments, the database or rate limits would be mocked,
   or if `AUTH_SECRET` (32+ chars) or `CRON_SECRET` is missing. Buy your own course with a Razorpay test card, refund it from `/admin`, and
   confirm access is removed.

## Before you sell

- Have a lawyer review `/legal/*` (the pages say "Draft" until you remove the notice in
  `app/(marketing)/legal/[doc]/page.tsx`).
- Review every published module yourself and run at least one project start to finish with Codex.
  Search the content for `TODO(verify-codex)`.
- Replace the media placeholders listed in `public/media/manifest.json`, and set `site.video.src` to show the video.
- Social proof slots are `TODO(proof)` comments and render nothing until you have real, consented examples.
