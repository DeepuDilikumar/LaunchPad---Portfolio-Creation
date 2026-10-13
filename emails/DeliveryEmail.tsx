import { Section, Text } from "@react-email/components";
import { site } from "@/config/site";
import { Button, H, Label, Layout, P, colors, mono } from "./Layout";

export interface DeliveryEmailProps {
  orderId: string;
  productName: string;
  amountInr: number;
  downloads: { label: string; url: string }[];
  thankYouUrl: string;
  resent?: boolean;
}

export function DeliveryEmail({
  orderId,
  productName,
  amountInr,
  downloads,
  thankYouUrl,
  resent,
}: DeliveryEmailProps) {
  return (
    <Layout preview={`Your ${productName} is ready to download`}>
      <H>{resent ? "Here's a fresh download link." : `Your ${productName} is ready.`}</H>
      <P>
        Both editions are below: A4 for a laptop, and the phone edition with large type for reading
        on the go. Your copy is stamped with your email address.
      </P>
      {downloads.map((d) => (
        <Section key={d.url} style={{ margin: "0 0 10px" }}>
          <Button href={d.url}>{d.label}</Button>
        </Section>
      ))}
      <Text style={{ fontFamily: mono, fontSize: 12, color: colors.muted, margin: "8px 0 16px" }}>
        Links work for {site.delivery.linkHours} hours and {site.delivery.maxDownloads} downloads.
        Need a new one? Open {thankYouUrl} or reply to this email.
      </Text>
      <Label>Your order</Label>
      <P>
        {productName} · ₹{amountInr.toLocaleString("en-IN")} (GST included) · order {orderId}
      </P>
      <Label>What happens next</Label>
      <P>
        Free updates for {site.delivery.updatesMonths} months arrive by email. If it doesn&apos;t
        help, email us within {site.refund.days} days of your first purchase for a full refund.
      </P>
    </Layout>
  );
}

export default DeliveryEmail;
