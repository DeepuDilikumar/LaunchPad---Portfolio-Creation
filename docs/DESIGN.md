# Design

A calm, monochrome, dark-only design language: pure black page, large centered medium-weight
headlines, muted gray body, white and charcoal pills, app-window mockups that play scripted
sessions. Color only appears in small avatars, status chips and progress rings.

The visual reference is a design *language*. No third-party names, logos, mascots, images, fonts
or copy are used. Our mascot (Caret), type (Geist) and copy are original.

## Tokens (`app/globals.css`)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#000000` | page |
| `--surface-1` | `#121212` | cards, app windows |
| `--surface-2` | `#1C1C1C` | secondary buttons, chips, inputs, active rows |
| `--surface-3` | `#262626` | hover |
| `--line` | `rgba(255,255,255,0.08)` | hairlines, window borders |
| `--text-1` | `#F5F5F5` | headings, primary |
| `--text-2` | `#9B9B9B` | body, captions |
| `--text-3` | `#5F5F5F` | timestamps, disabled (never essential text) |
| `--invert-bg` / `--invert-text` | `#FFFFFF` / `#0A0A0A` | primary pill |

Project accents: foundations `#E7E7E7` · pulse `#3CCFB4` · ledger `#E7C04A` · reel `#EF5A4C` ·
dispatch `#F28C38` · scribe `#8B6CF0` · atlas `#3B82F6`.
Status: working `#E7A13A` · passed `#3CCFB4` · failed `#EF5A4C`.

Tailwind exposes these as `bg-bg`, `bg-surface-1..3`, `border-line`, `text-text-1..3`,
`bg-invert`, `text-invert-text`, `text-accent-pulse`, etc.

## Type

Geist Sans everywhere, Geist Mono for code/terminals/commands (self-hosted via `geist`).

| Role | Desktop | Mobile | Weight | Tracking | Class |
|------|---------|--------|--------|----------|-------|
| Hero H1 | 64/68 | 40/44 | 500 | −0.03em | `.t-hero` |
| Section H2 | 40/46 | 30/36 | 500 | −0.02em | `.t-h2` |
| Card H3 | 18/24 | 17/22 | 500 | −0.01em | `.t-h3` |
| Body | 16/26 | 15/24 | 400 | 0 | `.t-body` |
| Small | 13/18 | 13/18 | 400 | 0 | `.t-small` |
| Badge | 12/16 | 12/16 | 500 | 0 | `.t-badge` |

No all-caps labels. No colored or italic single words in headlines.

## Layout

Container 1120px; gutters 20px / 32px; section spacing 96px / 160px. Card radius 24px, padding
20px / 32px. App windows: radius 16px, 1px line border, three dots, 36px title bar. Pills: 40px
tall, 0 18px padding, fully rounded. Primary = white pill, secondary = surface-2.

## Header

Transparent at top (logo left, 32px round menu button right). Once the hero CTAs leave the
viewport the header gets `rgba(0,0,0,0.8)` + blur and reveals a white "Start free" pill.
Menu: full-screen overlay on mobile, grouped dropdown panel on desktop.

## Caret (mascot)

A soft vertical block like a text cursor in `--text-1` with two square pixel eyes.
`<Caret size track blink />`. In the hero it blinks like a caret twice, then opens its eyes and
glances at the pointer. Eyes blink every 4–7s. On touch devices the eyes idle-glance.

## Motion

`motion/react`. One orchestrated moment per section; headings don't animate. 200–400ms,
`cubic-bezier(0.22, 1, 0.36, 1)`. Loops run only when ≥50% visible and the tab is visible.
Reduced motion → final state, no loops. Anything auto-playing longer than 5s has pause/play.

## Landing sections

S1 hero with scripted notebook demo · S2 mascot card · S3 2×2 feature grid with mini demos ·
S4 project switcher (phone/laptop frames) · S5 proof (sample profile) · S6 video (hidden when
no source) · S7 pricing · S8 FAQ · S9 final CTA · footer · cookie card. Copy is in
`components/marketing/*` and matches the build spec verbatim.

## App screens

Same tokens. Dashboard = one "Continue" card + project grid + recent decisions. Empty states
give one next action. Errors say what happened and how to fix it, without apologizing.
Buttons keep their names through a flow (`Publish` → toast "Published").
