# Buildproof — agent guide

Buildproof is a learning platform and marketing site. Learners work through notebook-style
modules, building six production-grade apps with Claude Code or Codex, and turn each one
into public proof (a build journal, verified projects, case studies).

The brand name lives in one place: `config/site.ts`.

## Commands

```bash
pnpm install          # install
pnpm dev              # dev server on http://localhost:3000 (mock mode, no keys needed)
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm test             # vitest unit tests
pnpm test:e2e         # playwright journeys (builds + starts the app in mock mode)
pnpm build            # production build
pnpm content:check    # validate all MDX frontmatter + cell ids
pnpm content:outlines # regenerate "outline" module files from content/catalog.ts
pnpm db:generate      # drizzle-kit: generate SQL migration from db/schema.ts
pnpm db:migrate       # apply migrations (PGlite locally, Postgres when DATABASE_URL is set)
pnpm screenshots      # Playwright screenshots at 390px and 1440px into ./screenshots
```

Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before every commit.

## Architecture in one screen

- **Next.js 16 App Router**, React 19, TypeScript strict, Tailwind v4 (tokens in `app/globals.css`).
  Next 16 renamed middleware to `proxy.ts`; `params`, `cookies()` and `headers()` are async.
  Read `node_modules/next/dist/docs/` before using an API you are unsure of.
- Route groups: `app/(marketing)` public pages, `app/(app)` signed-in pages, `app/(admin)` admin,
  `app/api` route handlers. `/learn/...` lives in `(app)` but free modules render logged out.
- **Content**: `content/catalog.ts` (typed catalog) + `content/projects/<slug>/<nn>-<module>.mdx`.
  `lib/content` parses frontmatter with zod, compiles MDX with `@mdx-js/mdx`, and extracts cell
  metadata (checkpoint/decision ids) from the MDX AST so progress rules are computed server-side.
- **Notebook cells** are MDX components in `components/notebook/cells/*`.
- **Data**: Drizzle schema in `db/schema.ts`. Locally the DB is PGlite (embedded Postgres, stored in
  `.data/pglite`); with `DATABASE_URL` it is Postgres (Supabase). Migrations in `db/migrations`.
  RLS policies for Supabase in `db/rls.sql`.
- **Providers behind interfaces, mock by default**: auth (`lib/auth`), payments (`lib/payments`),
  email (`lib/email`), AI (`lib/ai`), rate limit (`lib/rate-limit`), analytics (`lib/analytics`).
  `lib/env.ts` decides mock vs real per provider. Mock mode is never allowed in production.
- **Entitlements**: one function, `canAccess(user, project, module)` in `lib/entitlements.ts`.
- **Prices** only come from `config/pricing.ts`. Never hard-code a price in a component.

## Conventions

- Copy: sentence case, short sentences, no hype words, name things by what the user sees.
  Never invent testimonials, counts, outcomes or logos. Use `TODO(proof)` placeholders that render nothing.
- No all-caps labels. Headings are centered on marketing pages; text inside cards is left-aligned.
- Color only in small avatars, chips and progress rings (project accents). Everything else monochrome.
- Motion: `motion/react`, 200–400ms, `cubic-bezier(0.22, 1, 0.36, 1)`. Loops only run when ≥50%
  visible and the tab is visible (`useInViewLoop`). Respect `prefers-reduced-motion` (show final state).
- Validate every input with zod. Render user text as plain text, never HTML.
- Server-only modules import `server-only`.
- Tests: unit tests next to the lib in `tests/unit`, journeys in `tests/e2e` (one file per journey J1–J9).

## Docs

`docs/PRD.md` · `docs/DESIGN.md` · `docs/ARCHITECTURE.md` · `docs/CURRICULUM.md` · `docs/PROGRESS.md`
