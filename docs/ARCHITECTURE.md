# LaunchPad — Folder Structure and Data Model

> **Status: PROPOSAL — waiting for owner approval.** No app code is written until this is approved.

## 1. Folder structure

```
.
├── app/
│   ├── layout.tsx                    # fonts, theme anti-flash script, Pixel (lazy), Toaster
│   ├── globals.css                   # design tokens (light + .dark), base styles
│   ├── (marketing)/
│   │   └── page.tsx                  # Feature A: landing
│   ├── (flow)/                       # no account needed until publish
│   │   ├── layout.tsx                # stepper + sticky bottom action bar
│   │   ├── start/page.tsx            # B: upload (or manual entry)
│   │   ├── start/profile/page.tsx    # B: auto-filled profile form
│   │   ├── start/template/page.tsx   # C: pick template (live previews)
│   │   └── start/publish/page.tsx    # C: login gate → publish → celebration
│   ├── (app)/                        # signed-in area
│   │   ├── layout.tsx                # top bar (mobile) / sidebar (desktop)
│   │   ├── portfolio/page.tsx        # C: editor
│   │   ├── report/page.tsx           # D: teaser or full report
│   │   ├── report/resume/page.tsx    # E: ATS rewrite + export
│   │   ├── program/page.tsx          # F/G: project picker, then dashboard
│   │   ├── program/day/[n]/page.tsx  # G: day screen + mentor chat
│   │   ├── program/defend/page.tsx   # H
│   │   ├── program/announce/page.tsx # I
│   │   ├── program/certificate/page.tsx
│   │   └── settings/page.tsx         # theme, reminder time, GitHub, delete my data
│   ├── p/[slug]/
│   │   ├── page.tsx                  # public portfolio (SSR, cached, revalidated on publish)
│   │   └── opengraph-image.tsx       # per-user OG image
│   ├── login/page.tsx
│   ├── auth/callback/route.ts        # Supabase OAuth callback → draft sync
│   └── api/
│       ├── resume/extract-profile/route.ts   # B tier 2 (LLM refine)
│       ├── portfolio/publish/route.ts
│       ├── diagnostic/route.ts               # D: run / fetch cached
│       ├── report/pdf/route.ts
│       ├── resume/rewrite/route.ts           # E
│       ├── resume/export/{pdf,tex}/route.ts
│       ├── payments/order/route.ts           # Razorpay create order
│       ├── payments/verify/route.ts          # signature check → entitlement
│       ├── payments/webhook/route.ts         # idempotent confirm → entitlement
│       ├── github/connect/route.ts + callback/route.ts
│       ├── github/scaffold/route.ts          # F: create repo + 1 labelled commit
│       ├── program/verify/route.ts           # G: commit verification
│       ├── mentor/route.ts                   # G: streaming chat
│       ├── defense/route.ts                  # H
│       ├── pitch/route.ts                    # I
│       ├── events/route.ts                   # analytics events
│       ├── account/delete/route.ts           # one-click data deletion
│       └── cron/reminders/route.ts           # Vercel Cron → Resend
├── components/
│   ├── ui/                  # shadcn primitives (restyled via tokens only)
│   ├── layout/              # header, sidebar, sticky-action-bar, theme-toggle, responsive-sheet
│   ├── marketing/           # hero, before-after, how-it-works, samples, pricing, faq
│   ├── upload/              # dropzone, attached-file-card, autofill-banner
│   ├── profile/             # profile-form sections, chip-input
│   ├── portfolio/
│   │   ├── templates/       # minimal.tsx, developer.tsx, bold.tsx (shared section components)
│   │   └── editor/
│   ├── diagnostic/          # score-bar, pillar-card, status-pill, rubric-checklist, paywall, honest-steps
│   ├── resume/              # bullet-diff, placeholder-highlight, preview
│   ├── program/             # project-card, streak-grid, day-card, hint-reveal, mentor-chat
│   └── shared/              # skeletons, empty-state, error-state, celebration
├── lib/
│   ├── llm.ts               # the ONLY LLM entry point (server-only)
│   ├── prompts/             # extract-profile.ts, summary.ts, diagnostic.ts (+ rubric), rewrite.ts,
│   │                        # mentor.ts, defense.ts, pitch.ts
│   ├── scoring/             # rubric definitions + deterministic score computation
│   ├── resume/              # extract-text (pdfjs/mammoth/txt), extract-profile.ts (heuristics), merge.ts
│   ├── supabase/            # client.ts, server.ts, admin.ts (service role, server-only)
│   ├── payments/razorpay.ts
│   ├── github/              # octokit client, scaffold builder, commit verification
│   ├── pdf/                 # @react-pdf resume + report documents
│   ├── latex/               # .tex generator
│   ├── draft-state.ts       # localStorage `launchpad_draft_state` + Supabase sync
│   ├── theme.ts             # `launchpad_theme` helpers + anti-flash script string
│   ├── analytics.ts         # events table + Meta Pixel (no PII, no resume content)
│   └── validation/          # zod schemas shared by client + server
├── config/
│   └── pricing.ts           # THE single price/product config (amounts in paise)
├── content/
│   ├── projects/*.ts        # 5 fully written 14-day projects
│   ├── samples/*.ts         # 3 demo profiles (landing gallery + seed)
│   └── faq.ts
├── supabase/
│   ├── migrations/          # SQL schema + RLS policies + storage bucket
│   └── seed.sql             # demo users/portfolios/reports for local dev
├── design/                  # DESIGN_SYSTEM.md, COMPONENT_SOURCING.md, pages/*.md overrides
├── docs/                    # FEATURES.md, ARCHITECTURE.md
├── tests/
│   ├── unit/                # parser, merge, scoring determinism, pricing, signature verify
│   └── e2e/                 # Playwright smoke at 375px: landing → upload → publish
└── public/                  # static assets, sample resume fixtures (fake data only)
```

**Why this shape:** route groups keep the no-account flow, the signed-in app and
marketing separate, each with its own layout. All secrets and LLM calls stay in
`app/api` + `lib` (server-only). Prices, projects and demo data are plain
TypeScript that can be edited without touching UI code.

## 2. Data model (Supabase Postgres)

Row Level Security is **on for every table**: users read and write only their
own rows. Tables marked 🔒 are written only by the server (service role), so the
client can never self-grant access.

```
auth.users (Supabase)
   │ 1
   ├──1 profiles ──────────────┐
   ├──* resumes                │
   ├──1 draft_states           │
   ├──1 portfolios ──(public read when published)
   ├──* diagnostics ──* resume_rewrites
   ├──* orders 🔒 ──* entitlements 🔒
   ├──1 github_connections 🔒
   ├──* programs ──* program_days ──* mentor_messages
   │        ├──* defense_sessions ──* defense_answers
   │        └──* pitch_drafts
   └──* events 🔒 (user_id nullable for anonymous)
razorpay_webhook_events 🔒 (idempotency log)
```

| Table | Key columns | Notes |
|---|---|---|
| **profiles** | `id` (= auth user id), `full_name`, `email`, `phone`, `college`, `grad_year`, `target_role`, `github_username`, `linkedin_url`, `skills jsonb` ({languages, frameworks, databases, tools}), `projects jsonb`, `experience jsonb`, `education jsonb`, `field_sources jsonb` (per field: `resume` / `llm` / `user`), `timezone`, `reminder_time` | `field_sources` enforces "background refinement never overwrites manual edits". |
| **draft_states** | `user_id` pk, `state jsonb`, `version int`, `updated_at` | Server copy of `launchpad_draft_state`. Merged on login; the newest `updated_at` wins per field. |
| **resumes** | `id`, `user_id`, `storage_path` (private bucket `resumes/{user_id}/…`), `file_name`, `mime`, `size_bytes`, `extracted_text` (text, RLS-protected), `text_hash`, `created_at` | The file is uploaded **only after login**; before that, parsing happens in the browser. The text is never logged. Deleting the account removes the row and the storage object. |
| **portfolios** | `id`, `user_id` unique, `slug` unique, `template` (`minimal` / `developer` / `bold`), `content jsonb` (section order, visibility, text overrides), `summary`, `is_published`, `published_at`, `og_version` | Public read policy: `is_published = true`. Switching templates never touches `content`. |
| **diagnostics** | `id`, `user_id`, `resume_id`, `input_hash`, `rubric_version`, `rubric_results jsonb` (per pillar: items met / not met + evidence), `pillar_scores jsonb`, `overall_score int`, `github_assessed bool`, `created_at` | Unique on (`user_id`, `input_hash`, `rubric_version`): a rerun on the same resume returns the cached result, which guarantees the ±3 target. The LLM runs at temperature 0 and outputs rubric items only; code computes the scores. |
| **resume_rewrites** | `id`, `user_id`, `diagnostic_id`, `bullets jsonb` ([{id, section, original, suggested, final, status: pending/accepted/edited/rejected}]), `updated_at` | Auto-saved on every accept or edit. |
| **orders** 🔒 | `id`, `user_id`, `product_key` (`report` / `program` / `bundle`), `amount_paise`, `currency`, `razorpay_order_id` unique, `razorpay_payment_id`, `status` (`created` / `paid` / `failed` / `refunded`), `created_at`, `paid_at` | The amount comes from `config/pricing.ts` on the server, never from the client. |
| **entitlements** 🔒 | `user_id`, `entitlement` (`report` / `program`), `order_id`, `granted_at`; unique (`user_id`, `entitlement`) | Granted by **whichever arrives first**: the verify route or the webhook, using upsert (idempotent). The bundle grants both. The UI reads only this table. |
| **razorpay_webhook_events** 🔒 | `event_id` unique, `type`, `payload jsonb`, `received_at`, `processed_at` | Dedupes retries. |
| **github_connections** 🔒 | `user_id` pk, `github_user_id`, `login`, `access_token_enc` (encrypted with a server key), `scopes`, `updated_at` | The token never goes to the client. Revoked when the account is deleted. |
| **programs** | `id`, `user_id`, `project_key` (→ `content/projects`), `repo_owner`, `repo_name`, `repo_url`, `scaffold_commit_sha`, `started_at`, `status` (`active` / `completed`), `completed_at`, `certificate_id` | One active program per user. |
| **program_days** | `id`, `program_id`, `day_number` 1–14, `unlocked_at`, `completed_at`, `verified_commit_shas text[]`, `review jsonb`, `hints_revealed int`, `checklist jsonb`; unique (`program_id`, `day_number`) | The streak is **computed** from these rows (not stored), so it is always honest and consistent across devices. Verification counts only commits authored by the user's GitHub id and pushed after `unlocked_at` (checked via the GitHub API), excluding the scaffold SHA. |
| **mentor_messages** | `id`, `program_id`, `day_number`, `role`, `content`, `created_at` | |
| **defense_sessions / defense_answers** | session: `id`, `program_id`, `mode` (`practice` / `mock`), `questions jsonb`. Answer: `session_id`, `question_id`, `answer`, `scores jsonb` (correctness, tradeoffs, failure modes, clarity), `feedback` | |
| **pitch_drafts** | `id`, `user_id`, `program_id`, `kind` (`linkedin_post` / `bullets` / `cold_dm` / `headline_about`), `tone`, `content`, `updated_at` | |
| **events** 🔒 | `id`, `user_id` nullable, `anon_id`, `name` (`upload` / `portfolio_created` / `teaser_viewed` / `checkout_started` / `paid` / `day_completed`), `props jsonb` (no PII, no resume text), `created_at` | Inserted only through `/api/events`. |

**Storage:** one private bucket, `resumes`, with path-scoped policies
(`{user_id}/…`). The OG images are generated on request by `opengraph-image.tsx`
and cached, so they need no bucket.

**Account deletion (one click):** a server route deletes the storage objects,
then all user rows (FK `on delete cascade` from `auth.users`), revokes the GitHub
token, unpublishes the portfolio (so the public page returns 404), and finally
deletes the auth user. Orders are kept anonymised (user id set to null) because
payment records must be retained.

## 3. Key flows at a glance
- **Anonymous → signed in:** upload, profile and template all live in `launchpad_draft_state`. At publish: OAuth → `auth/callback` → the server merges the draft into `profiles`/`portfolios`, uploads the resume to the private bucket, publishes, then redirects to the celebration screen.
- **Tier 2 refine for anonymous users:** `/api/resume/extract-profile` accepts text only (it stores nothing and logs nothing), with a rate limit per IP/anon id.
- **Payment:** order (server-priced) → Razorpay Checkout → `verify` (signature) *or* `webhook` → `entitlements` upsert. The client polls `entitlements` briefly after the redirect, so a refresh or an early webhook both work.

## 4. Open decisions (defaults chosen; say if you want otherwise)
1. **Accent colour:** electric blue `#2563EB` (not violet).
2. **Fonts:** Geist Sans + Geist Mono (self-hosted).
3. **Day unlocking:** Day N unlocks at local midnight on calendar day N after `started_at` and stays open for catch-up. The streak counts consecutive calendar days with a verified day.
4. **Email:** Resend + Vercel Cron (hourly, sending to users whose `reminder_time` falls in that hour).
5. **Domain:** `launchpad.app` is a placeholder via `NEXT_PUBLIC_SITE_URL`.
6. **Package manager:** pnpm.
