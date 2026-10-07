import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const now = () => timestamp({ withTimezone: true }).notNull().defaultNow();

/**
 * Identities for mock auth (local dev and tests). With Supabase, identities live in
 * auth.users and this table stays empty; `profiles.user_id` holds the auth user id.
 */
export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  createdAt: now(),
});

export const profiles = pgTable(
  "profiles",
  {
    userId: uuid("user_id").primaryKey(),
    email: text(),
    handle: text().notNull(),
    name: text().notNull().default(""),
    headline: text().notNull().default(""),
    githubUsername: text("github_username"),
    avatarUrl: text("avatar_url"),
    preferredTool: text("preferred_tool").notNull().default("claude"),
    experienceLevel: text("experience_level"),
    targetRole: text("target_role"),
    isPublic: boolean("is_public").notNull().default(true),
    role: text().notNull().default("user"),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    marketingEmails: boolean("marketing_emails").notNull().default(true),
    createdAt: now(),
  },
  (t) => [uniqueIndex("profiles_handle_key").on(t.handle)],
);

export const products = pgTable("products", {
  id: serial().primaryKey(),
  kind: text().notNull(),
  slug: text().notNull().unique(),
  priceInr: integer("price_inr").notNull(),
  priceUsd: integer("price_usd").notNull(),
  active: boolean().notNull().default(true),
});

export const purchases = pgTable(
  "purchases",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    productSlug: text("product_slug").notNull(),
    /** For one-project purchases. */
    projectSlug: text("project_slug"),
    provider: text().notNull(),
    providerOrderId: text("provider_order_id").notNull(),
    providerPaymentId: text("provider_payment_id"),
    amount: integer().notNull(),
    currency: text().notNull(),
    status: text().notNull().default("created"),
    couponCode: text("coupon_code"),
    returnTo: text("return_to"),
    createdAt: now(),
    updatedAt: now(),
  },
  (t) => [
    uniqueIndex("purchases_provider_payment_id_key").on(t.providerPaymentId),
    uniqueIndex("purchases_provider_order_id_key").on(t.provider, t.providerOrderId),
    index("purchases_user_idx").on(t.userId),
  ],
);

export const entitlements = pgTable(
  "entitlements",
  {
    id: serial().primaryKey(),
    userId: uuid("user_id").notNull(),
    scope: text().notNull(),
    source: text().notNull(),
    sourceId: text("source_id").notNull(),
    createdAt: now(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("entitlements_grant_key").on(t.userId, t.scope, t.source, t.sourceId),
    index("entitlements_user_idx").on(t.userId),
  ],
);

export const coupons = pgTable("coupons", {
  id: serial().primaryKey(),
  code: text().notNull().unique(),
  kind: text().notNull(),
  value: integer().notNull().default(0),
  /** For `grant` coupons: the entitlement scope granted on redemption. */
  scope: text(),
  maxRedemptions: integer("max_redemptions"),
  redemptions: integer().notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  note: text(),
  createdAt: now(),
});

export const couponRedemptions = pgTable(
  "coupon_redemptions",
  {
    id: serial().primaryKey(),
    couponId: integer("coupon_id")
      .notNull()
      .references(() => coupons.id),
    userId: uuid("user_id").notNull(),
    createdAt: now(),
  },
  (t) => [uniqueIndex("coupon_redemptions_once_key").on(t.couponId, t.userId)],
);

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: serial().primaryKey(),
    provider: text().notNull(),
    eventId: text("event_id").notNull(),
    type: text().notNull().default(""),
    payload: jsonb().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    error: text(),
    createdAt: now(),
  },
  (t) => [uniqueIndex("webhook_events_event_key").on(t.provider, t.eventId)],
);

export const progress = pgTable(
  "progress",
  {
    id: serial().primaryKey(),
    userId: uuid("user_id").notNull(),
    project: text().notNull(),
    module: text().notNull(),
    cellId: text("cell_id").notNull(),
    kind: text().notNull(),
    status: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    updatedAt: now(),
  },
  (t) => [
    // Cell ids are unique within a module, so the key includes project + module.
    uniqueIndex("progress_user_cell_key").on(t.userId, t.project, t.module, t.cellId),
    index("progress_user_updated_idx").on(t.userId, t.updatedAt),
  ],
);

export const decisions = pgTable(
  "decisions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    project: text().notNull(),
    module: text().notNull(),
    cellId: text("cell_id").notNull(),
    text: text().notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    featured: boolean().notNull().default(false),
    updatedAt: now(),
  },
  (t) => [uniqueIndex("decisions_user_cell_key").on(t.userId, t.project, t.module, t.cellId)],
);

export const proofPacks = pgTable(
  "proof_packs",
  {
    id: serial().primaryKey(),
    userId: uuid("user_id").notNull(),
    project: text().notNull(),
    repoUrl: text("repo_url"),
    liveUrl: text("live_url"),
    verifyToken: text("verify_token").notNull(),
    checks: jsonb().$type<Record<string, { ok: boolean; detail: string; at: string }>>().notNull().default(sql`'{}'::jsonb`),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    metrics: jsonb().$type<{ label: string; value: string }[]>().notNull().default(sql`'[]'::jsonb`),
    featuredDecisionIds: jsonb("featured_decision_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    caseStudyMd: text("case_study_md"),
    bullets: jsonb().$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: now(),
  },
  (t) => [uniqueIndex("proof_packs_user_project_key").on(t.userId, t.project)],
);

export const tutorMessages = pgTable(
  "tutor_messages",
  {
    id: serial().primaryKey(),
    userId: uuid("user_id").notNull(),
    project: text().notNull(),
    module: text().notNull(),
    cellId: text("cell_id"),
    role: text().notNull(),
    content: text().notNull(),
    tokensIn: integer("tokens_in").notNull().default(0),
    tokensOut: integer("tokens_out").notNull().default(0),
    createdAt: now(),
  },
  (t) => [index("tutor_messages_user_created_idx").on(t.userId, t.createdAt)],
);

export const notifyRequests = pgTable(
  "notify_requests",
  {
    id: serial().primaryKey(),
    email: text(),
    userId: uuid("user_id"),
    moduleSlug: text("module_slug").notNull(),
    createdAt: now(),
  },
  (t) => [uniqueIndex("notify_requests_key").on(t.moduleSlug, t.email, t.userId)],
);

export const leads = pgTable("leads", {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  organization: text().notNull(),
  kind: text().notNull(),
  seats: integer(),
  message: text().notNull().default(""),
  createdAt: now(),
});

/** Anonymous, cookie-less funnel counts for the admin view. */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: serial().primaryKey(),
    event: text().notNull(),
    userId: uuid("user_id"),
    props: jsonb().$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: now(),
  },
  (t) => [index("analytics_events_event_created_idx").on(t.event, t.createdAt)],
);

/** Outgoing email log (mock transport and audit for scheduled nudges). */
export const emailLog = pgTable(
  "email_log",
  {
    id: serial().primaryKey(),
    userId: uuid("user_id"),
    to: text().notNull(),
    template: text().notNull(),
    subject: text().notNull(),
    createdAt: now(),
  },
  (t) => [index("email_log_user_template_idx").on(t.userId, t.template)],
);
