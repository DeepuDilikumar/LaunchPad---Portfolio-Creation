import { collabCodePad } from "./collab-code-pad"
import { jobQueue } from "./job-queue"
import { paymentGateway } from "./payment-gateway"
import { ragNotes } from "./rag-notes"
import type { CatalogProject } from "./types"
import { webhookEngine } from "./webhook-engine"

export type { CatalogProject, DefenseQuestion, ProgramDay } from "./types"

export const PROJECTS: CatalogProject[] = [webhookEngine, jobQueue, ragNotes, paymentGateway, collabCodePad]

export function getProject(key: string): CatalogProject | null {
  return PROJECTS.find((p) => p.key === key) ?? null
}
