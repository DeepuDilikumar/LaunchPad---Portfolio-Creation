import { sha256 } from "./ids";
import { site } from "@/config/site";

/**
 * Meta Conversions API. Sent from the payment webhook so purchases count even when the
 * browser Pixel is blocked. The browser Pixel uses the same event_id (the order id), so Meta
 * counts the purchase once.
 */
export async function sendMetaPurchase(input: {
  orderId: string;
  email: string | null;
  phone: string | null;
  valueInr: number;
  productSlug: string;
  eventTime: Date;
  sourceUrl?: string;
}): Promise<boolean> {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return false;

  const user_data: Record<string, string[]> = {};
  if (input.email) user_data.em = [sha256(input.email.trim().toLowerCase())];
  if (input.phone) user_data.ph = [sha256(input.phone.replace(/\D/g, ""))];

  const body: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(input.eventTime.getTime() / 1000),
        event_id: input.orderId,
        action_source: "website",
        event_source_url: input.sourceUrl ?? `${site.url}/thank-you`,
        user_data,
        custom_data: {
          currency: "INR",
          value: input.valueInr,
          content_ids: [input.productSlug],
          content_type: "product",
          order_id: input.orderId,
        },
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`meta capi: ${res.status} ${await res.text()}`);
  return true;
}
