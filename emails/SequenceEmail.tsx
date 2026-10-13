import { Section, Text } from "@react-email/components";
import { Button, H, Label, Layout, P, colors, mono } from "./Layout";

export interface SequenceEmailProps {
  preview: string;
  heading: string;
  paragraphs: string[];
  question?: {
    label: string;
    title: string;
    intent: string;
    weak: string;
    whyItFails: string;
    followUps: { type: string; question: string }[];
    moves: string[];
  };
  review?: { body: string; name: string; role: string; years: string };
  cta: { label: string; url: string };
  unsubscribeUrl: string;
}

export function SequenceEmail({
  preview,
  heading,
  paragraphs,
  question,
  review,
  cta,
  unsubscribeUrl,
}: SequenceEmailProps) {
  return (
    <Layout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      <H>{heading}</H>
      {paragraphs.map((p) => (
        <P key={p}>{p}</P>
      ))}
      {question ? (
        <Section
          style={{
            border: "1px solid #E2DACA",
            borderRadius: 8,
            padding: "16px",
            margin: "4px 0 18px",
          }}
        >
          <Text style={{ fontFamily: mono, fontSize: 11, color: "#8A8273", margin: "0 0 6px" }}>
            {question.label}
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 700, lineHeight: "24px", margin: "0 0 10px" }}>
            {question.title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              background: colors.blueWash,
              borderRadius: 6,
              padding: "8px 10px",
              margin: "0 0 10px",
            }}
          >
            Tests: {question.intent}
          </Text>
          <Text style={{ fontSize: 14, margin: "0 0 4px" }}>
            Usual answer:{" "}
            <span style={{ textDecoration: "line-through", color: colors.red }}>
              “{question.weak}”
            </span>
          </Text>
          <Text style={{ fontSize: 14, color: "#3F3A30", margin: "0 0 12px" }}>
            {question.whyItFails}
          </Text>
          <Label>Follow-up ladder</Label>
          {question.followUps.map((f) => (
            <Text key={f.question} style={{ fontSize: 14, margin: "0 0 6px" }}>
              <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 600 }}>
                {f.type.toUpperCase()}
              </span>{" "}
              · {f.question}
            </Text>
          ))}
          <Section
            style={{
              background: colors.greenWash,
              border: `1.5px solid ${colors.green}`,
              borderRadius: 8,
              padding: "10px 12px",
              marginTop: 10,
            }}
          >
            <Label color="#1F5C37">Strong answer, in {question.moves.length} moves</Label>
            {question.moves.map((m, i) => (
              <Text key={m} style={{ fontSize: 14, margin: "0 0 4px" }}>
                {i + 1}. {m}
              </Text>
            ))}
          </Section>
        </Section>
      ) : null}
      {review ? (
        <Section
          style={{
            background: "#FFF8D6",
            border: "1px solid #E8DA9A",
            borderRadius: 6,
            padding: "14px 16px",
            margin: "0 0 18px",
          }}
        >
          <Text style={{ fontSize: 15, lineHeight: "22px", margin: "0 0 8px" }}>
            “{review.body}”
          </Text>
          <Text style={{ fontFamily: mono, fontSize: 12, color: colors.muted, margin: 0 }}>
            {review.name} · {review.role} · {review.years} yrs · verified buyer
          </Text>
        </Section>
      ) : null}
      <Button href={cta.url}>{cta.label}</Button>
    </Layout>
  );
}

export default SequenceEmail;
