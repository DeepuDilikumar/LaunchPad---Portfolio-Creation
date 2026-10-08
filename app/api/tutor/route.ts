import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { getSessionUser } from "@/lib/auth/session";
import { error, parseBody } from "@/lib/http";
import { getDb, schema } from "@/lib/db";
import { getProject } from "@/content/catalog";
import { canAccess } from "@/lib/entitlements";
import { findCell, getModule } from "@/lib/content";
import { pricingConfig } from "@/config/pricing";
import { mock } from "@/lib/env";
import { anthropic, model } from "@/lib/ai/client";
import { tutorSystemPrompt } from "@/lib/ai/prompts";
import { cannedReply, tutorQuota } from "@/lib/ai/tutor";
import { recordEvent } from "@/lib/analytics/server";
import { rateLimit } from "@/lib/rate-limit";

const toolNames = { claude: "Claude Code", codex: "Codex", cursor: "Cursor" } as const;

const body = z.object({
  project: z.string().max(40),
  module: z.string().max(80),
  cellId: z.string().max(80).nullable().optional(),
  tool: z.enum(["claude", "codex", "cursor"]).default("claude"),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(pricingConfig.tutor.maxInputChars) }))
    .min(1)
    .max(8),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return error(401, "Sign in to use the tutor.");
  const burst = await rateLimit(`tutor-burst:${user.id}`, Number(process.env.TUTOR_BURST_PER_MINUTE ?? 6), 60);
  if (!burst.ok) return error(429, "Slow down a little: wait a minute before the next question.");
  const [data, bad] = await parseBody(req, body);
  if (bad) return bad;
  const last = data.messages[data.messages.length - 1]!;
  if (last.role !== "user" || !last.content.trim()) return error(400, "Send a question.");

  const p = getProject(data.project);
  const m = getModule(data.project, data.module);
  if (!p || !m) return error(404, "Unknown module.");
  if (!(await canAccess(user, data.project, data.module))) return error(403, "This module isn't unlocked on your account.");

  const quota = await tutorQuota(user.id, user.isAdmin);
  if (quota.remaining <= 0) {
    const at = quota.resetAt.toISOString().slice(11, 16);
    return error(
      429,
      `You've used today's ${quota.limit} tutor messages. They reset at ${at} UTC.${quota.pro ? "" : " Pro raises the daily limit."} The Pitfall cells in each module cover the most common problems.`,
      { resetAt: quota.resetAt.toISOString() },
    );
  }

  const found = data.cellId ? findCell(data.project, data.module, data.cellId) : undefined;
  const context = [
    `<module_context>`,
    `Project: ${p.name} (${p.title})`,
    `Module ${m.frontmatter.order}: ${m.frontmatter.title}`,
    `Objectives: ${m.frontmatter.objectives.join("; ")}`,
    ...(found ? [`Previous cells:\n${found.before.map((c) => c.source).join("\n\n")}`, `Current cell:\n${found.cell.source}`] : []),
    `</module_context>`,
  ].join("\n");

  const db = await getDb();
  await db.insert(schema.tutorMessages).values({
    userId: user.id,
    project: data.project,
    module: data.module,
    cellId: found?.cell.id ?? null,
    role: "user",
    content: last.content,
  });
  await recordEvent("tutor_message_sent", user.id, { project: data.project, module: data.module, cell: found?.cell.id ?? null });

  const encoder = new TextEncoder();
  const tool = toolNames[data.tool];

  const log = async (content: string, tokensIn: number, tokensOut: number) => {
    await db.insert(schema.tutorMessages).values({ userId: user.id, project: data.project, module: data.module, cellId: found?.cell.id ?? null, role: "assistant", content, tokensIn, tokensOut });
  };

  if (mock.ai) {
    const reply = cannedReply({ projectName: p.name, moduleTitle: m.frontmatter.title, cellLabel: found?.cell.label ?? null, tool, paste: last.content });
    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of reply.match(/[\s\S]{1,24}/g) ?? []) {
          controller.enqueue(encoder.encode(chunk));
          await new Promise((r) => setTimeout(r, 8));
        }
        await log(reply, 0, 0);
        controller.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-tutor-remaining": String(quota.remaining - 1) } });
  }

  const history = data.messages.slice(0, -1).map((x) => ({ role: x.role, content: x.content }));
  const stream = anthropic().messages.stream({
    model: model(),
    max_tokens: pricingConfig.tutor.maxOutputTokens,
    output_config: { effort: "low" },
    system: tutorSystemPrompt({ project: p.name, module: m.frontmatter.title, tool }),
    messages: [...history, { role: "user", content: `${context}\n\n<learner_paste>\n${last.content}\n</learner_paste>` }],
  });

  const body2 = new ReadableStream({
    async start(controller) {
      let text = "";
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            text += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          const note = "\n\nI can't help with that one. Try rephrasing around the error you're seeing.";
          text += note;
          controller.enqueue(encoder.encode(note));
        }
        await log(text, final.usage.input_tokens, final.usage.output_tokens);
      } catch (e) {
        const msg = e instanceof Anthropic.RateLimitError ? "The tutor is busy right now. Try again in a minute." : "The tutor couldn't finish that answer. Try again.";
        controller.enqueue(encoder.encode(`${text ? "\n\n" : ""}${msg}`));
        console.error("[tutor]", e);
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });
  return new Response(body2, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-tutor-remaining": String(quota.remaining - 1) } });
}
