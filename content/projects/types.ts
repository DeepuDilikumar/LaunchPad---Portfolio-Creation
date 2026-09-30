import type { TargetRole } from "@/lib/profile/types"

export type ProgramDay = {
  day: number
  title: string
  /** One sentence: what exists at the end of today. */
  goal: string
  /** Why interviewers care about today's work. */
  why: string
  minutes: number
  steps: string[]
  /** Revealed one at a time. Concepts and nudges, not full solutions. */
  hints: string[]
  /** What "done" means; the student ticks these off. */
  checklist: string[]
  /** Interview questions today's work prepares them for. */
  defend: string[]
}

export type DefenseQuestion = {
  id: string
  day: number
  question: string
  /** Points a strong answer covers (used for rule-based feedback and model outlines). */
  keyPoints: string[]
}

export type CatalogProject = {
  key: string
  title: string
  tagline: string
  description: string
  difficulty: "Intermediate" | "Advanced"
  roles: TargetRole[]
  stack: string[]
  /** Skills the project exercises, for matching against the student's profile. */
  skills: string[]
  /** Diagnostic checks this project directly strengthens (see lib/prompts/diagnostic.ts). */
  strengthens: string[]
  interviewTopics: string[]
  /** Typical asks in SDE-1 job descriptions this maps to (not quotes from specific postings). */
  jdMapping: { company: string; asks: string }[]
  architecture: {
    overview: string
    components: { name: string; role: string }[]
    decisions: { decision: string; why: string; tradeoff: string }[]
  }
  runtime: "node" | "python" | "java"
  days: ProgramDay[]
  defense: DefenseQuestion[]
}
