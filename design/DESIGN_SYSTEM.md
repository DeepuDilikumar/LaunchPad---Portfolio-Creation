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
Linear/Vercel/Raycast feel with one blue accent. Every colour pair below was
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
5. Would it look at home in Linear, Vercel or Stripe?
6. Are loading, empty and error states designed, not left as defaults?

---

## 2. Colour

Neutral zinc base, **one accent (electric blue)**. Green, amber and red are
**only** for pillar and status meaning, and always come with an icon and text.

Tokens are CSS variables on `:root` (light) and `.dark` (dark), exposed to
Tailwind through shadcn/ui's `hsl(var(--token))` convention. **Never put raw hex
in components.**

### Light theme
| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--background` | `#FFFFFF` | Page | — |
| `--surface` | `#FAFAFA` | Alternate section band | — |
| `--card` | `#FFFFFF` | Cards (with border, not shadow) | — |
| `--muted` | `#F4F4F5` | Chips, skeletons, code blocks | — |
| `--foreground` | `#09090B` | Body and headings | 19.9 : 1 |
| `--muted-foreground` | `#52525B` | Secondary text, captions | 7.7 : 1 (7.0 on muted) |
| `--border` | `#E4E4E7` | Dividers, card outlines (decorative) | — |
| `--input` | `#71717A` | Form control borders (needs 3:1) | 4.8 : 1 |
| `--primary` | `#2563EB` | Primary button fill, progress, selected | white on it 5.2 : 1 |
| `--primary-foreground` | `#FFFFFF` | Text on primary | — |
| `--accent-text` | `#1D4ED8` | Links, accent text | 6.7 : 1 |
| `--ring` | `#2563EB` | Focus ring | 5.2 : 1 |
| `--success` / `--success-bg` | `#15803D` / `#F0FDF4` | Passing | 5.0 : 1 (4.8 on tint) |
| `--warning` / `--warning-bg` | `#B45309` / `#FFFBEB` | Needs work | 5.0 : 1 (4.8 on tint) |
| `--danger` / `--danger-bg` | `#B91C1C` / `#FEF2F2` | Critical, destructive | 6.5 : 1 (5.9 on tint) |

### Dark theme
| Token | Hex | Contrast |
|---|---|---|
| `--background` | `#09090B` | — |
| `--surface` | `#0F0F12` | — |
| `--card` | `#18181B` | — |
| `--muted` | `#1F1F23` | — |
| `--foreground` | `#FAFAFA` | 19.1 : 1 |
| `--muted-foreground` | `#A1A1AA` | 7.8 : 1 (6.9 on card) |
| `--border` | `#27272A` | decorative |
| `--input` | `#71717A` | 4.1 : 1 |
| `--primary` | `#2563EB` | white on it 5.2 : 1 (same fill in both themes on purpose) |
| `--accent-text` | `#60A5FA` | 7.8 : 1 (7.0 on card) |
| `--ring` | `#60A5FA` | 7.8 : 1 |
| `--success` / `--success-bg` | `#4ADE80` / `rgba(74,222,128,.10)` | 10.2 : 1 |
| `--warning` / `--warning-bg` | `#FBBF24` / `rgba(251,191,36,.10)` | 10.6 : 1 |
| `--danger` / `--danger-bg` | `#F87171` / `rgba(248,113,113,.10)` | 6.4 : 1 |

Dark mode uses its own tonal values, not inverted light colours.

### Colour rules
- The accent is **only** for the primary action, progress, links, focus and the selected state. Never for decoration.
- No gradient text, glow blobs or rainbow backgrounds. One exception: a single, very subtle radial wash behind the landing hero visual is allowed (≤ 6% opacity accent).
- Status never relies on colour alone: always icon + label (`Passing ✓`, `Needs work !`, `Critical ✕`, drawn as Lucide icons, not emoji).
- "Before" visuals (the messy resume) use greys. "After" (the portfolio) uses real UI. The contrast between them is the story.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Sans (UI and headings) | **Geist Sans** (`geist` package via `next/font`, self-hosted) | Fallback: `Inter, system-ui, sans-serif` |
| Mono (scores, code, day counters, prices) | **Geist Mono** | `font-variant-numeric: tabular-nums` for all changing numbers |

The skill's closest match was an Inter single-family system (developer and
premium mood). Geist is the same style, is Vercel's own face, self-hosts through
`next/font` with no layout shift, and ships a matching mono.

**Weights: only 400 and 600.** At most two weights per screen.

### Type scale (mobile → ≥768px)
| Token | Mobile | Desktop | Line height | Weight | Tracking |
|---|---|---|---|---|---|
| `display` | 36px | 56px | 1.05 | 600 | -0.03em |
| `h1` | 28px | 40px | 1.15 | 600 | -0.02em |
| `h2` | 22px | 28px | 1.25 | 600 | -0.015em |
| `h3` | 18px | 20px | 1.35 | 600 | -0.01em |
| `body` | 16px | 16px | 1.6 | 400 | 0 |
| `body-sm` | 14px | 14px | 1.5 | 400 | 0 |
| `caption` | 13px | 13px | 1.4 | 400 | 0 |
| `score-xl` (mono) | 56px | 72px | 1 | 600 | -0.02em |

- Body text is never under 16px on mobile. Inputs are 16px, which stops iOS zooming in.
- Line length: 35–60 characters on mobile, ≤ 70 on desktop (`max-w-prose`).
- Headings use `text-wrap: balance`. No forced `<br>`.
- Label and overline style: 13px, 400, `muted-foreground`, sentence case. No shouty all-caps blocks.

---

## 4. Spacing, layout and shape

- **4pt scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 (Tailwind defaults).
- **Page gutter:** 16px under 640px, 24px at 640–1023px, 32px at 1024px and up.
- **Content widths:** reading and forms `max-w-xl` (576px). App pages `max-w-3xl`. Marketing `max-w-6xl`.
- **Section rhythm (marketing):** 64px vertical padding on mobile, 96px on desktop.
- **Breakpoints:** design at **375** first, then `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
- **Radius:** `sm 6px` (chips, inputs inside groups), `md 8px` (buttons, inputs), `lg 12px` (cards, sheets), `full` (pills, avatars).
- **Elevation:** borders first. Shadows only on floating layers:
  - `shadow-sm`: `0 1px 2px rgb(0 0 0 / .05)` (sticky bars)
  - `shadow-lg`: `0 8px 24px rgb(0 0 0 / .12)` (sheets, popovers). In dark mode add a 1px `--border` outline.
- **Z-index scale:** `base 0 · sticky 10 · header 20 · overlay 40 · sheet/modal 50 · toast 100`.
- Use `min-h-dvh`, not `100vh`. Fixed bottom bars add `padding-bottom: env(safe-area-inset-bottom)` and reserve matching space under the page content.

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
- **Score:** Geist Mono tabular numbers, `score-xl`, shown as `54` over `/100` in muted text. Always shown next to the **"LaunchPad Rubric Target: 85"** marker on a thin horizontal bar (not a gauge, which is harder to read at 375px). Tapping it opens "How this was scored".
- **Pillar card:** status pill → score bar vs target → "What a screener notices" → "How to fix it" → an expandable "How this was scored" checklist (✓ met / ✕ not met, per rubric item). Locked pillars show the title and status pill only, with the body blurred at 6px and `aria-hidden`, plus a screen-reader-only text saying it is locked.
- **Stepper (onboarding flow):** a compact "Step 2 of 4 · ~1 min" text plus a thin segmented bar on mobile. Full labelled horizontal stepper on desktop.
- **Streak grid:** 14 cells (2 rows × 7 on mobile, 1 × 14 on desktop). States: `done` (accent fill + check), `today` (accent ring), `missed` (muted + dash), `locked` (border only). Each cell has an accessible label ("Day 4, completed").
- **Day / task card:** day number in mono, title, time estimate ("~45 min"), one primary action.
- **Attached-file card:** file icon, name (wraps), size and format in mono caption, actions: View extracted text (collapsible), Replace, Remove (with undo).
- **Price display:** `₹299` in Geist Mono. The line below reads "One-time · UPI, cards, netbanking". The refund line always sits next to the pay button.

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
- `light | dark | system`, stored in `localStorage` under `launchpad_theme`. The default is `system`.
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
