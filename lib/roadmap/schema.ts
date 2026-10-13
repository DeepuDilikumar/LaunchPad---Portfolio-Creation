import { z } from "zod";
import { followUpTypes } from "../content/schema";

const nonEmpty = z.string().trim().min(1);
const words = (s: string) => s.trim().split(/\s+/).length;

export const groupItemSchema = z.object({
  group: nonEmpty,
  lines: z.array(nonEmpty).default([]),
  topics: z.array(nonEmpty).min(1).max(4),
});

export const sectionItemSchema = z.union([nonEmpty, groupItemSchema]);

export const sectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: nonEmpty,
  /** The problem that leads from the previous section into this one. */
  why: z.string().optional(),
  minimum: z.boolean(),
  left: z.array(sectionItemSchema).default([]),
  right: z.array(sectionItemSchema).default([]),
});

export const roadmapSchema = z.object({
  slug: nonEmpty,
  title: nonEmpty,
  subtitle: nonEmpty,
  credit: nonEmpty,
  sections: z.array(sectionSchema).min(2),
});

export const roadmapQuestionSchema = z
  .object({
    text: nonEmpty,
    free: z.boolean().default(true),
    weak_answer: z.string().optional(),
    red_note: z.string().max(50).optional(),
    follow_ups: z.array(z.object({ type: z.enum(followUpTypes), text: nonEmpty })).default([]),
    strong_moves: z.array(nonEmpty).default([]),
    asked_in: z.string().optional(),
    /** A backend guide question id that covers this in depth. */
    guide_ref: z.string().optional(),
  })
  .superRefine((q, ctx) => {
    if (q.free && (q.follow_ups.length < 3 || q.strong_moves.length !== 3 || !q.weak_answer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "a free question needs a weak answer, at least 3 follow-ups and exactly 3 strong moves",
      });
    }
  });

export const topicSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: nonEmpty,
  section: nonEmpty,
  why_here: nonEmpty,
  summary: nonEmpty.refine((s) => words(s) <= 60, "summary must be 60 words or fewer"),
  key_tradeoff: z.string().optional(),
  cloud: z.string().optional(),
  flow: z
    .object({
      nodes: z
        .array(z.object({ label: nonEmpty, bad: z.boolean().optional() }))
        .min(2)
        .max(5),
      note: z.string().optional(),
    })
    .optional(),
  questions: z.array(roadmapQuestionSchema).default([]),
  self_check: z.array(nonEmpty).default([]),
  india_note: z.string().optional(),
  related: z.array(nonEmpty).default([]),
  reviewed: z.boolean(),
});

const serviceSchema = z.object({
  service: nonEmpty,
  use_when: nonEmpty,
  docUrl: z.string().url(),
  status: z.enum(["active", "retiring", "retired"]),
});

export const cloudMapSchema = z.object({
  lastVerified: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string(),
  concepts: z.record(
    z.object({
      aws: serviceSchema,
      gcp: serviceSchema,
      azure: serviceSchema,
      gotcha: z.string().optional(),
    }),
  ),
});

export type Roadmap = z.infer<typeof roadmapSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type GroupItem = z.infer<typeof groupItemSchema>;
export type Topic = z.infer<typeof topicSchema>;
export type RoadmapQuestion = z.infer<typeof roadmapQuestionSchema>;
export type CloudMap = z.infer<typeof cloudMapSchema>;
export type CloudEntry = CloudMap["concepts"][string];
