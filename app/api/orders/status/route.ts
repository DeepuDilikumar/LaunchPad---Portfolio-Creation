import { getProduct } from "@/config/site";
import { getStore } from "@/lib/db";
import { maskEmail } from "@/lib/delivery";
import { bad, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("Missing id.");
  const order = await getStore().getOrder(id);
  if (!order) return bad("Order not found.", 404);
  return json({
    id: order.id,
    status: order.status,
    product: getProduct(order.product_slug)?.name ?? order.product_slug,
    productSlug: order.product_slug,
    amountInr: order.amount / 100,
    email: maskEmail(order.email),
    emailSent: Boolean(order.delivery_email_sent_at),
  });
}
