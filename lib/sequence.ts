import { site } from "@/config/site";
import { SequenceEmail } from "@/emails/SequenceEmail";
import { findQuestion } from "./content/load";
import { getStore, type Lead, type ScheduledEmail } from "./db";
import { renderEmail } from "./email/render";
import { getMailer } from "./email/send";
import { signToken } from "./ids";
import { loadQuiz } from "./quiz-data";
import { scoreQuiz } from "./quiz";

export const SEQUENCE = "readiness-v1";
/** Day offsets for the 3 emails after the Readiness Check: 3 emails over 5 days. */
export const SEQUENCE_DAYS = [1, 3, 5];

/** The footer link: a page with a confirm button. */
export function unsubscribeUrl(leadId: string): string {
  return `${site.url}/unsubscribe?t=${encodeURIComponent(signToken({ l: leadId }))}`;
}

/** The List-Unsubscribe header target: RFC 8058 one-click POST. */
export function oneClickUnsubscribeUrl(leadId: string): string {
  return `${site.url}/api/unsubscribe?t=${encodeURIComponent(signToken({ l: leadId }))}`;
}

export function scheduleSequence(leadId: string, from = new Date()) {
  return getStore().scheduleEmails(
    SEQUENCE_DAYS.map((days, i) => ({
      lead_id: leadId,
      sequence: SEQUENCE,
      step: i + 1,
      send_at: new Date(from.getTime() + days * 86400_000).toISOString(),
    })),
  );
}

const utm = (step: number) =>
  `utm_source=email&utm_medium=sequence&utm_campaign=${SEQUENCE}&utm_content=step${step}`;

/** Builds and sends one sequence email. Returns false when the lead can't be emailed. */
export async function sendSequenceStep(row: ScheduledEmail, lead: Lead): Promise<boolean> {
  if (lead.unsubscribed_at || !lead.consent_marketing) return false;
  const quiz = loadQuiz("backend");
  const result = await getStore().latestQuizResult(lead.id);
  const outcome = result ? scoreQuiz(quiz, result.answers) : null;
  const weakest = outcome?.weakest ?? null;
  const guideUrl = `${site.url}/guides/backend?${utm(row.step)}`;
  const unsub = unsubscribeUrl(lead.id);

  let props: Parameters<typeof SequenceEmail>[0];
  if (row.step === 1) {
    const area = weakest ?? quiz.areas[0];
    const q = quiz.questions.find((x) => x.area === area.id)!;
    props = {
      preview: `Why ${area.title.toLowerCase()} follow-ups trip people up`,
      heading: weakest
        ? `Your weakest area: ${area.title.toLowerCase()}`
        : `The area most worth a second look: ${area.title.toLowerCase()}`,
      paragraphs: [
        weakest
          ? `In your Readiness Check, this was the area where the follow-ups caught you. Here's the pattern behind it.`
          : `You did well across the board in your Readiness Check. Here's the pattern behind one of the harder areas.`,
        `Interviewer: "${q.prompt}"`,
        `What a strong answer does: ${q.strong_answer}`,
        `The trick isn't memorising this. It's noticing that every follow-up in this area asks the same thing: what happens when the happy path breaks, and how do you know?`,
      ],
      cta: { label: "See the full module", url: guideUrl },
      unsubscribeUrl: unsub,
    };
  } else if (row.step === 2) {
    const area = weakest ?? quiz.areas[0];
    const sourceId = quiz.questions.find((x) => x.area === area.id)!.source;
    const q = findQuestion("backend", sourceId);
    props = {
      preview: "One full question page from the guide, free",
      heading: "One full page from the guide",
      paragraphs: [
        "Here's a complete question from the Backend Switch Guide, the way it appears in the PDF. Try answering each follow-up out loud before reading the strong answer.",
      ],
      question: q
        ? {
            label: q.label,
            title: q.title,
            intent: q.intent,
            weak: q.weak_answer,
            whyItFails: q.why_it_fails,
            followUps: q.follow_ups.map((f) => ({ type: f.type, question: f.question })),
            moves: q.answer_framework,
          }
        : undefined,
      cta: { label: "Read 4 more pages on the site", url: `${guideUrl}#pages` },
      unsubscribeUrl: unsub,
    };
  } else {
    const reviews = await getStore().listReviews("published");
    // Prefer a review from someone with the same experience band.
    const review = reviews.find((r) => r.years === lead.segment.experience) ?? reviews[0];
    props = {
      preview: review ? "What another engineer said about the guide" : "Why I wrote the guide",
      heading: review ? "From someone in your spot" : `A note from ${site.author.name}`,
      paragraphs: review
        ? ["Here's what one buyer said after using the guide."]
        : [
            ...site.author.bio,
            "If your interview is coming up, the guide is the fastest way to practise the follow-ups.",
          ],
      review: review
        ? { body: review.body, name: review.name, role: review.role, years: review.years }
        : undefined,
      cta: { label: "Get the Backend Switch Guide", url: guideUrl },
      unsubscribeUrl: unsub,
    };
  }

  const { html, text } = await renderEmail(SequenceEmail(props));
  await getMailer().send({
    to: lead.email,
    subject: props.heading,
    html,
    text,
    idempotencyKey: `seq-${row.id}`,
    headers: {
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl(lead.id)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    tags: [{ name: "type", value: `sequence-${row.step}` }],
  });
  return true;
}
