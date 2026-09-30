# LaunchPad Design System

The source of truth for every LaunchPad screen. Read it before building any UI.
If a screen needs to break a rule here, write the exception in
`design/pages/<page>.md` and explain why.

**How it was made:** the UI UX Pro Max skill (`.claude/skills/ui-ux-pro-max`) was
queried with `--design-system` (dials: variance 3, motion 3, density 5) and with
targeted `color`, `typography`, `landing`, `ux` and `--stack nextjs` searches.
From the results we kept **Minimalism & Swiss Style** (dark-mode ready, low
performance cost, low accessibility risk) and the **Before-After Transformation**
landing pattern. We rejected the suggested green "run" accent, the
FAQ-documentation pattern and the all-mono type pairing. The brief asks for a
Linear/Vercel/Raycast feel with one blue accent. **Update (Sept 2026):** the owner moved the visual style to a Google-style, light-first look; §2–4 below reflect that. Every colour pair below was
checked for WCAG contrast (ratios listed).

---

## 1. Design principles (in priority order)

1. **Effortless first.** The user is a tired student on a budget Android phone at 11pm, arriving from an Instagram ad. If they have to think, we lose them.
2. **One primary action per screen.** It is high-contrast and sits in the thumb zone on mobile. Everything else is secondary or hidden.
3. **Do the work for them.** Auto-fill, pre-select and default. The user confirms or tweaks, and rarely faces a blank field.
4. **Honest and explainable.** Loading copy says what is really happening. Every score shows its rubric. No fake telemetry, no invented numbers.
5. **Calm, not flashy.** Neutral surfaces, one accent, generous whitespace. Motion only shows progress or rewards the user.

### Screen self-check (run before calling a screen done)
1. Can a first-time user tell what to do within 3 seconds?
2. Is there exactly one primary action?
3. Did we ask for anything we could have auto-filled or defaulted?
4. Does it look and work well at 375px width (no horizontal scroll, 44px targets)?
5. Would it look at home in a Google product (Sites, Workspace) or Stripe?
6. Are loading, empty and error states designed, not left as defaults?

---

## 2. Colour

**Style: Google-style, Material 3 inspired** (owner decision, September 2026: "make
daylight the default … styling similar to Google Sites"). A clean white page, Google
greys, one blue (`#1A73E8`), tonal light-blue fills for selected and info states, soft
elevation shadows. Green, amber and red are **only** for status meaning, and always come
with an icon and text.

Tokens are CSS variables on `:root` (light) and `.dark` (dark) in `app/globals.css`,
exposed to Tailwind through `@theme inline`. **Never put raw hex in components.**

### Light theme (default)
| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--background` / `--card` | `#FFFFFF` | Page, cards | — |
| `--surface` | `#F8F9FA` | Alternate bands, stat tiles | — |
| `--muted` | `#F1F3F4` | Chips, skeletons, code | — |
| `--foreground` | `#202124` | Body and headings | 16.1 : 1 |
| `--muted-foreground` | `#5F6368` | Secondary text | 6.0 : 1 (5.4 on muted) |
| `--border` | `#DADCE0` | Dividers, card outlines (decorative) | — |
| `--input` | `#80868B` | Form control borders (needs 3:1) | 3.7 : 1 |
| `--primary` / `--accent-text` / `--ring` | `#1A73E8` | Primary fill, links, focus | white on it 4.5 : 1 |
| `--tonal` / `--tonal-foreground` | `#E8F0FE` / `#174EA6` | Selected chips, next-step card, info banners | 6.8 : 1 |
| `--success` / `--success-bg` | `#137333` / `#E6F4EA` | Passing, done | 5.2 : 1 |
| `--warning` / `--warning-bg` | `#9A5700` / `#FEF7E0` | Needs work | 5.2 : 1 |
| `--danger` / `--danger-bg` | `#C5221F` / `#FCE8E6` | Critical, destructive | 4.9 : 1 |

### Dark theme (Google dark)
| Token | Hex | Contrast |
|---|---|---|
| `--background` | `#202124` | — |
| `--surface` / `--card` / `--muted` | `#28292C` / `#2D2E31` / `#35363A` | — |
| `--foreground` | `#E8EAED` | 13.4 : 1 |
| `--muted-foreground` | `#9AA0A6` | 6.1 : 1 (5.1 on card) |
| `--input` | `#80868B` | 4.4 : 1 |
| `--primary` / `--accent-text` | `#8AB4F8` (dark text on it) | 7.6 : 1 |
| `--tonal` / `--tonal-foreground` | `#394457` / `#D2E3FC` | 7.5 : 1 |
| `--success` / `--warning` / `--danger` | `#81C995` / `#FDD663` / `#F28B82` on 12% tints | 8.2 / 11.5 / 6.7 : 1 |

`--brand` (`#1A73E8`) is the logo mark and stays the same in both themes.

### Colour rules
- Blue is **only** for the primary action, progress, links, focus and the selected state. Tonal blue is for "you are here" and "next step" surfaces.
- No gradient text, glow blobs or glassmorphism.
- Status never relies on colour alone: always icon + label.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Sans (UI and headings) | **Google Sans Flex** (OFL, self-hosted woff2 via `next/font/local`, preloaded) | Fallback: `Roboto, system-ui, sans-serif` |
| Mono (scores, code, day counters) | **Google Sans Code** (OFL, self-hosted, not preloaded) | `tabular-nums` for all changing numbers |

**Weights: 400 and 500 only** (Google style: headings are 400 at large sizes, 500 for
titles and emphasis). At most two weights per screen.

### Type scale (mobile → ≥768px)
| Token | Mobile | Desktop | Line height | Weight |
|---|---|---|---|---|
| `display` | 36px | 56px | 1.1 | 400 |
| `h1` | 28px | 40px | 1.2 | 400 |
| `h2` | 22px | 28px | 1.3 | 400–500 |
| `h3` | 18px | 20px | 1.35 | 500 |
| `body` | 16px | 16px | 1.6 | 400 |
| `caption` | 13px | 13px | 1.4 | 400 |

- Body text is never under 16px on mobile; inputs are 16px (stops iOS zoom).
- Headings use `text-wrap: balance`. Sentence case everywhere.

---

## 4. Spacing, layout and shape

- **4pt scale** (Tailwind defaults). **Gutter:** 16px under 640px, 24px above.
- **Content widths:** forms and practice pages `max-w-2xl`, app pages `max-w-3xl`, marketing `max-w-6xl`.
- **Breakpoints:** design at **375** first, then `sm 640`, `md 768`, `lg 1024`.
- **Radius:** 8 (chips) · 12 (inputs, small cards) · 16 (cards) · 20–28 (hero cards, sheets). **Buttons are pills** (`rounded-full`).
- **Buttons (Material 3):** filled (primary), tonal, outlined (secondary), text (ghost), destructive. Heights 40 / 44 / 48px.
- **Elevation:** borders for cards; Google shadows `shadow-e1` (resting raised), `shadow-e2` (hover), `shadow-e3` (sheets, sticky CTA, toasts).
- **App navigation:** tabs in the top bar on desktop; a Material bottom navigation bar (4 destinations, tonal pill on the active icon) on phones.
- **Z-index scale:** `base 0 · sticky 10 · header 20 · overlay 40 · sheet/modal 50 · toast 100`.
- Use `min-h-dvh`. Fixed bottom bars add `env(safe-area-inset-bottom)`.

---

## 5. Motion

Motion exists to **show progress and reward**. Examples: the score counting up,
the streak ticking over, the portfolio going live.

| Token | Duration | Use |
|---|---|---|
| `--dur-fast` | 120ms | Press feedback, hover, toggles |
| `--dur-base` | 200ms | Accordions, tabs, chip add/remove, crossfades |
| `--dur-slow` | 320ms | Sheets, page-level reveals, score count-up per step |
| **Max** | **400ms** | Nothing longer, ever |

- Easing: enter `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo). Exit `cubic-bezier(0.7, 0, 0.84, 0)`, at about 65% of the enter duration.
- Animate **transform and opacity only**. Never width, height, top or left.
- Scroll reveal: fade + 8–12px rise, once, 300ms. Stagger lists 40ms per item, capped at 6 items.
- At most 1–2 animated elements per view. Animations never block input and can always be interrupted.
- **`prefers-reduced-motion: reduce`:** remove transforms, keep instant opacity changes, show final states (the score shows its final number immediately).
- Library: CSS transitions first. Use `motion` (Framer Motion) only for the score reveal, streak increment and publish celebration, and lazy-load it. No GSAP.
- Celebrations: short (≤ 400ms), one confetti-free check or burst drawn in accent. They never auto-play sound and never block the next action.

---

## 6. Iconography and imagery

- **Lucide** icons only, stroke width 1.75, sized 16 / 20 / 24. No emoji as icons.
- Decorative icons next to text get `aria-hidden`. Icon-only buttons need an `aria-label` and a 44×44 hit area.
- Images: `next/image`, AVIF/WebP, explicit width and height (no layout shift), lazy-loaded below the fold. The hero visual is SVG/HTML (not a video) and must stay light.

---

## 7. Components (shadcn/ui base, restyled with the tokens above)

### Buttons
| Variant | Style | Rule |
|---|---|---|
| `primary` | `--primary` fill, white text, 600 weight | **One per screen** |
| `secondary` | `--card` fill, `--border` outline, foreground text | Supporting actions |
| `ghost` | No fill, `muted-foreground` → `foreground` on hover | Tertiary and nav |
| `destructive` | `--danger` text + outline. Solid only inside the confirm step | Kept apart from primary |
| `link` | `--accent-text`, underline on hover and focus | Inline |

- Heights: **48px on mobile for primary**, 44px for other buttons; 40px is allowed for desktop secondary. Full width on mobile for the primary action.
- Loading: keep the label, add an inline 16px spinner, disable the button, set `aria-busy`. The width must not change.
- Press: `scale(0.98)` for 120ms.

### Forms
- Visible label above every input. Helper text below. The error replaces the helper, in `--danger`, linked with `aria-describedby`.
- Inputs are 48px tall on mobile, 16px text, with `--input` border and `--ring` focus. Use `autocomplete`, `inputmode` and the right `type`.
- Validate on blur, not on every keystroke. After a failed submit, focus the first invalid field.
- **Auto-filled fields** get a small "From your resume" tag (`muted` chip with a sparkle-free `FileText` icon). The tag disappears once the user edits the field.
- Chip input for skills: Enter or comma adds a chip, backspace on empty removes the last one. Chips wrap and never scroll sideways.
- Group sections with `fieldset` / `legend`. On mobile, long forms become collapsible sections, with the first one open.

### Surfaces
- **Card:** `--card`, 1px `--border`, `lg` radius, 16px padding on mobile, 24px on desktop.
- **Bottom sheet (mobile) / Dialog (≥768px):** built from one responsive component (shadcn `Drawer` via vaul, plus `Dialog`). Includes a drag handle, a close button, focus trap, and Esc/swipe to dismiss. If there are unsaved edits, confirm before dismissing.
- **Sticky bottom action bar (mobile):** `--background` at 95% opacity with backdrop blur (the only blur allowed), top border, safe-area padding. Holds the one primary action.
- **Toasts:** `sonner`, bottom-centre on mobile, bottom-right on desktop, 4 seconds, `aria-live="polite"`. Undo toasts for destructive actions last 6 seconds.

### Feedback and states (required on every screen)
- **Loading:** skeletons shaped like the final content (`--muted` with a subtle shimmer that is off under reduced motion). For waits over 2 seconds (parsing, diagnostic), use an **honest step list**: "Reading your resume → Checking your projects against SDE-1 job descriptions → Scoring", with a check on each completed step. No spinners on their own for waits over 1 second.
- **Empty:** one line saying what goes here, one line of why it matters, one action.
- **Error:** what happened in plain words, then one clear fix ("Try again", "Upload a different file"). Never a raw error code alone.
- **Success:** a short check animation plus the next step.

### Domain components
- **Status pill:** `Passing` (success), `Needs work` (warning), `Critical` (danger), `Not assessed` (muted). Tinted background + icon + label, 28px tall, `full` radius.
- **Score:** Google Sans Code tabular numbers, `score-xl`, shown as `54` over `/100` in muted text. Always shown next to the **"LaunchPad Rubric Target: 85"** marker on a thin horizontal bar (not a gauge, which is harder to read at 375px). Tapping it opens "How this was scored".
- **Pillar card:** status pill → score bar vs target → "What a screener notices" → "How to fix it" → an expandable "How this was scored" checklist (✓ met / ✕ not met, per rubric item). Locked pillars show the title and status pill only, with the body blurred at 6px and `aria-hidden`, plus a screen-reader-only text saying it is locked.
- **Stepper (onboarding flow):** a compact "Step 2 of 4 · ~1 min" text plus a thin segmented bar on mobile. Full labelled horizontal stepper on desktop.
- **Streak grid:** 14 cells (2 rows × 7 on mobile, 1 × 14 on desktop). States: `done` (accent fill + check), `today` (accent ring), `missed` (muted + dash), `locked` (border only). Each cell has an accessible label ("Day 4, completed").
- **Day / task card:** day number in mono, title, time estimate ("~45 min"), one primary action.
- **Attached-file card:** file icon, name (wraps), size and format in mono caption, actions: View extracted text (collapsible), Replace, Remove (with undo).
- **Price display:** `₹299` in the sans at weight 500. The line below reads "One-time · UPI, cards, netbanking". The refund line always sits next to the pay button.

---

## 8. Layout patterns by screen

### Landing (Before-After Transformation pattern)
1. **Hero:** headline (≤ 8 words), subline (one sentence), primary CTA **"Upload resume — free"**, reassurance line ("Takes 2 min · No sign-up · Your resume stays private"), and the before → after visual below. At 375px the CTA sits above the fold, with the visual stacked underneath.
2. How it works: 3 steps (Portfolio in minutes → Honest diagnostic → Real project in 14 days), each with a time estimate.
3. Sample portfolios: 3 demo profiles as phone-frame previews, stacked vertically on mobile (no carousel).
4. Pricing: from `config/pricing.ts`, Free first, bundle marked "Best value".
5. FAQ accordion.
6. Final CTA plus a footer.
- The mobile sticky bottom CTA appears once the hero CTA scrolls out of view, and hides when the final CTA is visible.

### Onboarding flow (upload → profile → template → publish)
- A single column with the stepper at the top and the primary action in the sticky bottom bar. Back never loses input.

### App (report, program, day)
- Mobile: top bar (logo, title, menu) and content, with no bottom tab bar until Phase 4 (then at most 4 items: Portfolio, Report, Program, Profile).
- Desktop ≥1024px: a left sidebar for the same destinations, with content at `max-w-3xl`.

### Public portfolio `/p/[slug]`
- Three templates (Minimal, Developer, Bold) share these tokens, so they stay theme-aware. Bold may use a larger display size and a full accent hero band. Nothing else changes.

---

## 9. Theme system
- `light | dark | system`, stored in `localStorage` under `launchpad_theme`. The default is **light** (owner decision); dark and system remain one tap away.
- An inline anti-flash script in `<head>` of the root layout reads the stored value (or `prefers-color-scheme`) and sets `class="dark"` and `style="color-scheme: dark|light"` on `<html>` before first paint. The whole thing sits in try/catch.
- Desktop: a single icon toggle (sun/moon, with the `aria-label` reflecting the next state). Mobile menu: a 3-way segmented control (Light / Dark / System).

---

## 10. Voice and copy
- Plain, direct, friendly. Short sentences. Second person.
- Say what it means: "Your projects look like common tutorial clones", not "Low uniqueness entropy".
- Always show the next step and the time it takes: "Next: pick a template · ~30 sec".
- Reassure at anxious moments: next to uploads ("Your resume stays private. Delete it anytime."), next to payment (what exactly they get, UPI supported, the refund line), and after errors (what happened and one fix).
- Never: fake urgency, countdown timers, "AI-powered magic", invented statistics, or social proof we can't back up.

---

## 11. Anti-patterns (reject in review)
- Two competing primary buttons on one screen.
- Gradient text, glow blobs, glassmorphism stacks, decorative particle backgrounds.
- Emoji used as icons. Colour-only status.
- Spinners for waits over 1 second, loading copy that doesn't match what the system is doing, fake progress percentages.
- Modals on mobile (use sheets). Horizontal scroll. Tap targets under 44px.
- Carousels for important content, auto-playing video, pop-ups, exit-intent upsells.
- Placeholder-only labels, and clearing input on navigation.
- More than two font weights on a screen, or raw hex in components.

---

## 12. Pre-delivery checklist
- [ ] 375px: no horizontal scroll, primary CTA visible in the thumb zone, all targets ≥ 44px
- [ ] Light and dark both checked: text ≥ 4.5:1, UI borders and focus ≥ 3:1
- [ ] Visible focus ring on every interactive element, logical tab order, skip link
- [ ] `prefers-reduced-motion` respected; no animation over 400ms
- [ ] Loading (skeleton / honest steps), empty and error states present
- [ ] Exactly one primary action
- [ ] Images sized (no layout shift), below-fold content lazy-loaded, Lighthouse mobile ≥ 90
- [ ] Copy is plain language and states the next step with a time estimate
