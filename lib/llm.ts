import "server-only"

import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import type { z } from "zod"

import { isLLMConfigured } from "@/lib/env"

/**
 * The ONLY place LaunchPad talks to an LLM. Server-side only; never import from client code.
 * Prompts live in lib/prompts/. Every caller must handle `null` (not configured, refused,
 * or failed) by falling back to its deterministic, clearly labelled rule-based path.
 *
 * Privacy: requests can contain resume text. Never log prompts, outputs or rows here;
 * errors are logged by class and status only.
 */

export const LLM_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5"

/** Server-side fallback: if the primary model declines, the API retries on a suitable model. */
const FALLBACK_BETA = "server-side-fallback-2026-07-01"

let client: Anthropic | null = null
function getClient() {
  if (!client) client = new Anthropic()
  return client
}

export { isLLMConfigured }

type Effort = "low" | "medium" | "high"

function logFailure(where: string, error: unknown) {
  if (error instanceof Anthropic.APIError) {
    console.error(`[llm] ${where} failed: ${error.constructor.name} ${error.status ?? ""}`)
  } else {
    console.error(`[llm] ${where} failed: ${error instanceof Error ? error.name : "unknown"}`)
  }
}

/**
 * One structured call: the model must answer with JSON matching `schema`.
 * Returns null when the LLM isn't configured, refuses, or the output doesn't validate.
 */
export async function generateStructured<T extends z.ZodType>(options: {
  task: string
  system: string
  prompt: string
  schema: T
  effort?: Effort
  maxTokens?: number
}): Promise<z.infer<T> | null> {
  if (!isLLMConfigured()) return null
  try {
    const response = await getClient().beta.messages.parse({
      model: LLM_MODEL,
      max_tokens: options.maxTokens ?? 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: options.system,
      messages: [{ role: "user", content: options.prompt }],
      output_config: {
        effort: options.effort ?? "medium",
        format: betaZodOutputFormat(options.schema),
      },
    })
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null
    const parsed = response.parsed_output as z.infer<T> | null
    if (!parsed) return null
    const checked = options.schema.safeParse(parsed)
    return checked.success ? (checked.data as z.infer<T>) : null
  } catch (error) {
    logFailure(options.task, error)
    return null
  }
}

/**
 * Streams plain text (used by the mentor chat). Yields text chunks.
 * Throws only for "not configured"; API failures end the stream with a friendly note.
 */
export async function* streamText(options: {
  task: string
  system: string
  messages: Anthropic.Beta.BetaMessageParam[]
  effort?: Effort
  maxTokens?: number
}): AsyncGenerator<string> {
  if (!isLLMConfigured()) throw new Error("LLM not configured")
  try {
    const stream = getClient().beta.messages.stream({
      model: LLM_MODEL,
      max_tokens: options.maxTokens ?? 8000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      system: options.system,
      messages: options.messages,
      output_config: { effort: options.effort ?? "low" },
    })
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text
      }
    }
    const final = await stream.finalMessage()
    if (final.stop_reason === "refusal") {
      yield "\n\nI can't help with that one. Try asking about today's task in a different way."
    }
  } catch (error) {
    logFailure(options.task, error)
    yield "\n\nThe mentor couldn't answer just now. Please try again in a minute."
  }
}
