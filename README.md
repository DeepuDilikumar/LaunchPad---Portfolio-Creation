# LaunchPad

Upload your resume → get a live portfolio in 2 minutes → find out exactly why you're not clearing product-company screens → build one real, production-grade project in 14 days with a genuine GitHub history.

- Product and engineering rules: [`CLAUDE.md`](CLAUDE.md)
- Design system: [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md)
- Features and acceptance criteria: [`docs/FEATURES.md`](docs/FEATURES.md)
- Folder structure and data model: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Try it in 1 minute (demo mode, no keys needed)

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

With no service keys, everything runs in **demo mode**: a local JSON database in `.data/`,
a "Continue with a demo account" sign-in, test payments that charge nothing, rule-based
analysis instead of AI, and a program that marks days done without GitHub. Every simulated
part is labelled in the UI. To see a production build in demo mode:

```bash
pnpm build && LAUNCHPAD_DEMO_MODE=1 pnpm start
```

In GitHub Codespaces, check out the `claude/design-tooling-setup-n313yo` branch first, then run the commands above.

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build && pnpm start` | Production build and server |
| `pnpm lint` · `pnpm typecheck` | ESLint · TypeScript |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | Playwright at 375px, including the full demo journey (run `pnpm build` first; in the cloud sandbox set `CHROMIUM_PATH=/opt/pw-browsers/chromium`) |

## Going live: connect each service

Copy `.env.example` to `.env.local` (or set the variables in Vercel). Each service is independent; anything left blank stays in demo mode.

| Service | Variables | Setup |
|---|---|---|
| **Supabase** (database, sign-in, private resume storage) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | 1. Create a project. 2. Run `supabase/migrations/0001_initial.sql` (SQL editor or `supabase db push`); it creates every table, RLS policy and the private `resumes` bucket. 3. Authentication → Providers: enable **Google** and **GitHub**. 4. URL Configuration: add `<site>/auth/callback` to the redirect allow-list. |
| **Anthropic** (AI refinement, diagnostic judgements, mentor, rewrites, interview feedback, pitches) | `ANTHROPIC_API_KEY` (optional `ANTHROPIC_MODEL`) | Create a key in the Claude Console. All calls go through `lib/llm.ts` on the server. |
| **Razorpay** (payments) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | API keys from the dashboard. Add a webhook to `<site>/api/payments/webhook` for `payment.captured` and `order.paid`, with the same secret. Start with test-mode keys. |
| **GitHub OAuth App** (repo scaffold + commit verification) | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_TOKEN_ENC_KEY` | Settings → Developer settings → OAuth Apps. Callback URL: `<site>/api/github/callback`. Generate the encryption key with `openssl rand -base64 32`. |
| **Reminder emails** | `RESEND_API_KEY`, `REMINDER_FROM_EMAIL`, `CRON_SECRET` | Verify a sending domain in Resend. `vercel.json` runs `/api/cron/reminders` hourly (hourly crons need a Vercel Pro plan; on Hobby, change it to daily). |
| **Meta Pixel** | `NEXT_PUBLIC_META_PIXEL_ID` | Events: upload → Lead, portfolio_created → CompleteRegistration, checkout_started → InitiateCheckout, paid → Purchase. No personal data is sent. |
| Site URL | `NEXT_PUBLIC_SITE_URL` | Your production domain. |

Set `LAUNCHPAD_DEMO_MODE=1` to force demo mode on a preview deployment.

## Prices

All prices and plan contents live in [`config/pricing.ts`](config/pricing.ts) (amounts in paise).
