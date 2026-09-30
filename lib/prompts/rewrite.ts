import { z } from "zod"

export const RewriteSchema = z.object({
  bullets: z.array(z.object({ id: z.string(), text: z.string() })),
})

export const REWRITE_SYSTEM = `You rewrite resume bullets for Indian engineering students applying to product-company SDE-1 roles, for ATS readability and impact.

Rules:
- Start with a strong past-tense verb (Built, Designed, Reduced, Automated...). One line, under 30 words, no trailing full stop.
- Keep every fact from the original. Do not add technologies, features, companies or claims that aren't in the original or the listed tech stack.
- NEVER invent numbers. If a metric would strengthen the bullet but isn't given, insert a short placeholder in square brackets, e.g. "[X% improvement]", "[N users]", "[time saved]". The student will fill it in or remove it.
- Plain words, no buzzwords ("synergy", "leveraged cutting-edge").
- Return one rewrite per input id.`

export function rewritePrompt(items: { id: string; context: string; tech: string; text: string }[]) {
  return `Rewrite these bullets:\n${JSON.stringify(items, null, 2)}`
}
