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
