/**
 * Demo profiles for the landing-page gallery and local seed data.
 * These are fictional sample people — always label them "Sample" in the UI.
 */

export type TemplateKey = "minimal" | "developer" | "bold"

export type SampleProfile = {
  slug: string
  name: string
  initials: string
  role: string
  college: string
  gradYear: number
  summary: string
  skills: string[]
  template: TemplateKey
  project: {
    title: string
    stack: string[]
    /** Present when built in the 14-Day Program. */
    builtInDays?: { day: number; of: number }
  }
}

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  minimal: "Minimal",
  developer: "Developer",
  bold: "Bold",
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  {
    slug: "sample-ananya-rao",
    name: "Ananya Rao",
    initials: "AR",
    role: "Backend Engineer",
    college: "B.Tech CSE · 2025",
    gradYear: 2025,
    summary: "I build reliable APIs and the queues behind them.",
    skills: ["Go", "PostgreSQL", "Redis", "Docker"],
    template: "minimal",
    project: {
      title: "Distributed Webhook Delivery Engine",
      stack: ["Go", "Redis", "Postgres"],
      builtInDays: { day: 14, of: 14 },
    },
  },
  {
    slug: "sample-rahul-verma",
    name: "Rahul Verma",
    initials: "RV",
    role: "Full-Stack Developer",
    college: "B.E. IT · 2026",
    gradYear: 2026,
    summary: "Shipping fast, typed web apps end to end.",
    skills: ["TypeScript", "Next.js", "Node.js", "MongoDB"],
    template: "developer",
    project: {
      title: "Real-time Collaborative Code Pad",
      stack: ["Next.js", "WebSockets", "CRDT"],
      builtInDays: { day: 9, of: 14 },
    },
  },
  {
    slug: "sample-sneha-iyer",
    name: "Sneha Iyer",
    initials: "SI",
    role: "ML Engineer",
    college: "B.Tech AI&DS · 2025",
    gradYear: 2025,
    summary: "Search and retrieval systems that actually answer questions.",
    skills: ["Python", "FastAPI", "pgvector", "LangChain"],
    template: "bold",
    project: {
      title: "RAG Search over College Notes",
      stack: ["Python", "pgvector", "FastAPI"],
      builtInDays: { day: 14, of: 14 },
    },
  },
]
