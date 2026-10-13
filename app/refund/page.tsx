import { site } from "@/config/site";
import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Refund policy",
  description: `${site.refund.policy}. How to ask and how long it takes.`,
  path: "/refund",
  og: { title: "Refund policy", kicker: "refunds" },
});

export default function RefundPage() {
  return (
    <LegalPage title="Refund policy" kicker="refunds">
      <h2>If the guide doesn’t help</h2>
      <p>
        Email {site.support.email} within {site.refund.days} days of your first purchase and we
        refund the full amount. You don’t need to explain why, though we’d like to know what was
        missing.
      </p>
      <h2>If something went wrong with delivery</h2>
      <p>
        If your download doesn’t arrive, a link fails, or a file won’t open, write to us at any
        time. We’ll fix it or refund you, whichever you prefer.
      </p>
      <h2>How refunds are paid</h2>
      <ul>
        <li>Refunds go back to the original payment method through Razorpay.</li>
        <li>
          We start the refund within 2 business days of your email. Your bank usually shows it
          within 5–7 business days after that.
        </li>
        <li>
          The {site.refund.days}-day refund applies to your first purchase from us. Delivery
          problems are covered on every order.
        </li>
      </ul>
      <h2>Duplicate payments</h2>
      <p>
        If you were charged twice for one order, we refund the duplicate without you needing to ask
        once we spot it, and straight away if you tell us.
      </p>
    </LegalPage>
  );
}
