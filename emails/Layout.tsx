import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { site } from "@/config/site";

export const colors = {
  paper: "#F5F1E6",
  card: "#FFFEFA",
  ink: "#1C1A16",
  muted: "#5C5648",
  blue: "#2340B0",
  marker: "#FFE36E",
  red: "#C2412D",
  green: "#2E7A4B",
  greenWash: "#E3F1E7",
  blueWash: "#E6ECFB",
};

const font = "'IBM Plex Sans', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
export const mono = "'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";

export function Layout({
  preview,
  children,
  unsubscribeUrl,
}: {
  preview: string;
  children: ReactNode;
  unsubscribeUrl?: string;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          background: colors.paper,
          fontFamily: font,
          color: colors.ink,
          margin: 0,
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            background: colors.card,
            border: `1.5px solid ${colors.ink}`,
            borderRadius: 14,
            padding: "28px 28px 20px",
          }}
        >
          <Text style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
            <span
              style={{
                background: colors.ink,
                color: colors.marker,
                borderRadius: 6,
                padding: "3px 6px",
                fontFamily: mono,
                fontSize: 12,
                marginRight: 8,
              }}
            >
              {site.logoMark}
            </span>
            {site.name}
          </Text>
          <Section style={{ marginTop: 18 }}>{children}</Section>
          <Hr style={{ borderColor: "#E2DACA", margin: "24px 0 12px" }} />
          <Text style={{ fontSize: 12, color: colors.muted, lineHeight: "18px", margin: 0 }}>
            {site.business.legalName} · {site.business.city}
            <br />
            Questions? Reply to this email or write to {site.support.email} (
            {site.support.responseTime}).
            {unsubscribeUrl ? (
              <>
                <br />
                <Link href={unsubscribeUrl} style={{ color: colors.muted }}>
                  Unsubscribe in one click
                </Link>
              </>
            ) : null}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function H({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 24,
        lineHeight: "30px",
        fontWeight: 800,
        margin: "0 0 12px",
        letterSpacing: "-0.02em",
      }}
    >
      {children}
    </Text>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <Text style={{ fontSize: 15, lineHeight: "24px", margin: "0 0 12px", color: "#2B2820" }}>
      {children}
    </Text>
  );
}

export function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        background: colors.blue,
        color: "#FFFFFF",
        fontWeight: 600,
        fontSize: 15,
        padding: "12px 20px",
        borderRadius: 10,
        textDecoration: "none",
        borderBottom: "3px solid #16297A",
      }}
    >
      {children}
    </Link>
  );
}

export function Label({ children, color = colors.muted }: { children: ReactNode; color?: string }) {
  return (
    <Text
      style={{
        fontFamily: mono,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.06em",
        color,
        margin: "0 0 6px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Text>
  );
}
