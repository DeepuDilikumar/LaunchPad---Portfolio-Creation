import { cookies } from "next/headers";
import { bad, json, readJson } from "@/lib/http";
import { CheckoutError, createCheckout } from "@/lib/orders";
import { parseUtmCookie, REF_COOKIE, UTM_COOKIE } from "@/lib/utm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson<{ product?: string; email?: string; ref?: string }>(req);
  if (!body?.product) return bad("Missing product.");
  const jar = await cookies();
  try {
    const result = await createCheckout({
      productSlug: body.product,
      email: body.email || undefined,
      referralCode: body.ref || jar.get(REF_COOKIE)?.value,
      utm: parseUtmCookie(jar.get(UTM_COOKIE)?.value),
    });
    return json(result);
  } catch (err) {
    if (err instanceof CheckoutError) return bad(err.message, err.status);
    console.error("checkout failed", err);
    return bad("Couldn't start checkout. Please try again.", 500);
  }
}
