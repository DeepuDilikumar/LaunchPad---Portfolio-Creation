# Buildproof

Hands-on notebook courses where learners build six production-grade apps with Claude Code or Codex, then turn each one
into proof that gets them hired: a build journal, verified projects, case studies and a public profile.

The brand name lives in `config/site.ts`. Prices live in `config/pricing.ts`.

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
```

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
