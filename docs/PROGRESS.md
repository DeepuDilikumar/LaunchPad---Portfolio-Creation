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
