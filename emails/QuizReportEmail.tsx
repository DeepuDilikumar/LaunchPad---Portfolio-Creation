import { Section, Text } from "@react-email/components";
import { Button, H, Label, Layout, P, colors, mono } from "./Layout";

export interface QuizReportEmailProps {
  strong: number;
  total: number;
  areas: { title: string; correct: number; total: number }[];
  weakestTitle: string | null;
  guideUrl: string;
  unsubscribeUrl?: string;
}

export function QuizReportEmail({
  strong,
  total,
  areas,
  weakestTitle,
  guideUrl,
  unsubscribeUrl,
}: QuizReportEmailProps) {
  return (
    <Layout
      preview={`Your Readiness Check: ${strong} of ${total} strong`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <H>Your Readiness Check report</H>
      <P>
        You picked the strong answer on {strong} of {total} follow-ups.
        {weakestTitle ? ` Your weakest area was ${weakestTitle.toLowerCase()}.` : ""} The full
        report is attached as a PDF.
      </P>
      <Section
        style={{
          background: colors.blueWash,
          borderRadius: 10,
          padding: "12px 16px",
          margin: "0 0 16px",
        }}
      >
        {areas.map((a) => (
          <Text key={a.title} style={{ fontFamily: mono, fontSize: 13, margin: "4px 0" }}>
            {a.title}: {a.correct}/{a.total}
          </Text>
        ))}
      </Section>
      <Label>Close the gap</Label>
      <P>The Backend Switch Guide has a full module for every area in this check.</P>
      <Button href={guideUrl}>See the guide</Button>
    </Layout>
  );
}

export default QuizReportEmail;
