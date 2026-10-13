import { getProduct } from "@/config/site";
import { priceInfo, productOnSale } from "../catalog";
import { publishedQuestions } from "../content/load";
import { cloudFor, loadRoadmap, sectionTopicIds, topicHref, topicVisible } from "./load";
import type { CloudEntry, Topic } from "./schema";

/** Everything the client needs to render one topic. Locked questions carry only their text. */
export interface TopicView {
  id: string;
  title: string;
  href: string;
  sectionId: string;
  sectionTitle: string;
  sectionNumber: number;
  visible: boolean;
  draft: boolean;
  whyHere: string;
  summary: string;
  keyTradeoff: string | null;
  flow: Topic["flow"] | null;
  free: {
    text: string;
    weak: string;
    redNote: string | null;
    followUps: { type: string; text: string }[];
    moves: string[];
    askedIn: string | null;
  }[];
  locked: { text: string; ctaLabel: string; ctaHref: string; ref: string | null }[];
  selfCheck: string[];
  indiaNote: string | null;
  cloud: (CloudEntry & { lastVerified: string }) | null;
  guideQuestions: { label: string; title: string; href: string }[];
  questionCount: number;
}

export interface SectionView {
  id: string;
  number: number;
  title: string;
  why: string | null;
  minimum: boolean;
  topicIds: string[];
  questionCount: number;
  groups: { title: string; lines: string[]; topicIds: string[]; side: "left" | "right" }[];
  left: string[];
  right: string[];
}

export function buildRoadmapView(slug = "system-design") {
  const { roadmap, topics, cloud } = loadRoadmap(slug);
  const byId = new Map(topics.map((t) => [t.id, t]));
  const guideQs = publishedQuestions("backend");
  const backend = getProduct("backend")!;
  const price = priceInfo(backend);
  const onSale = productOnSale("backend");

  const sections: SectionView[] = roadmap.sections.map((s, i) => ({
    id: s.id,
    number: i + 1,
    title: s.title,
    why: s.why ?? null,
    minimum: s.minimum,
    topicIds: sectionTopicIds(s),
    questionCount: 0,
    groups: (["left", "right"] as const).flatMap((side) =>
      s[side]
        .filter((it) => typeof it !== "string")
        .map((g) => {
          const grp = g as { group: string; lines: string[]; topics: string[] };
          return { title: grp.group, lines: grp.lines, topicIds: grp.topics, side };
        }),
    ),
    left: s.left.filter((it): it is string => typeof it === "string"),
    right: s.right.filter((it): it is string => typeof it === "string"),
  }));
  const sectionOf = new Map(sections.flatMap((s) => s.topicIds.map((id) => [id, s] as const)));

  const views: TopicView[] = sections.flatMap((s) =>
    s.topicIds.map((id) => {
      const t = byId.get(id)!;
      const visible = topicVisible(t);
      const gq = guideQs.filter((q) => q.concepts?.includes(id));
      const cloudEntry = cloudFor(t, cloud);
      const view: TopicView = {
        id,
        title: t.title,
        href: topicHref(id),
        sectionId: s.id,
        sectionTitle: s.title,
        sectionNumber: s.number,
        visible,
        draft: !t.reviewed,
        whyHere: visible ? t.why_here : "",
        summary: visible ? t.summary : "",
        keyTradeoff: visible ? (t.key_tradeoff ?? null) : null,
        flow: visible ? (t.flow ?? null) : null,
        free: visible
          ? t.questions
              .filter((q) => q.free)
              .map((q) => ({
                text: q.text,
                weak: q.weak_answer ?? "",
                redNote: q.red_note ?? null,
                followUps: q.follow_ups,
                moves: q.strong_moves,
                askedIn: q.asked_in ?? null,
              }))
          : [],
        locked: visible
          ? t.questions
              .filter((q) => !q.free)
              .map((q) => {
                const inGuide = q.guide_ref && guideQs.some((g) => g.id === q.guide_ref);
                return inGuide
                  ? {
                      text: q.text,
                      ref: q.guide_ref!,
                      ctaLabel: onSale
                        ? `Unlock in the guide · ₹${price.price}`
                        : "In the Backend guide",
                      ctaHref: "/guides/backend#buy",
                    }
                  : {
                      text: q.text,
                      ref: null,
                      ctaLabel: "Coming in the System Design guide",
                      ctaHref: "/guides/system-design",
                    };
              })
          : [],
        selfCheck: visible ? t.self_check : [],
        indiaNote: visible ? (t.india_note ?? null) : null,
        cloud: visible && cloudEntry ? { ...cloudEntry, lastVerified: cloud.lastVerified } : null,
        guideQuestions: gq.map((q) => ({
          label: q.label,
          title: q.title,
          href: "/guides/backend#pages",
        })),
        questionCount: (visible ? t.questions.length : 0) + gq.length,
      };
      return view;
    }),
  );
  for (const v of views) sectionOf.get(v.id)!.questionCount += v.questionCount;
  return { roadmap, sections, topics: views };
}

/** Concept links for a guide question: only topics the site can show. */
export function conceptLinks(
  conceptIds: string[] | undefined,
): { id: string; title: string; href: string }[] {
  if (!conceptIds?.length) return [];
  const { topics } = loadRoadmap();
  return conceptIds
    .map((id) => topics.find((t) => t.id === id))
    .filter((t): t is Topic => Boolean(t && topicVisible(t)))
    .map((t) => ({ id: t.id, title: t.title, href: topicHref(t.id) }));
}
