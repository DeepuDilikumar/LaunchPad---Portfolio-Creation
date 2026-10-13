# Interview Guide Store — Build Plan

13 Oct 2026 · @Deepu

> Decisions taken during the build are in [DECISIONS.md](DECISIONS.md). Build status per phase is in [README.md](README.md#phase-status).

## Summary

Build a store that sells follow-up-focused interview guides to working engineers who are switching jobs, and beat HelpMeSwitch on trust, proof and interactivity, not on price.

- **Who:** engineers in India with 2–8 years of experience planning a switch. They earn a salary and usually have an interview date. Freshers are out of scope for now: low budget, and a separate product later.
- **What (v1):** one flagship guide (Backend + system design follow-ups), a free 2-minute Readiness Check, and a fast, honest storefront.
- **What (v2):** an AI follow-up drill that asks the follow-ups a PDF can't. This is the moat.
- **The bet:** HelpMeSwitch proved that ₹499 interview PDFs sell to Indian engineers through Meta ads. It is anonymous, shows no proof, has no organic traffic and no interactivity. Each of those is an opening.
- **Money target:** ₹50,000/month profit ≈ 130 orders a month at an ₹800 average order, ₹400 ad cost and about ₹20 in fees per order. These are assumptions to validate in Phase 4.

## Positioning: who buys and how we win

Sell to engineers who already earn and are actively switching. They have money, a deadline and a big payoff, so ₹499–₹999 is an easy yes.

**The buyer**

- Has 2–8 years of experience in India, often at an IT services company or a mid-size product company, aiming for a product company.
- Has an interview in the next 1–4 weeks, or is about to start applying.
- Gets through the first answer, then stalls when the interviewer drills into "why", "what broke" and "what did you personally decide".
- Finds us on Instagram or LinkedIn, almost always on a phone.

Freshers are excluded on purpose: less money and a different pain (getting shortlisted, not surviving follow-ups).

**Where we beat HelpMeSwitch**

| Gap             | HelpMeSwitch today                                        | What we do                                                                                      |
| --------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Trust           | Anonymous: no author, business name or address            | Author page with real experience, photo and LinkedIn (if named), business details in the footer |
| Proof           | One "230+ kits sold" line; no reviews anywhere            | Ask every buyer for a review on day 7; show reviews with name, role and years, with consent     |
| Interactivity   | Static PDFs                                               | An interactive sample question on every page now; an AI follow-up drill in v2                   |
| Lead capture    | Ad → buy or bounce                                        | Free Readiness Check → email → a 3-email sequence                                               |
| Organic traffic | None                                                      | A /learn hub of free follow-up articles for high-intent searches                                |
| Honest pricing  | A permanent "festive" sale whose timer resets at midnight | Real prices; launch discounts with a fixed end date                                             |
| Updates         | Not guaranteed                                            | Free updates for 12 months, with a public changelog                                             |
| Piracy          | Plain PDFs through a third-party platform                 | Every PDF stamped with the buyer's email                                                        |
| Sharing         | No social preview images                                  | A designed preview image for every page                                                         |

Their product page section order is sound (price and CTA first, then real pages, then bundles and FAQ). Keep that order, add the three missing trust sections, and make the sample interactive. Reference screenshots come from `scripts/capture-reference.ts` (Phase 0) into `reference/helpmeswitch/`, never deployed, never copied.

## Product line and pricing

| Tier                            | Price (₹, incl. GST) | What's in it                                                                                                              | Ships in  |
| ------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------- |
| Free                            | 0                    | Readiness Check (2 min), a 12-page sample, a 3-email sequence                                                             | Phase 3   |
| Backend Switch Guide (flagship) | 499                  | ~100 backend questions, 4–5 follow-ups each, weak vs strong answers, rejection signals, self-check; A4 and phone editions | Phase 1–2 |
| System Design Follow-Ups        | 499                  | 25–30 HLD and LLD problems built around the follow-ups                                                                    | Phase 5   |
| Switch Kit (bundle)             | 999                  | Both guides + a short switch playbook                                                                                     | Phase 5   |
| Drill Pass                      | 1,499–1,999 (test)   | AI follow-up drill for 90 days + all guides                                                                               | Phase 6   |

**Pricing rules (non-negotiable)**

- The price on the page is the price charged. No "listing price" that nobody ever paid.
- Launch discounts are real: a fixed end date or buyer count, shown on the page, and they end.
- Prices include GST. No new charges at checkout.
- A bigger bundle always contains everything a smaller bundle has.
- Per-unit anchors ("under ₹5 per question") only when computed from the real build numbers.
- No countdown timers that reset.

## Content production pipeline

Guides live in the repo as structured Markdown. Claude drafts, the author reviews every question, and a build script turns reviewed files into a designed PDF plus preview images. Nothing unreviewed ever ships.

1. **Mine** real primary questions and follow-ups (own loops; LeetCode Discuss, r/developersIndia, Glassdoor, GfG write-ups). Log every source URL in `content/sources.csv`. Never use leaked, internal or paid-course material.
2. **Outline** 12 modules: API design, databases and transactions, caching, queues and async, consistency across services, reliability and incidents, observability, security, performance, payments and idempotency, ownership stories, design shorts. Target 100 questions.
3. **Draft** 10 question files at a time.
4. **Review** every file, fix the technical parts, add one real detail from your own work, set `reviewed: true`.
5. **Build:** `pnpm build:pdf` (A4 + phone edition), `pnpm build:previews` (WebP for the site).
6. **Release:** bump the version, changelog entry, upload the master; existing buyers get an update email.

**Quality gates (CI):** zod schema; ≥3 follow-ups covering ≥2 types; near-duplicate title check; spell-check and link check; only `reviewed: true` reaches the PDF; the site reads counts from the build output.

**PDF design:** HTML/CSS rendered with Playwright; pdf-lib stamps the buyer's email and order ID on every page at delivery; every question page uses one layout: question → what it tests → weak answer → follow-up ladder → framework → self-check.

## Website spec

Mobile-first; every page has one job in the funnel: ad → product page or Readiness Check → checkout → delivery → review → referral.

| Route                                               | Job             | Sections                                                                                                                                         |
| --------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/guides/[slug]`                                    | Product page    | Price and CTA above the fold → interactive sample → real sample pages → modules → for/not for → author → reviews → bundle → FAQ → sticky buy bar |
| `/`                                                 | Home            | Promise → who it's for → follow-up demo → flagship card → author → reviews → FAQ                                                                 |
| `/check`                                            | Readiness Check | Experience, round, interview date → 8 questions → score by area → recommended guide → email for full report                                      |
| `/guides`                                           | Catalog         | Product cards, bundle card                                                                                                                       |
| `/learn`, `/learn/[slug]`                           | Free articles   | One primary question + 3 follow-ups + strong-answer outline + CTA                                                                                |
| `/about`                                            | Author page     | Story, experience, why this exists, photo, LinkedIn                                                                                              |
| `/thank-you`                                        | After payment   | Next steps, download link, support, day-7 review ask                                                                                             |
| `/changelog`                                        | Updates         | Version history per guide                                                                                                                        |
| `/faq`, `/contact`, `/refund`, `/terms`, `/privacy` | Trust and legal | Business name, address and support response time on every one                                                                                    |

**Readiness Check:** three warm-ups, then 8 real follow-ups (1 strong, 2 plausible, 1 weak option). Result shows score per area, the 2 missed questions with the strong answer, and the guide. The score is never gated; email only for the full PDF report. Then 3 emails over 5 days: weakest area explained; one free full question page; a review from someone like them plus the guide.

**Copy rules:** open with the buyer's moment; specific numbers only from the build output; no job/offer/salary promises, no company logos or "asked at Google"; no fake urgency or scarcity; write for a phone; original words only.

**Technical SEO:** canonical + correct og:url everywhere; a preview image for every page; Product, FAQPage and Article JSON-LD; 301s for moved URLs; real lastmod dates.

## Design direction: the engineer's notebook

Warm paper `#F5F1E6` with a faint 24 px blue grid; ink `#1C1A16`, muted `#5C5648`; ink-blue `#2340B0` keycap buttons; marker yellow `#FFE36E`, red pen `#C2412D`, green `#2E7A4B`; Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono, Caveat; paper-white cards with a 1.5 px ink border and hard offset shadow; real guide pages as the main visual. Signature moments: "what you rehearse vs what they ask next", the page viewer, the terminal-style follow-up demo, the price card with a rotated LAUNCH PRICE stamp.

## Tech stack

Next.js (App Router), TypeScript, Tailwind · Vercel · Razorpay Checkout · Supabase Postgres · Cloudflare R2 (private) · Resend + React Email · GA4, Meta Pixel, Meta Conversions API · Markdown + YAML content, Playwright PDFs · Sentry.

Everything after payment happens in the webhook, which must be idempotent: Razorpay can send the same event twice and the buyer must get exactly one email.

**Delivery rules:** links belong to one order, expire after 24 hours and can be re-sent; 5 downloads per link; the webhook verifies the signature and stores the event ID; if stamping or email fails, retry 3 times, then alert.

## Distribution

- **Meta ads (months 1–3):** 20–30 s reels (question → "here's the follow-up they actually ask" → why answers fail → "the guide has 100 of these" → CTA to the Readiness Check). 6–8 creatives, 2 audiences, ₹700–1,000/day for 14 days. Cold traffic → Readiness Check; retargeting → product page. Pixel + Conversions API.
- **Free channels:** LinkedIn 3 posts/week; Instagram carousels; `/learn` 2 articles/week; referral (friend ₹100 off, buyer ₹100 back); communities within their rules.

**Unit economics:** profit per order = average order − payment fees − ad cost per order. ₹800 − ₹20 − ₹400 = ₹380 → ~130 orders/month for ₹50,000. If ad cost per order stays above ₹500 at an ₹800 average order, fix the page or offer before raising spend.

## Build phases

| Phase             | Build                                                                                                                                                            | Done when                                                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Setup           | Scaffold, ESLint, Prettier, Vitest, CI; `config/site.ts`; run the capture script                                                                                 | `pnpm dev` runs, CI green, reference screenshots, decisions answered                                                                                                 |
| 1 Content engine  | zod schema + validator; `build:pdf` (A4 + phone), `build:previews`; `stats.json`; 100 drafts in batches of 10                                                    | Validator passes; both editions from reviewed files only; 100/100 reviewed; 12 previews; 3 friends read 20 pages each                                                |
| 2 Storefront MVP  | Routes, product page first; Razorpay order + checkout; webhook → order → stamp → email; signed downloads; GA4, Pixel, CAPI; preview images, JSON-LD, legal pages | Test purchase in inbox < 2 min; PDF footer shows buyer email; same webhook twice → one email; mobile Lighthouse ≥ 90; canonical, og:url and preview image everywhere |
| 3 Readiness Check | QuizEngine (8 questions from the guide), result page + share image, email capture with opt-in, 3-email sequence, `/learn` with 4 articles                        | Finishes on a phone < 2 min; score without email; emails in order; unsubscribe works                                                                                 |
| 4 Launch          | Live keys, launch price with a real end date, UTM capture, weekly report                                                                                         | 14 days of spend in, gate decided from the numbers                                                                                                                   |
| 5 Second guide    | System Design guide, ₹999 bundle, day-7 review email + form + moderation, referral codes, `/changelog`                                                           | Bundle sells through the same webhook; ≥10 published reviews from real orders                                                                                        |
| 6 AI drill        | Magic-link login tied to orders; drill flow grounded in `follow_ups` and `rejection_signals`; daily cap; model cost logged per session                           | 10 buyers finished and rated a drill; average cost per session known and within budget                                                                               |

## Launch checklist

- [ ] Employment clauses read and named-or-anonymous decided
- [ ] Live Razorpay purchase with your own card: email in under 2 minutes, stamped PDF opens on a phone
- [ ] Refund, terms, privacy and contact pages show business name, address and support response time
- [ ] Every number on the site matches the build output
- [ ] 3 engineer friends have read the guide and 2 have given a usable quote
- [ ] Pixel, Conversions API and GA4 each record a test purchase once, not twice
- [ ] Mobile Lighthouse score ≥ 90 on the home and product pages
- [ ] 6–8 ad creatives ready, plus 2 retargeting creatives
- [ ] Readiness Check emails tested end to end, unsubscribe included

## Metrics to watch weekly

| Metric                             | First target           |
| ---------------------------------- | ---------------------- |
| Ad link click-through              | ≥ 1%                   |
| Product page → checkout started    | ≥ 5%                   |
| Checkout started → paid            | ≥ 50%                  |
| Readiness Check started → finished | ≥ 60%                  |
| Finished → email given             | ≥ 25%                  |
| Ad cost per order                  | ≤ 50% of average order |
| Refund and complaint rate          | < 3%                   |

## Risks

| Risk                  | What we do                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Your employment terms | Read the outside-work and IP clauses before launch; never use internal material; no employer logos; decide named vs anonymous after this |
| Content errors        | Build from reviewed files only, keep a public errata list, ship fixes as updates                                                         |
| Piracy                | Stamp every PDF; updates only to buyers; the drill can't be pirated                                                                      |
| Ad policy rejections  | No job, offer or salary promises in ads or on the landing page                                                                           |
| Consumer law          | Follow the pricing rules (India's 2023 dark-pattern guidelines)                                                                          |
| Tax                   | Talk to a CA about GST registration and invoices                                                                                         |
| Privacy               | Clear privacy notice, opt-in for marketing emails, deletion on request (DPDP Act)                                                        |
| Copycats              | The moat is the author, reviews, the drill and search traffic                                                                            |

## Sources

- HelpMeSwitch pages read on 13 Oct 2026: home, guides, HLD + LLD kit, backend, behavioural, methodology, FAQ, refund policy, privacy, sitemap
- JSA Law: CCPA Guidelines for Prevention and Regulation of Dark Patterns, 2023
