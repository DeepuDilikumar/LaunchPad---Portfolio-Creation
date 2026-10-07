# Progress log

Each phase appends: what was done, what is mocked, what is left.

## P0 — Plan

- Created `CLAUDE.md`, `AGENTS.md`, `docs/PRD.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`,
  `docs/CURRICULUM.md`, this file.
- Toolchain: Next 16.4, React 19.3, Tailwind 4.3, TypeScript 5.9 (TS 7 skipped until Next supports it),
  Drizzle 0.45 + PGlite 0.5, motion 14, Shiki 4, Mermaid 12, Anthropic SDK 0.131, Playwright 1.56
  (pinned to match the preinstalled Chromium build), Vitest 5.
- Branch: `buildproof`.

## P1 — Foundation

- Next.js app with Tailwind v4 tokens (`app/globals.css`), Geist Sans/Mono via `geist`, security headers + CSP in `next.config.ts`.
- Primitives in `components/ui`: Button/LinkButton, Pill, StatusChip, AccentAvatar, Card, AppWindow, PhoneFrame,
  LaptopFrame, SegmentedToggle (radiogroup), Tabs (ARIA tablist), Accordion, Dialog (native `<dialog>`), Toast,
  CopyButton, inputs, ProgressRing, icons, and the Caret mascot (intro caret blink, random blinks, pointer tracking,
  idle glance on touch, reduced-motion aware).
- Hooks: `useInViewLoop` (≥50% visible + tab visible), `useTimeline` (pausable demo clock).
- `/styleguide` screenshotted at 390 and 1440 and reviewed.
- Mocked: nothing yet.

## P2 — Landing

- Landing `/` with S1–S9, header (transparent → blurred with "Start free" once hero CTAs leave view; full-screen menu on
  mobile, grouped dropdown on desktop), footer (5 columns), cookie card (essential by default; analytics only after Accept).
- Hero demo: scripted ~18s loop of the real notebook views (`components/notebook/views.tsx`) with fake data;
  pauses off-screen / hidden tab; pause control; reduced motion shows the final state.
- S3 mini demos (prompt tabs, k6 checkpoint labelled "Example output", journal, tutor), each with pause control.
- S4 project switcher: pill tabs with accent dots and shared-layout highlight, phone/laptop frames with coded app screens,
  auto-advance every 6s until interaction, pause control.
- S5 sample profile (clearly fictional), S6 video hidden while `site.video.src` is empty, S7 pricing from `config/pricing.ts`
  with in-card toggles and INR/USD (geo cookie from `proxy.ts`, manual toggle), S8 FAQ (+ FAQPage JSON-LD), S9 final CTA.
- Landing is statically rendered; signed-in state comes from a non-sensitive `bp_auth=1` flag cookie.
- Media placeholders + `public/media/manifest.json` with generation prompts.
- Verified: screenshots at 390/1440 per section, reduced-motion final states, no console errors or hydration warnings.
- Lighthouse: deferred to P9 (run against the production build).
- Mocked: `/api/events` accepts and drops events until the database lands in P4.

## P3 — Notebook

- Content layer (ADR-001): `lib/content/{schema,parse,index,render}` — gray-matter + zod frontmatter, MDX AST cell
  extraction (stable ids, required checkpoints, decisions, per-cell source for tutor context), server-side MDX render,
  teaser extraction (paid content is never sent to unentitled visitors). `pnpm content:check` enforces catalog
  agreement and authoring minimums.
- Cells: Explain, Prompt (tool tabs, copy, mode hints, `prompt_copied`), Expect (Shiki with a token theme, "Example
  output" label for anything not captured from a real run), Checkpoint (mark passed / paste output / skip optional),
  Pitfall (recovery prompt + "ask the tutor"), Decision (800ms autosave, public toggle, 40-char minimum), Interview,
  Quiz, Diagram (lazy Mermaid, dark theme), Callout.
- Notebook shell: rail with progress rings and locks, top bar (breadcrumb, tool switcher, progress, Ask tutor), drawer
  (Tutor / Journal / Notes), mobile bottom sheet + sticky "Next cell", keyboard j/k/c/p and `/`, resume to last cell,
  sign-in modal on interaction while logged out, first-checkpoint and module-complete celebrations.
- `/projects` and `/projects/[slug]` (SSG, Course JSON-LD). Paid modules show the first Explain cell + upgrade card;
  outline modules show "Releasing soon" + Notify me.
- Content: Foundations M1–M5 and Pulse M0–M2 published; 63 outlines generated from the catalog.
  Real outputs: `claude --version`, the shortly reference build (`reference/foundations-shortly`, 11 tests, red/green
  runs, curl), and the Pulse M2 schema run against PGlite (`reference/pulse-data-model`), which surfaced a real
  sequence-gap bug on retries that the module now teaches. Agent replies and file trees are labelled "Example output".
  Codex outputs could not be captured here (Codex isn't installed): see TODO(verify-codex) in the MDX.
- Database (pulled forward from P4): Drizzle schema + migration, PGlite locally, idempotent seed.

## P4 — Accounts

- Auth: Supabase (GitHub, Google, magic link) via `@supabase/ssr` with session refresh in `proxy.ts` and
  `/auth/callback`; mock auth (HMAC-signed `bp_session` cookie) when keys are missing. Mock login page offers GitHub/Google
  (each creates a fresh account, to simulate OAuth sign-up), email, demo learner and admin.
- Onboarding: 3 taps (experience, target role, agent), then back to the stored `next`.
- Progress persistence: `/api/progress` (touch + checkpoint), `/api/decisions` (upsert + journal toggles), access checked
  with `canAccess`, cells validated against the module. Module/project completion recorded once (milestones), with email.
- Dashboard (one Continue card, project grid, streak, recent decisions, empty state), journal (filters, public toggle,
  link to cell), settings (handle, headline, GitHub username, public profile, preferred agent, progress emails).
- Tests: unit (progress rules, streak, session tokens, return-to safety, content parsing); e2e J1 (6 clicks to a passed
  checkpoint), J2 (logged-out free module, sign-in modal returns to the same cell, paywall teaser, FAQ), J4 (resume).
- Mocked: auth (when Supabase keys are absent), welcome emails print to the console.
