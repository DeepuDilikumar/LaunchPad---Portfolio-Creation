# 21st.dev Component Shortlist

Candidates found with the 21st.dev MCP `search` tool. Search is free. **Fetching
the code (`get_component`) uses the daily quota**, so each component is fetched
in the phase that needs it, not all at once.

**Rules for using these components**
- Treat them as a structural starting point. Re-skin them to `design/DESIGN_SYSTEM.md` tokens: no raw hex, and remove gradients, glows and glass effects.
- Put the adapted component under `components/`, never under `components/ui/` as-is, and add a line at the top with its 21st.dev source URL.
- **Never write an install URL with a real key into a file, commit or log.** The 21st install commands look like `...?api_key=$API_KEY_21ST`. Only run them in a shell where the variable expands at runtime, or copy the code from `get_component`.
- If a candidate's code is paywalled or doesn't fit, build it from shadcn primitives instead. Don't force a fit.

| Need | Phase | First choice | Backup | How to adapt it |
|---|---|---|---|---|
| Landing hero with before → after visual | 1 | `serafimcloud/hero-with-mockup` (id 1492) | `vaib215/hero-with-product-mockup` (4710) | Keep the layout and staggered entrance. Remove the gradient text and glow. Replace the mockup with our own HTML/SVG before→after (a grey resume becomes a portfolio phone frame). Keep one CTA. |
| Pricing cards | 1 | `uilayout.contact/pricing` (6261) | `lyanchouss/pricing-cards` (7091) | Data from `config/pricing.ts`. 4 tiers stack on mobile. Mark the bundle "Best value" with a border, not a gradient. |
| Testimonial / social proof | 1 (optional) | `efferd/testimonials-section` (7267) | `uilayout.contact/testimonial` (6268) | **Only with real, consented quotes.** Until we have them, the landing page uses sample portfolios instead. |
| Resume dropzone | 2 | `joyco/file-dropzone` (19201) | `extend-hq/file-upload` (15587) | Single file, PDF/DOCX/TXT, max 5 MB, with inline error text. Once a file is attached it becomes the "Attached" card. Remove the image preview. |
| Onboarding stepper | 2 | `originui/stepper` (769) | `sean0205/c-stepper-1` (29925) | Compact "Step 2 of 4 · ~1 min" + segmented bar on mobile; the full stepper at md and up. |
| Honest loading step list | 3 | `sean0205/c-stepper-15` (29815), vertical with check/loading | — | Used for "Reading your resume → Checking projects → Scoring". |
| Score / pillar charts | 3 | `sean0205/c-chart-25` (30668), Lighthouse-style radial scores | `arihantcodes_1f7b8c4d/radial-chart` (28963) | Only for a desktop overview. The main score uses the horizontal bar with the Rubric Target marker (easier to read at 375px). Include a text/table alternative. |
| Streak calendar | 4 | `wensity/github-activity-grid` (31352) | `arihantcodes_1f7b8c4d/calendar-heatmap` (28204) | Cut to 14 cells (2×7 on mobile). States: done / today / missed / locked, each with an accessible label. The reveal ripple only runs when motion is allowed. |
| FAQ accordion, sheets, toasts, tabs, chips | 1–2 | shadcn/ui (`accordion`, `drawer` via vaul, `dialog`, `sonner`, `tabs`, `badge`) | — | Standard primitives; no 21st component needed. |
