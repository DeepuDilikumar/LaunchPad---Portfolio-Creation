import "server-only";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { mock } from "@/lib/env";
import { anthropic, model } from "./client";
import { generatorSystemPrompt, generatorUserPrompt } from "./prompts";
import { allowedNumbers, filterBullets, scrubCaseStudy } from "./numbers";

export interface GeneratorInput {
  projectName: string;
  projectTitle: string;
  stack: string[];
  hardParts: string[];
  metrics: { label: string; value: string }[];
  decisions: string[];
  repoUrl?: string | null;
  liveUrl?: string | null;
}

const Output = z.object({ caseStudy: z.string(), bullets: z.array(z.string()) });

/** Deterministic draft used in mock mode: built only from the learner's own inputs. */
export function templateDraft(input: GeneratorInput) {
  const metricLines = input.metrics.map((m) => `- ${m.label}: ${m.value}`).join("\n");
  const caseStudy = [
    "## Problem",
    `I built ${input.projectName}, ${input.projectTitle.toLowerCase()}, to work through the problems real systems of this kind face: ${input.hardParts.slice(0, 3).join(", ").toLowerCase()}.`,
    "",
    "## Approach",
    `I used ${input.stack.slice(0, 6).join(", ")}, working with an AI coding agent: a written spec, a reviewed plan, failing tests first, then the implementation.`,
    "",
    "## Key decisions",
    ...(input.decisions.length ? input.decisions.map((d) => `- ${d}`) : ["- (Pick up to three public decisions from your journal to feature here.)"]),
    "",
    "## Results",
    metricLines || "- (Add the numbers you measured.)",
    "",
    "## What I'd do next",
    "- (Write what you'd improve with more time.)",
  ].join("\n");
  const m = input.metrics[0];
  const bullets = [
    `Built ${input.projectName}, ${input.projectTitle.toLowerCase()}, using ${input.stack.slice(0, 4).join(", ")}${m ? `, achieving ${m.label.toLowerCase()} of ${m.value}` : ""}.`,
    ...input.metrics.slice(1, 3).map((x) => `Measured and documented ${x.label.toLowerCase()} of ${x.value} under test.`),
    ...input.decisions.slice(0, 2).map((d) => `Made and documented a design decision: ${d.split(/(?<=\.)\s/)[0]}`),
  ].slice(0, 5);
  return { caseStudy, bullets };
}

export async function generateProofDraft(input: GeneratorInput): Promise<{ caseStudy: string; bullets: string[]; dropped: number; mocked: boolean }> {
  const allowed = allowedNumbers([
    ...input.metrics.flatMap((m) => [m.label, m.value]),
    ...input.decisions,
    input.projectName,
    input.projectTitle,
    ...input.stack,
    ...input.hardParts,
  ]);
  let draft: { caseStudy: string; bullets: string[] };
  let mocked = false;
  if (mock.ai) {
    draft = templateDraft(input);
    mocked = true;
  } else {
    const res = await anthropic().messages.parse({
      model: model(),
      max_tokens: 4000,
      system: generatorSystemPrompt,
      output_config: { effort: "low", format: zodOutputFormat(Output) },
      messages: [{ role: "user", content: generatorUserPrompt(input) }],
    });
    if (!res.parsed_output) throw new Error("The generator returned an unexpected format.");
    draft = res.parsed_output;
  }
  const bullets = filterBullets(draft.bullets.map((b) => b.trim()).filter(Boolean), allowed).slice(0, 5);
  return { caseStudy: scrubCaseStudy(draft.caseStudy, allowed), bullets, dropped: draft.bullets.length - bullets.length, mocked };
}
