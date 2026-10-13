# secondquestion

A store for follow-up-focused backend interview guides, for engineers in India with 2–8 years of
experience who are switching jobs. Built from [PLAN.md](PLAN.md); decisions taken during the build
are in [DECISIONS.md](DECISIONS.md).

Next.js (App Router) · TypeScript · Tailwind v4 · Razorpay · Supabase · Cloudflare R2 · Resend ·
Playwright (PDFs) · pdf-lib (stamping) · Vercel.

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:3000, drafts visible (see .env.development)
pnpm test           # 41 tests: webhook idempotency, stamping, download limits, pricing, quiz, content gates
```

With no secrets set, everything still runs: an in-memory database, local file storage in
`.data/storage`, emails written to `.data/outbox/*.html`, and a simulated checkout (the "Get the
guide" button shows a dev payment panel that fires the real webhook pipeline).

To try a purchase end to end locally:

```bash
pnpm build:pdf --drafts                 # review copy of the guide (drafts included, marked)
pnpm release --guide backend --drafts   # upload it as the local delivery master
pnpm dev                                # buy on /guides/backend → check .data/outbox
```

## Content pipeline

Guides are Markdown with YAML frontmatter in `content/guides/<guide>/<module>/<id>.md` (schema in
`lib/content/schema.ts`). **Only files with `reviewed: true` ever reach the PDF or the live site.**

| Command                                               | What it does                                                                                                     |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `pnpm content:validate`                               | zod schema, ≥3 follow-ups covering ≥2 types, near-duplicate titles, every source logged in `content/sources.csv` |
| `pnpm content:spell` / `pnpm content:links`           | spell-check / check every source URL responds                                                                    |
| `pnpm content:stats`                                  | writes `content/stats.json`, the only place the site's numbers come from                                         |
| `pnpm build:pdf [--drafts]`                           | A4 + phone editions into `dist/pdf/`, page counts into stats                                                     |
| `pnpm build:previews [--drafts]`                      | 12 WebP page images for the site's page viewer                                                                   |
| `pnpm release --guide backend --notes "…" [--notify]` | upload masters, add a changelog entry, email buyers a fresh link                                                 |

`NEXT_PUBLIC_CONTENT_PREVIEW=1` shows drafts on the site behind a red banner (on by default in
`pnpm dev`). Production never shows drafts, and a guide with no reviewed questions shows
"In final review. Not on sale yet." instead of a buy button.

## How a sale works

1. `/api/checkout` creates our order and a Razorpay order at the current price (launch price only
   inside `site.launch`; referral discount if a valid `?ref=` code).
2. Razorpay calls `/api/razorpay/webhook` (and the browser calls `/api/checkout/verify`). Both are
   safe to repeat: the event id is stored, the order moves `created → paid` once, and a fulfilment
   lock means one worker at a time.
3. Fulfilment stamps every page of both editions with the buyer's email and order id, stores them
   privately, creates a 24-hour / 5-download link, sends one delivery email (with a provider
   idempotency key), and reports the purchase to Meta's Conversions API with the order id as the
   event id. It retries 3 times, then alerts `OWNER_EMAIL` and Sentry; the hourly cron retries later.
4. The email links to `/download?t=…` (a page, so mail scanners can't use up downloads), which links
   to `/api/download` for a 5-minute signed R2 URL.
5. Day 7: review ask → `/review` → moderation (`pnpm reviews`) → referral link for the buyer.

## Going live

1. Run `supabase/migrations/0001_init.sql` in Supabase. Create a private R2 bucket. Verify your
   sending domain in Resend.
2. Fill `.env.local` / Vercel env from `.env.example`. In Razorpay, add a webhook to
   `https://<domain>/api/razorpay/webhook` for `payment.captured` and `order.paid`.
3. Review content, `pnpm content:stats && pnpm build:pdf && pnpm build:previews`, commit the stats and
   previews, then `pnpm release --guide backend --notes "First release"`.
4. `pnpm preflight` must pass. Then work through the launch checklist in PLAN.md.

The cron (`vercel.json`, hourly) sends the email sequence and review asks and sweeps undelivered
orders. Hourly crons need a Vercel Pro plan; on Hobby, change the schedule to daily.

## Operations

```bash
pnpm ad-spend add 2026-11-08 1000 "reel-a"   # type in ad spend
pnpm report:weekly --weeks 4                 # orders, revenue, spend, cost/order, checks, leads
pnpm reviews list | publish <id> | reject <id>
pnpm stamp file.pdf buyer@x.in sq_123        # stamp a PDF by hand
pnpm capture-reference                       # competitor screenshots (git-ignored)
```

## Phase status

| Phase               | State                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Setup             | Done: scaffold, lint/format/typecheck/test/build in CI, `config/site.ts`, reference capture script (ran OK; PNGs are git-ignored)                                                                                                                             |
| 1 Content engine    | Engine done (schema, gates, PDF A4 + phone, previews, stats). **24 of 100 questions drafted** (2 per module), all `reviewed: false`. Your review and the remaining 76 drafts are next.                                                                        |
| 2 Storefront        | Done: every route in the spec, Razorpay order + checkout + idempotent webhook → stamp → email, signed downloads, GA4 + Pixel + CAPI with shared event id, preview images, JSON-LD, legal pages                                                                |
| 3 Readiness Check   | Done: 8-question check from guide content, per-area score without email, share image, PDF report by email, opt-in 3-email sequence, one-click unsubscribe, `/learn` with 4 articles                                                                           |
| 4 Launch            | Done in code: launch price window, UTM capture on orders/leads, weekly report, preflight. Needs live keys and your decisions.                                                                                                                                 |
| 5 Second guide etc. | Partly: bundle/waitlist, review flow + moderation, referral codes, changelog/errata are built. The System Design guide content is not.                                                                                                                        |
| 6 AI drill          | Built behind `NEXT_PUBLIC_FEATURE_DRILL=1`: magic-link login for buyers, follow-ups grounded in each question's ladder and rejection signals, score + strong answer, daily cap, monthly budget, per-session cost logging. Off until ~100 sales, per the plan. |
