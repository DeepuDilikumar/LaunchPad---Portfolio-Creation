import { cookies } from "next/headers";
import { site } from "@/config/site";
import { QuizReportEmail } from "@/emails/QuizReportEmail";
import { getStore } from "@/lib/db";
import { renderEmail } from "@/lib/email/render";
import { getMailer } from "@/lib/email/send";
import { bad, json, readJson } from "@/lib/http";
import { isEmail, normaliseEmail } from "@/lib/ids";
import { loadQuiz } from "@/lib/quiz-data";
import { scoreQuiz } from "@/lib/quiz";
import { buildQuizReport } from "@/lib/report-pdf";
import { scheduleSequence, unsubscribeUrl } from "@/lib/sequence";
import { parseUtmCookie, UTM_COOKIE } from "@/lib/utm";

export const dynamic = "force-dynamic";

interface Body {
  email?: string;
  source?: "check" | "waitlist";
  product?: string;
  consent?: boolean;
  answers?: Record<string, string>;
  warmup?: Record<string, string>;
}

/**
 * Email capture. From the Readiness Check: emails the full PDF report and, only with opt-in,
 * schedules the 3-email sequence. From a waitlist button: records interest in a coming product.
 */
export async function POST(req: Request) {
  const body = await readJson<Body>(req);
  const email = body?.email ? normaliseEmail(body.email) : "";
  if (!isEmail(email)) return bad("Please enter a valid email.");
  const store = getStore();
  const utm = parseUtmCookie((await cookies()).get(UTM_COOKIE)?.value);

  if (body?.source === "waitlist") {
    const product = body.product?.slice(0, 40) ?? "unknown";
    await store.upsertLead({
      email,
      source: `waitlist:${product}`,
      consent_marketing: true,
      segment: { waitlist: product },
      utm,
    });
    return json({
      ok: true,
      message: "You're on the list. One email when it's out, nothing else.",
    });
  }

  if (!body?.answers) return bad("Missing answers.");
  const quiz = loadQuiz("backend");
  const outcome = scoreQuiz(quiz, body.answers);
  if (!outcome.complete) return bad("Please finish the check first.");
  const warmup = Object.fromEntries(
    Object.entries(body.warmup ?? {}).map(([k, v]) => [k, String(v).slice(0, 40)]),
  );
  const consent = body.consent === true;

  const lead = await store.upsertLead({
    email,
    source: "check",
    consent_marketing: consent,
    segment: warmup,
    utm,
  });
  await store.saveQuizResult({
    lead_id: lead.id,
    quiz: quiz.slug,
    answers: body.answers,
    warmup,
    scores: Object.fromEntries(
      outcome.areas.map((a) => [a.id, { correct: a.correct, total: a.total }]),
    ),
    weakest: outcome.weakest?.id ?? null,
  });

  const report = await buildQuizReport(outcome, warmup);
  const unsub =
    lead.consent_marketing && !lead.unsubscribed_at ? unsubscribeUrl(lead.id) : undefined;
  const { html, text } = await renderEmail(
    QuizReportEmail({
      strong: outcome.strong,
      total: outcome.total,
      areas: outcome.areas,
      weakestTitle: outcome.weakest?.title ?? null,
      guideUrl: `${site.url}/guides/backend?utm_source=email&utm_medium=report`,
      unsubscribeUrl: unsub,
    }),
  );
  await getMailer().send({
    to: email,
    subject: `Your Readiness Check: ${outcome.strong} of ${outcome.total} strong`,
    html,
    text,
    attachments: [{ filename: "readiness-check-report.pdf", content: Buffer.from(report) }],
    tags: [{ name: "type", value: "quiz-report" }],
  });

  if (consent && !lead.unsubscribed_at) await scheduleSequence(lead.id);
  return json({
    ok: true,
    message: consent
      ? "Report sent. Three short emails follow over the next 5 days."
      : "Report sent. Check your inbox.",
  });
}
