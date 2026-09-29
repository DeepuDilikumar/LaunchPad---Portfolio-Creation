# LaunchPad — Project Guide for Claude

Read this first in every session. The visual rules live in
`design/DESIGN_SYSTEM.md`. Follow it for every screen. Component sources are in
`design/COMPONENT_SOURCING.md`.

## How we work
- Build **one phase at a time** (see "Build phases"). After each phase, stop, summarise what was built, and wait for the owner's go-ahead.
- Every screen ships with seed/demo data and designed **loading, empty and error** states. Every phase's PR description includes a short manual test checklist.
- Always think from the customer's point of view. The UI must feel premium and never overwhelming.
- Design tooling: use the UI UX Pro Max skill (`.claude/skills/ui-ux-pro-max`) for design questions, and the 21st.dev MCP server (`.mcp.json`, key from the `API_KEY_21ST` env var) to source components. Adapt 21st components to our tokens; never use them raw. **Never write the 21st API key, or any other secret, into a file.**

---

## 1. Product overview

**Name:** LaunchPad
**One-liner:** Upload your resume → get a live portfolio in 2 minutes → find out exactly why you're not clearing product-company screens → build one real, production-grade project in 14 days with a genuine GitHub history.

**Target user:** Indian engineering students (final year, tier 2/3 colleges) and developers with 0–2 years' experience who are targeting product companies (Swiggy, Razorpay, CRED, Postman, etc.). Mostly on mobile, arriving from Meta ads, price-sensitive, anxious about placements.

**Core promise**
- In minutes: a live portfolio site and an honest diagnostic of their profile.
- In 14 days: a real standout project they built themselves, with real daily commits, and the ability to defend every decision in an interview.

**Business model** (all prices live in one config file: `config/pricing.ts`)
- Free: resume upload, portfolio site, overall score + 1 pillar preview.
- ₹299 one-time: full 5-pillar diagnostic report + ATS resume rewrite (PDF + LaTeX).
- ₹799 one-time: 14-Day Build Program (project scaffold, daily tasks, streak tracker, interview defense notes, LinkedIn/cold pitch generator).
- Bundle: ₹999 for both.

## 2. Tech stack
- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui.
- **Database/Auth/Storage:** Supabase (Postgres; Auth with Google and GitHub OAuth; Storage for resumes).
- **LLM:** a single server-side adapter, `lib/llm.ts` (default: Anthropic Claude API, key from an env var). **Never call the LLM from the client.** All prompts live in `lib/prompts/`.
- **Resume parsing:** `pdfjs-dist` (PDF), `mammoth` (DOCX), plain-text fallback.
- **GitHub:** GitHub OAuth App + Octokit (repo creation; reading commits to verify streaks).
- **Payments:** Razorpay (Checkout + server-side signature verification + webhook).
- **PDF generation:** `@react-pdf/renderer` for the ATS resume.
- **Deploy:** Vercel.
- **Analytics:** Meta Pixel + a simple event logging table (`upload`, `portfolio_created`, `teaser_viewed`, `checkout_started`, `paid`, `day_completed`).

## 3. Design direction
- **Mobile-first.** Design every screen at 375px first, then scale up. Most traffic comes from Instagram and Facebook ads.
- **Feel:** a confident, modern developer tool, in the vein of Linear, Vercel and Raycast. Clean, dark-mode-friendly, sharp typography, subtle motion. Not "AI slop" gradients everywhere.
- **Typography:** one strong sans (Geist Sans) and a mono (Geist Mono) for code and scores.
- **Colour:** neutral base, one accent (electric blue). Semantic green, amber and red **only** for pillar statuses.
- **Theme:** light / dark / system, saved in `localStorage` under `launchpad_theme`. An inline anti-flash script in the root layout applies the right theme before React renders. Desktop: a single icon toggle. Mobile menu: a 3-way segmented control.
- **Motion:** used to show progress and reward (score reveal, streak increments, portfolio going live). Under 400ms, and respects `prefers-reduced-motion`.
- **Accessibility:** WCAG AA contrast in both themes, keyboard navigable, visible focus states, labelled inputs.

### 3.1 UX principles: clean, modern, effortless
Design every screen for a tired final-year student on a budget Android phone,
opening this from an Instagram ad at 11pm. If they have to think, we've lost them.

- **Minimum effort to value.** From the landing page to a live portfolio in at most 3 taps plus one file upload. No account is needed until the moment they publish.
- **One primary action per screen.** One clear, high-contrast button; everything else is secondary or hidden. Never two competing CTAs.
- **Do the work for them.** Auto-fill from the resume, pre-select the best template, write the summary, suggest the best project. The user only confirms or tweaks, and rarely starts from a blank field.
- **Progressive disclosure.** Essentials first. Details, rubrics and advanced options go behind "Show more" or expandable sections.
- **Plain language.** No jargon. Write "Your projects look like common tutorial clones", not "Low uniqueness entropy". Short sentences, friendly but direct.
- **Always show where they are and what's next.** A simple step indicator, a clear "next" suggestion at the end of every screen, and time estimates ("takes 2 min", "~45 min today").
- **Thumb-friendly mobile layout.** Primary actions in the bottom thumb zone, tap targets of at least 44px, bottom sheets instead of modals on mobile, no horizontal scrolling.
- **Fast and calm.** Skeleton loaders instead of spinners, optimistic UI where safe, pages interactive in under 2 seconds on 4G. No auto-playing video, pop-ups or aggressive upsell interruptions.
- **Clean visual hierarchy.** Generous whitespace, at most 2 font weights per screen, a consistent spacing scale, restrained colour (accent only for actions and progress). No clutter, glassmorphism overload, or decorative animation that slows things down.
- **Reassurance at anxious moments.** Near uploads: "Your resume stays private". Near payment: exactly what they get, UPI supported, and a refund line. After errors: what happened and one clear way to fix it.
- **Forgiving by default.** Auto-save everything, undo for destructive actions, never lose input on back navigation or refresh.
- **Celebrate progress.** Small, quick moments of delight when the portfolio goes live, the report unlocks, or a day is completed.

**Self-check for every screen before marking it done**
1. Can a first-time user tell what to do within 3 seconds?
2. Is there exactly one primary action?
3. Did we ask for anything we could have auto-filled or defaulted?
4. Does it look and work well at 375px width?
5. Would this screen look at home in Linear, Vercel or Stripe's product?

## 4. Non-negotiable product rules
1. **Honesty in the UI.** Loading states describe what's actually happening ("Reading your resume", "Checking your projects against SDE-1 job descriptions", "Scoring"). No fake technical telemetry.
2. **Explainable scores.** Every score shows how it was calculated (rubric criteria met / not met). The target line is called the **"LaunchPad Rubric Target"** (85), never an industry standard. Scores are computed deterministically in code from rubric items the LLM returns; the LLM never invents the number.
3. **Real commits only.** The platform never creates backdated commits, never edits commit authors or dates, and never pushes code on the user's behalf, except the single initial scaffold commit, clearly labelled `chore: initial scaffold generated by LaunchPad`. The 14-day history comes from the user's own daily work.
4. **Privacy.** Resumes contain personal data. Store them in a private Supabase bucket, let users delete their data with one click, and **never log resume content** (not in console, error trackers or analytics props).
5. **State never gets lost.** Draft form state persists in `localStorage` (`launchpad_draft_state`) before login and syncs to Supabase after login. Back/forward navigation never clears inputs.

Also enforced in code review:
- The LLM must not invent metrics. Missing numbers become highlighted placeholders like `[X% improvement]`.
- LLM-generated text about a user's project (defense questions, LinkedIn posts, resume bullets) references only work they actually did (completed days, real commits, README).
- Payment unlocks happen only after server-side verification (signature or webhook), must be idempotent, and must survive refresh and a webhook that arrives before the redirect.

---

## Build phases
1. **Foundation:** Next.js setup, design system, theme system, layout, landing page (Feature A), Supabase auth, price config file.
2. **The free hook:** resume upload and auto-fill (Feature B), portfolio generator and public pages (Feature C).
3. **First revenue:** diagnostic with teaser and paywall (Feature D), Razorpay, ATS resume rewrite and export (Feature E).
4. **The program:** project catalog and GitHub scaffold (Feature F), 14-day tracker with verification and reminders (Feature G).
5. **Outcomes:** interview defense (Feature H), LinkedIn and cold pitch engine (Feature I).
6. **Polish:** Meta Pixel events, OG images, performance pass, accessibility pass, empty/error states, account deletion.

Full feature specs, user journeys and acceptance criteria are in `docs/FEATURES.md`.
The folder structure and data model are in `docs/ARCHITECTURE.md` (check its status line before building).
