import { currentPrice, getProduct, site } from "@/config/site";
import { getStore, type Order, type Utm } from "./db";
import { isEmail, normaliseEmail, randomId } from "./ids";
import { createRazorpayOrder, razorpayConfigured } from "./razorpay";

export class CheckoutError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface CheckoutInput {
  productSlug: string;
  email?: string;
  referralCode?: string;
  utm?: Utm;
}

export interface CheckoutResult {
  orderId: string;
  razorpayOrderId: string;
  amountPaise: number;
  keyId: string | null;
  productName: string;
  discount: number;
  /** True when no Razorpay keys are set (local development): pay with the dev simulator. */
  simulated: boolean;
}

/** Resolves a referral discount. A buyer can't use their own code. */
export async function referralDiscount(
  code: string | undefined,
  email: string | undefined,
): Promise<{ code: string | null; discount: number }> {
  if (!code || !site.referral.enabled) return { code: null, discount: 0 };
  const ref = await getStore().getReferralCode(code.trim().toUpperCase());
  if (!ref) return { code: null, discount: 0 };
  if (email && normaliseEmail(email) === ref.email) return { code: null, discount: 0 };
  return { code: ref.code, discount: site.referral.friendDiscount };
}

export async function createCheckout(
  input: CheckoutInput,
  now = new Date(),
): Promise<CheckoutResult> {
  const product = getProduct(input.productSlug);
  if (!product || product.status !== "available")
    throw new CheckoutError("This product isn't on sale yet.", 404);
  const email = input.email ? normaliseEmail(input.email) : undefined;
  if (email && !isEmail(email)) throw new CheckoutError("That email doesn't look right.");

  const price = currentPrice(product, now);
  const { code, discount } = await referralDiscount(input.referralCode, email);
  const amountInr = Math.max(1, price - discount);
  const amountPaise = amountInr * 100;
  const id = randomId("sq");

  const simulated = !razorpayConfigured();
  if (simulated && process.env.NODE_ENV === "production")
    throw new CheckoutError("Payments are not configured.", 503);

  const rzp = simulated
    ? { id: randomId("order_dev"), amount: amountPaise }
    : await createRazorpayOrder({
        amountPaise,
        receipt: id,
        notes: { order_id: id, product: product.slug },
      });

  const order: Order = {
    id,
    razorpay_order_id: rzp.id,
    product_slug: product.slug,
    amount: amountPaise,
    currency: "INR",
    email: email ?? null,
    phone: null,
    status: "created",
    razorpay_payment_id: null,
    referral_code: code,
    discount,
    utm: input.utm ?? {},
    created_at: now.toISOString(),
    paid_at: null,
    fulfilled_at: null,
    delivery_email_sent_at: null,
    lock_until: null,
    attempts: 0,
    last_error: null,
    capi_sent_at: null,
    review_ask_sent_at: null,
  };
  await getStore().createOrder(order);

  return {
    orderId: id,
    razorpayOrderId: rzp.id,
    amountPaise,
    keyId: process.env.RAZORPAY_KEY_ID ?? null,
    productName: product.name,
    discount,
    simulated,
  };
}

/** Applies a captured payment to an order. Returns the order id, or null if it isn't ours. */
export async function applyPayment(input: {
  razorpayOrderId: string;
  paymentId: string;
  amountPaise: number;
  email?: string | null;
  phone?: string | null;
}): Promise<Order | null> {
  const store = getStore();
  const order = await store.getOrderByRazorpayId(input.razorpayOrderId);
  if (!order) return null;
  if (input.amountPaise !== order.amount) {
    throw new Error(
      `amount mismatch on ${order.id}: paid ${input.amountPaise}, expected ${order.amount}`,
    );
  }
  const email = order.email ?? (input.email ? normaliseEmail(input.email) : null);
  return store.markOrderPaid(order.id, input.paymentId, email, input.phone ?? null);
}
