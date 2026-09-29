# LaunchPad — Features, User Journeys and Build Specs

Section 5 of the original build prompt. Each feature has its user journey, the build spec and its acceptance criteria.

## Feature A — Landing page (Phase 1)
**Journey:** Priya, a final-year CSE student, taps a Meta ad on Instagram ("Your resume → a live portfolio in 2 minutes"). Above the fold she sees a before/after: a messy resume on the left, a sleek portfolio on the right, and one big button: "Upload resume — free". She scrolls a bit, sees how the 14-day program works and a few sample portfolios, then taps upload.

**Build**
- Hero with headline, subline, primary CTA and an animated before → after visual.
- "How it works" in 3 steps (Portfolio in minutes → Honest diagnostic → Real project in 14 days).
- Sample portfolios gallery (3 demo profiles).
- Pricing section (from config).
- FAQ, including "Do you write the project for me?" → "No, you build it with daily guidance, so you can defend it in interviews".
- Sticky bottom CTA on mobile.

**Acceptance:** Lighthouse mobile performance ≥ 90; CTA visible without scrolling at 375px.

## Feature B — Resume upload and auto-fill (Phase 2)
**Journey:** Priya drops her PDF. Within 2 seconds her name, college, graduation year, skills and projects appear in a form. A banner says "We filled 9 fields from your resume — check them below." She changes her target role from "Full Stack" to "Backend", adds her GitHub username and taps Continue. If she goes back later, everything, including the attached file, is still there.

**Build**
- Dropzone (PDF/DOCX/TXT, max 5 MB), with manual entry as an alternative.
- Tier 1 (instant, client-side): the `extractResumeProfile()` heuristic parser finds name (stripping words like "Resume"/"CV"), email, phone, college, graduation year, target role, skills (languages / frameworks / databases / tools), projects, experience, and GitHub/LinkedIn links.
- Tier 2 (background): `POST /api/resume/extract-profile` sends the extracted text to the LLM for structured JSON refinement. Results merge **only** into fields the user hasn't edited.
- A dismissible banner lists which fields were auto-filled.
- Once a file is attached, the dropzone becomes an "Attached" card: file name, size, detected format, and actions: View extracted text (collapsible), Replace, Remove.
- An editable profile form, grouped into sections, with chip inputs for skills.

**Acceptance:** the parser handles single-column and two-column PDFs gracefully; back and forward navigation never loses data; manual edits are never overwritten by the background refinement.

## Feature C — Instant portfolio site (free hook) (Phase 2)
**Journey:** after confirming her profile, Priya picks one of 3 templates (Minimal, Developer, Bold), shown as live mobile previews. She taps "Publish" and within seconds gets a link: `launchpad.app/p/priya-nair`. A celebratory moment shows the link with "Copy link", "Share on WhatsApp" and "Add to LinkedIn". Below, a card says: "Your portfolio is live. Want to know if it clears a Razorpay screen? See your score →".

**Build**
- 3 templates, all responsive, SEO-friendly (OpenGraph image generated per user) and theme-aware.
- Sections: hero (name, role, one-line summary written by the LLM from their resume), skills, projects (with GitHub links), experience, education, contact.
- Public route `/p/[slug]`, server-rendered and fast.
- Editor: reorder sections, edit text inline, toggle sections, switch template without losing content.
- Login (Google or GitHub) is required at publish time; everything before this works without an account.
- LaunchPad-built projects (from Feature F) appear automatically with a "Built in 14 days" badge, and a live progress bar while in progress.

**Acceptance:** publish-to-live under 5 seconds; portfolio page scores ≥ 90 on Lighthouse mobile.

## Feature D — 5-pillar diagnostic (free teaser + paid report) (Phase 3)
**Journey:** Priya taps "See your score". A short, honest progress screen shows what's being checked. She sees her overall score (e.g. 54/100) and one fully unlocked pillar: "Project uniqueness — Critical: your top 2 projects are a weather app and a to-do app, which screeners filter out." The other 4 pillars are blurred, with their status pills visible. A button reads "Unlock full report + ATS resume — ₹299". She pays by UPI through Razorpay and the full report reveals with an animation.

**Pillars**
1. **Project uniqueness:** flags common clones (weather, todo, bookstore, Netflix clone, etc.).
2. **Architectural depth:** evidence of caching, queues, indexing, auth, failure handling, testing.
3. **ATS readability:** single column, standard headings, no tables/images for text, parseable dates, keyword coverage for the target role.
4. **GitHub signal:** if GitHub is connected: real activity consistency, README quality, pinned repos, commit message quality. If not connected: "Not assessed" with a connect button.
5. **Interview defense readiness:** can their projects support system-design follow-up questions?

**Build**
- Each pillar card: score vs the LaunchPad Rubric Target (85), status pill (Passing / Needs work / Critical), "What a screener notices", "How to fix it" (specific and actionable), and an expandable "How this was scored" rubric checklist.
- Scoring: the LLM returns structured JSON against a fixed rubric in `lib/prompts/diagnostic.ts`. The score is computed deterministically in code from the rubric items, not invented by the LLM.
- Paywall: overall score + 1 pillar free; everything else unlocks after payment.
- Razorpay: create the order server-side, verify the signature server-side, confirm via webhook, then unlock. Handle failures and retries gracefully.
- Downloadable report as PDF.

**Acceptance:** the same resume produces the same score (±3) on reruns; the payment unlock survives a page refresh and works if the webhook arrives before the redirect.

## Feature E — ATS resume rewrite and export (Phase 3)
**Journey:** inside the paid report, Priya taps "Fix my resume". She sees her original bullets side by side with rewritten ones that use metrics and strong verbs. She accepts some, edits others, and taps Download PDF. She also copies the LaTeX source to open in Overleaf.

**Build**
- Bullet-by-bullet rewrite with accept / edit / reject per bullet.
- The LLM must not invent numbers: when a metric is missing, it inserts a placeholder like `[X% improvement]`, highlighted for the user to fill in or remove.
- Single-column ATS-safe template, standard section headings, live preview (bottom sheet on mobile, side panel on desktop).
- Export: PDF (`@react-pdf/renderer`) and LaTeX source (copy + download `.tex`).

**Acceptance:** the exported PDF's text is fully selectable and parses correctly when pasted into a plain-text ATS checker.

## Feature F — Standout project selection and repo scaffold (Phase 4)
**Journey:** Priya buys the 14-Day Build Program. She sees 5 project options matched to her target role and current skills, e.g. "Distributed Webhook Delivery Engine", "Job Queue with BullMQ + Redis", "RAG Search over College Notes", "Rate-Limited Payment Gateway Simulator", "Real-time Collaborative Code Pad". Each card shows difficulty, tech stack, what interviewers will ask about it, and which companies' job descriptions it maps to. She picks the webhook engine, connects GitHub, and in under a minute a repo appears in her account with a starter scaffold, a README, an `ARCHITECTURE.md` and a `ROADMAP.md` for the 14 days.

**Build**
- Project catalog as structured data in `content/projects/*.ts` (title, description, stack, 14 daily tasks, interview questions, architecture notes, JD mapping). Start with 5 fully written projects.
- Recommendation: rank projects by fit with the user's target role and the skill gaps from the diagnostic.
- GitHub OAuth (scope: `public_repo`) → create a repo under the user's account → push one initial commit clearly labelled `chore: initial scaffold generated by LaunchPad`.
- The scaffold includes working boilerplate, `.env.example`, a Docker Compose file where relevant, a README with a "Built with LaunchPad 14-Day Program" note, and `ROADMAP.md`.

**Acceptance:** repo creation works for new and existing GitHub accounts; errors (name taken, token expired) show clear recovery steps.

## Feature G — 14-day build tracker (Phase 4)
**Journey:** every morning Priya gets a reminder (email for now) with the day's task: "Day 4: Add retry with exponential backoff to failed webhook deliveries (~45 min)". The Day 4 screen has the goal, why it matters in interviews, step-by-step guidance, hints, and a "Stuck? Ask the mentor" chat that explains concepts without dumping full solutions. She writes the code, commits and pushes. Back in LaunchPad she taps "Verify today's work"; the app checks her repo, finds her commit, marks Day 4 complete, and her streak goes to 4. Her portfolio's project card updates to "Day 4 of 14". If she misses a day she can catch up, and the streak shows honestly.

**Build**
- Dashboard: 14-day calendar/streak grid, today's task card, overall progress, time estimates.
- Day screen: goal, why it matters, guided steps, hints (revealed progressively), acceptance checklist, and "Defend it" notes (the interview questions this day's work prepares them for).
- Mentor chat: an LLM whose system prompt makes it teach and review, giving code only in small snippets tied to the current step.
- Verification: use the GitHub API to check for commits by the user on the project repo since the day was unlocked. Optionally the LLM lightly reviews the diff against the day's acceptance checklist and gives feedback.
- Daily reminder emails (Resend, or Supabase + cron) at a time the user sets.
- Completing all 14 days unlocks a completion certificate page and a "Project complete" badge on the portfolio.

**Acceptance:** verification only counts genuine commits pushed after the day was unlocked; streak and progress survive across devices.

## Feature H — Interview defense prep (Phase 5)
**Journey:** on Day 14 Priya opens "Defend your project". She gets 15 interview questions about her own build (e.g. "What happens if the receiving server is down for 2 hours?"). She answers by typing or voice-to-text, and gets feedback on clarity, depth and tradeoffs, plus a model answer outline based on what she actually built.

**Build**
- Questions generated from the project's architecture notes, her actual commit history and her README.
- Answers scored against a rubric (correctness, tradeoffs mentioned, failure modes, clarity).
- Mock interview mode: timed, one question at a time.

## Feature I — LinkedIn and cold pitch engine (Phase 5)
**Journey:** with her project done, Priya taps "Announce it". She gets a LinkedIn post draft about what she built and learned, 3 resume bullets for the project, and a cold DM template for engineering managers at her target companies. All are editable, with one-tap copy.

**Build**
- Generators for: LinkedIn post (3 tone options), project resume bullets (added to the Feature E resume automatically), cold DM / email templates, LinkedIn headline + About section.
- All outputs reference only work she actually did (from her completed days and repo).
