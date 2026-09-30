/** Row shapes, matching supabase/migrations/0001_initial.sql. */
import type { FieldSources, Profile } from "@/lib/profile/types"
import type { PortfolioContent } from "@/lib/portfolio/types"

export type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  data: Profile
  field_sources: FieldSources
  timezone: string
  reminder_time: string | null // "HH:MM" in the user's timezone
  reminder_email: boolean
  created_at?: string
  updated_at?: string
}

export type ResumeRow = {
  id: string
  user_id: string
  storage_path: string | null
  file_name: string
  mime: string
  size_bytes: number
  format: "PDF" | "DOCX" | "TXT" | "Manual"
  layout: "single-column" | "two-column" | "unknown"
  has_tables: boolean
  text_hash: string
  extracted_text: string
  created_at: string
}

export type PortfolioRow = {
  id: string
  user_id: string
  slug: string
  content: PortfolioContent
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export type OrderRow = {
  id: string
  user_id: string
  product_key: string
  amount_paise: number
  currency: string
  provider: "razorpay" | "demo"
  provider_order_id: string
  provider_payment_id: string | null
  status: "created" | "paid" | "failed"
  paid_at: string | null
  created_at: string
}

export type EntitlementRow = {
  user_id: string
  entitlement: "report" | "program"
  order_id: string | null
  granted_at: string
}

export type GithubConnectionRow = {
  user_id: string
  github_user_id: number
  login: string
  access_token_enc: string
  scopes: string
  updated_at?: string
}

export type ProgramRow = {
  id: string
  user_id: string
  project_key: string
  repo_owner: string | null
  repo_name: string | null
  repo_url: string | null
  scaffold_sha: string | null
  started_at: string
  timezone: string
  status: "active" | "completed"
  completed_at: string | null
  demo: boolean
  created_at: string
}

export type DayReview = {
  summary: string
  suggestions: string[]
  source: "ai" | "none"
}

export type ProgramDayRow = {
  id: string
  program_id: string
  user_id: string
  day_number: number
  completed_at: string | null
  verified_shas: string[]
  review: DayReview | null
  hints_revealed: number
  checklist: boolean[]
  demo_verified: boolean
}

export type MentorMessageRow = {
  id: string
  program_id: string
  user_id: string
  day_number: number
  role: "user" | "assistant"
  content: string
  created_at: string
}

export type DefenseAnswer = {
  answer: string
  covered: boolean[]
  tip: string
  followUp: string | null
  source: "ai" | "rules"
  at: string
}

export type DefenseSessionRow = {
  id: string
  program_id: string
  user_id: string
  questions: string[]
  answers: Record<string, DefenseAnswer>
  source: "ai" | "rules"
  created_at: string
}

export type PitchKind = "linkedin" | "bullets" | "dm" | "profile"

export type PitchDraftRow = {
  id: string
  user_id: string
  program_id: string | null
  kind: PitchKind
  tone: string
  content: string
  source: "ai" | "rules"
  created_at: string
  updated_at: string
}
