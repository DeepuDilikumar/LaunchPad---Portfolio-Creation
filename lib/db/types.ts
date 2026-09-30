/**
 * A deliberately small table API so every feature is written once and runs on either
 * Supabase Postgres (real) or a local JSON file (demo). Table and column names match
 * supabase/migrations exactly.
 */
export type Row = Record<string, unknown>
export type Match = Record<string, string | number | boolean | null>

export type SelectOptions = {
  order?: { column: string; ascending?: boolean }
  limit?: number
}

export interface Db {
  select<T extends Row>(table: TableName, match: Match, options?: SelectOptions): Promise<T[]>
  selectOne<T extends Row>(table: TableName, match: Match): Promise<T | null>
  insert<T extends Row>(table: TableName, row: Partial<T>): Promise<T>
  /** Insert or update the row that matches `onConflict` columns. */
  upsert<T extends Row>(table: TableName, row: Partial<T>, onConflict: string[]): Promise<T>
  update<T extends Row>(table: TableName, match: Match, patch: Partial<T>): Promise<T[]>
  delete(table: TableName, match: Match): Promise<void>
}

export const TABLES = [
  "profiles",
  "draft_states",
  "resumes",
  "portfolios",
  "diagnostics",
  "resume_rewrites",
  "orders",
  "entitlements",
  "razorpay_webhook_events",
  "github_connections",
  "programs",
  "program_days",
  "mentor_messages",
  "defense_sessions",
  "pitch_drafts",
  "events",
  "reminder_sends",
] as const
export type TableName = (typeof TABLES)[number]

/** Tables whose rows get `id`, `created_at`, `updated_at` filled automatically in the file store. */
export const TABLES_WITH_ID: TableName[] = [
  "resumes",
  "portfolios",
  "diagnostics",
  "resume_rewrites",
  "orders",
  "programs",
  "program_days",
  "mentor_messages",
  "defense_sessions",
  "pitch_drafts",
  "events",
]
