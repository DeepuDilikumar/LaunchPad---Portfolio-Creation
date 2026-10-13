import { site } from "@/config/site";
import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description: `Write to ${site.support.email}. We ${site.support.responseTime}.`,
  path: "/contact",
  og: { title: "Contact", kicker: "contact" },
});

export default function ContactPage() {
  return (
    <LegalPage title="Contact" kicker="contact">
      <p>
        Email <a href={`mailto:${site.support.email}`}>{site.support.email}</a>. A real person reads
        every message and {site.support.responseTime}.
      </p>
      <h2>Fastest answers</h2>
      <ul>
        <li>
          Didn’t get your download? Include your order ID (it’s on the payment confirmation) or the
          email you paid with.
        </li>
        <li>
          Found a mistake in a guide? Tell us the question number. Fixes ship as free updates and go
          on the public changelog.
        </li>
        <li>Want a refund? Just ask; see the refund policy.</li>
      </ul>
    </LegalPage>
  );
}
