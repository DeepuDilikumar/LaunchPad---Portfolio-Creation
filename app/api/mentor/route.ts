import { z } from "zod"

import { isResponse, isSameOrigin, jsonError, userOrUnauthorized } from "@/lib/auth/api"
import { db } from "@/lib/db"
import { isLLMConfigured, streamText } from "@/lib/llm"
import { mentorSystem } from "@/lib/prompts/mentor"
import { isUnlocked } from "@/lib/program/schedule"
import { getActiveProgram } from "@/lib/program/service"
import { getProject } from "@/content/projects"
import type { MentorMessageRow } from "@/lib/data/records"
import { clientKey, rateLimit } from "@/lib/rate-limit"

const Body = z.object({ day: z.number().int().min(1).max(14), message: z.string().min(1).max(4000) })

/** Mentor chat for a day. Streams plain text. History is saved per day. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden", "Request blocked.")
  const user = await userOrUnauthorized()
  if (isResponse(user)) return user
  const parsed = Body.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return jsonError(400, "bad_request", "Type a question first.")
  const program = await getActiveProgram(user.id)
  const project = program ? getProject(program.project_key) : null
  if (!program || !project) return jsonError(404, "no_program", "Start the program first.")
  const { day, message } = parsed.data
  if (!isUnlocked(day, new Date(program.started_at), program.timezone)) return jsonError(403, "locked", "This day hasn't unlocked yet.")
  if (!rateLimit(`mentor:${clientKey(request, user.id)}`, 30, 60 * 60_000).ok) {
    return jsonError(429, "rate_limited", "You've asked a lot this hour. Take a short break, then try again.")
  }

  const dayContent = project.days[day - 1]
  const history = await db().select<MentorMessageRow>(
    "mentor_messages",
    { program_id: program.id, day_number: day },
    { order: { column: "created_at", ascending: true } }
  )
  await db().insert<MentorMessageRow>("mentor_messages", {
    program_id: program.id,
    user_id: user.id,
    day_number: day,
    role: "user",
    content: message,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = ""
      const emit = (text: string) => {
        answer += text
        controller.enqueue(encoder.encode(text))
      }
      if (!isLLMConfigured()) {
        emit(
          `The AI mentor isn't switched on for this server yet, so here's what the hints for today suggest:\n\n${dayContent.hints
            .map((h) => `• ${h}`)
            .join("\n")}\n\nIf you're stuck on an error, search the exact message, and check each step on this page in order.`
        )
      } else {
        for await (const chunk of streamText({
          task: "mentor",
          system: mentorSystem(project, dayContent),
          messages: [
            ...history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
            { role: "user" as const, content: message },
          ],
          effort: "low",
        })) {
          emit(chunk)
        }
      }
      await db().insert<MentorMessageRow>("mentor_messages", {
        program_id: program.id,
        user_id: user.id,
        day_number: day,
        role: "assistant",
        content: answer,
      })
      controller.close()
    },
  })
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } })
}
