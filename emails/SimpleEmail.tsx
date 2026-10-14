import { Section } from "@react-email/components";
import { Button, H, Layout, P } from "./Layout";

export interface SimpleEmailProps {
  preview: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; url: string };
  unsubscribeUrl?: string;
}

/** Review asks, referral links, update notices and login links. */
export function SimpleEmail({
  preview,
  heading,
  paragraphs,
  cta,
  unsubscribeUrl,
}: SimpleEmailProps) {
  return (
    <Layout preview={preview} unsubscribeUrl={unsubscribeUrl}>
      <H>{heading}</H>
      {paragraphs.map((p) => (
        <P key={p}>{p}</P>
      ))}
      {cta ? (
        <Section style={{ marginTop: 6 }}>
          <Button href={cta.url}>{cta.label}</Button>
        </Section>
      ) : null}
    </Layout>
  );
}

export default SimpleEmail;
