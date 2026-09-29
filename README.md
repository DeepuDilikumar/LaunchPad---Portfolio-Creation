# LaunchPad

Upload your resume → get a live portfolio in 2 minutes → find out exactly why you're not clearing product-company screens → build one real, production-grade project in 14 days with a genuine GitHub history.

- Product and engineering rules: [`CLAUDE.md`](CLAUDE.md)
- Design system: [`design/DESIGN_SYSTEM.md`](design/DESIGN_SYSTEM.md)
- Features and acceptance criteria: [`docs/FEATURES.md`](docs/FEATURES.md)
- Folder structure and data model: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Run locally

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase values (optional for the landing page)
pnpm dev                     # http://localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build && pnpm start` | Production build and server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | Playwright smoke tests at 375px (needs a build first) |

## Supabase setup (sign-in)

1. Create a Supabase project and copy the URL + publishable key into `.env.local`.
2. Run `supabase/migrations/0001_profiles.sql` (SQL editor or `supabase db push`).
3. Authentication → Providers: enable **Google** and **GitHub**, adding each provider's client ID and secret.
4. Authentication → URL Configuration: set the Site URL, and add `http://localhost:3000/auth/callback` plus your production `/auth/callback` to the redirect allow-list.

Without these values the site still runs; sign-in shows a clear "not set up yet" state.

## Prices

All prices and plan contents live in [`config/pricing.ts`](config/pricing.ts) (amounts in paise).
