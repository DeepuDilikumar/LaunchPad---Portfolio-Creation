import { z } from "zod";

export const followUpTypes = [
  "technical",
  "failure",
  "tradeoff",
  "ownership",
  "measurement",
] as const;
export type FollowUpType = (typeof followUpTypes)[number];

const nonEmpty = z.string().trim().min(1);

export const followUpSchema = z.object({
  type: z.enum(followUpTypes),
  question: nonEmpty,
  what_it_tests: nonEmpty,
  strong_points: z.array(nonEmpty).min(1),
});

export const flowSchema = z.object({
  nodes: z
    .array(z.object({ label: nonEmpty, bad: z.boolean().optional() }))
    .min(2)
    .max(5),
  note: z.string().optional(),
});

export const questionSchema = z
  .object({
    id: z.string().regex(/^[a-z]{2,4}-[a-z]{2,6}-\d{3}$/, "id must look like be-pay-003"),
    guide: nonEmpty,
    module: nonEmpty,
    title: nonEmpty,
    rounds: z.array(nonEmpty).min(1),
    seniority: z.array(z.enum(["0-2", "2-4", "4-8", "8+"])).min(1),
    intent: nonEmpty,
    weak_answer: nonEmpty,
    why_it_fails: nonEmpty,
    /** Short handwritten margin note next to the weak answer. */
    red_note: z.string().max(60).optional(),
    /** Short handwritten note above the flow diagram. */
    margin_note: z.string().max(60).optional(),
    flow: flowSchema.optional(),
    follow_ups: z.array(followUpSchema),
    rejection_signals: z.array(nonEmpty).min(1),
    answer_framework: z.array(nonEmpty).min(2).max(5),
    model_answer: nonEmpty,
    diagram: z.string().optional(),
    self_check: z.array(nonEmpty).min(1),
    sources: z.array(z.string().url()).min(1),
    reviewed: z.boolean(),
  })
  .superRefine((q, ctx) => {
    if (q.follow_ups.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["follow_ups"],
        message: `needs at least 3 follow-ups, has ${q.follow_ups.length}`,
      });
    }
    const types = new Set(q.follow_ups.map((f) => f.type));
    if (types.size < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["follow_ups"],
        message: "follow-ups must cover at least 2 types",
      });
    }
    for (const f of [q.model_answer, ...q.answer_framework]) {
      if (f.includes("...")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "placeholder text ('...') left in the file",
        });
        break;
      }
    }
  });

export type Question = z.infer<typeof questionSchema>;
export type FollowUp = z.infer<typeof followUpSchema>;

export const guideMetaSchema = z.object({
  slug: nonEmpty,
  title: nonEmpty,
  idPrefix: z.string().regex(/^[a-z]{2,4}$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  modules: z
    .array(z.object({ slug: nonEmpty, number: z.number().int().positive(), title: nonEmpty }))
    .min(1),
  /** Question ids shown in full on the product page. Must be reviewed to ship. */
  samples: z.array(nonEmpty).max(6),
  /** Question id used in the interactive follow-up demo. */
  demo: z.object({
    question: nonEmpty,
    options: z
      .array(
        z.object({
          text: nonEmpty,
          grade: z.enum(["weak", "okay", "strong"]),
          verdict: nonEmpty,
        }),
      )
      .length(3),
    followUpIndex: z.number().int().min(0),
  }),
});

export type GuideMeta = z.infer<typeof guideMetaSchema>;
