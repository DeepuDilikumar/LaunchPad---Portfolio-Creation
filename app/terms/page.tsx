import { site } from "@/config/site";
import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms",
  description: "The terms for buying and using our guides.",
  path: "/terms",
  og: { title: "Terms", kicker: "terms" },
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms" kicker="terms">
      <h2>What you’re buying</h2>
      <p>
        A digital guide in PDF form (an A4 edition and a phone edition), delivered by email, plus
        free updates for {site.delivery.updatesMonths} months. The price on the page is the price
        you pay, including GST.
      </p>
      <h2>Your licence</h2>
      <ul>
        <li>
          The guide is for your personal use. Each copy is stamped with the buyer’s email and order
          ID.
        </li>
        <li>
          Please don’t share, resell or upload it. Copies found shared may have their updates
          stopped.
        </li>
      </ul>
      <h2>What we don’t promise</h2>
      <p>
        The guide helps you prepare. It does not promise interviews, offers, jobs or a salary. The
        questions come from public interview write-ups and real work experience, not from any
        company’s internal or confidential material.
      </p>
      <h2>Prices and launch offers</h2>
      <p>
        A launch price, when we run one, shows its end date on the page and ends on that date. We
        don’t run countdowns that reset.
      </p>
      <h2>Refunds</h2>
      <p>
        See the refund policy: {site.refund.policy}, and delivery problems are always fixed or
        refunded.
      </p>
      <h2>Contact and disputes</h2>
      <p>
        Write to {site.support.email} first; most things are sorted within a day. These terms are
        governed by the laws of India.
      </p>
    </LegalPage>
  );
}
