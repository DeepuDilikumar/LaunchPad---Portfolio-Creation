import { site } from "@/config/site";
import { LegalPage } from "@/components/site/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy",
  description: "What we collect, why, and how to have it deleted.",
  path: "/privacy",
  og: { title: "Privacy", kicker: "privacy" },
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy" kicker="privacy">
      <p>
        We collect as little as we can, and we never sell or share your email. This notice is
        written for India’s Digital Personal Data Protection Act, 2023.
      </p>
      <h2>What we collect and why</h2>
      <ul>
        <li>
          <strong>Orders:</strong> your email, phone (if you give it to Razorpay) and order details,
          to deliver the guide, send updates and handle refunds.
        </li>
        <li>
          <strong>Readiness Check:</strong> your answers and the three warm-up choices. Without an
          email they’re stored anonymously. With an email, we use them to send the report you asked
          for.
        </li>
        <li>
          <strong>Marketing emails:</strong> only if you tick the box. Every email has a one-click
          unsubscribe.
        </li>
        <li>
          <strong>Reviews:</strong> your first name, role and years of experience, shown only with
          your permission.
        </li>
        <li>
          <strong>Analytics:</strong> Google Analytics and the Meta Pixel measure visits and
          purchases. Purchases are also reported to Meta from our server, with your email hashed.
        </li>
        <li>
          <strong>Attribution:</strong> a cookie remembers which ad or link brought you here (30
          days), so we know which ads work.
        </li>
      </ul>
      <h2>Who processes it</h2>
      <p>
        Razorpay (payments), Supabase (database), Cloudflare R2 (files), Resend (email), Vercel
        (hosting), Google and Meta (analytics), Sentry (error reports).
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask to see, correct or delete your data at any time by writing to{" "}
        {site.support.email}. We delete on request within 30 days, except order records we must keep
        for tax law. Grievance officer: {site.business.grievanceOfficer}.
      </p>
    </LegalPage>
  );
}
