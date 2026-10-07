import { z } from "zod";

export const frontmatterSchema = z.object({
  title: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  project: z.enum(["foundations", "pulse", "ledger", "reel", "dispatch", "scribe", "atlas"]),
  order: z.number().int().min(0).max(10),
  minutes: z.number().int().positive(),
  objectives: z.array(z.string().min(3)).min(1),
  status: z.enum(["published", "outline"]),
  free: z.boolean(),
  summary: z.string().optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/** Top-level MDX elements that count as notebook cells. */
export const CELL_KINDS = [
  "Explain",
  "Prompt",
  "Expect",
  "Checkpoint",
  "Pitfall",
  "Decision",
  "Interview",
  "Quiz",
  "Diagram",
  "Callout",
] as const;

export type CellKind = (typeof CELL_KINDS)[number];

export interface CellMeta {
  id: string;
  kind: CellKind;
  index: number;
  required: boolean;
  /** Raw MDX source of the cell, used as tutor context. */
  source: string;
  /** Short label for the rail / tutor attachment. */
  label: string;
}
