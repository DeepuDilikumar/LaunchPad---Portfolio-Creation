import { site } from "@/config/site";
import { pricingConfig } from "@/config/pricing";

export interface LegalDoc {
  title: string;
  updated: string;
  sections: { heading: string; body: string[] }[];
}

const updated = "2026-10-07";

export const legalDocs: Record<string, LegalDoc> = {
  terms: {
    title: "Terms of service",
    updated,
    sections: [
      { heading: "Who we are", body: [`${site.name} provides online courses ("modules") for building software with AI coding agents. By creating an account or buying access you agree to these terms.`] },
      { heading: "Your account", body: ["Keep your sign-in method secure. You're responsible for activity on your account. One person per account; team access is sold through access codes."] },
      {
        heading: "What you get",
        body: [
          "Free modules are available to everyone. Paid access is a one-time purchase that unlocks the projects you bought, including future updates to them, for as long as the service runs.",
          "Modules marked \"Releasing soon\" are included in a project purchase when they're published. We don't promise publication dates.",
        ],
      },
      { heading: "Your work", body: ["Code you write, your build journal and your proof pages are yours. You give us permission to host and display what you choose to make public. You can make entries private or unpublish proof pages at any time."] },
      { heading: "Third-party tools", body: ["The course uses third-party tools such as Claude Code, Codex, GitHub and hosting providers. Their terms and prices apply to your use of them, and you pay for them separately."] },
      { heading: "Acceptable use", body: ["Don't share paid content or access codes outside your team, scrape the site, attack the service, or use the tutor to produce harmful content. We may suspend accounts that do."] },
      { heading: "No job guarantee", body: ["We don't promise employment, interviews or salary outcomes. Verification badges confirm specific technical checks only, on the date shown."] },
      { heading: "Liability", body: ["The service is provided as is. To the extent the law allows, our total liability is limited to the amount you paid us in the 12 months before the claim."] },
      { heading: "Changes and contact", body: [`We'll post changes here and email you about material ones. Questions: ${site.supportEmail}.`] },
    ],
  },
  privacy: {
    title: "Privacy policy",
    updated,
    sections: [
      { heading: "What we collect", body: ["Account details (email, name, GitHub username and avatar if you sign in with GitHub), your onboarding answers, progress, decisions, notes you choose to save with us, tutor messages, proof pack content, and purchase records (we never see full card numbers; the payment provider handles them)."] },
      { heading: "Why", body: ["To run the course, save your progress, answer tutor questions, verify and publish your proof pages, process payments and send receipts, and improve the modules."] },
      { heading: "Cookies and analytics", body: ["Essential cookies keep you signed in and remember your cookie choice. Analytics (PostHog) only loads if you accept analytics cookies. We also count a few anonymous funnel events on our own servers without cookies, such as page views and sign-ups."] },
      { heading: "Processors", body: ["Supabase (database and sign-in), Razorpay (payments), Resend (email), Anthropic (tutor and draft generation), Upstash (rate limiting), Vercel (hosting), Sentry (error reports) and PostHog (analytics, only with consent)."] },
      { heading: "AI features", body: ["When you use the tutor or generate a case study, the relevant module content and what you typed or pasted are sent to Anthropic to produce a reply. Don't paste secrets such as API keys."] },
      { heading: "Public content", body: ["Only decisions you mark public and proof pages you publish are visible to others. You can change this at any time."] },
      { heading: "Your rights", body: [`You can access, correct, export or delete your data. Email ${site.supportEmail} and we'll respond within 30 days. We keep purchase records as long as tax law requires.`] },
      { heading: "Retention", body: ["We keep your data while your account is active. Tutor message logs are kept for 12 months for cost and quality review."] },
    ],
  },
  refunds: {
    title: "Refund policy",
    updated,
    sections: [
      {
        heading: "The policy",
        body: [
          `You can get a full refund within ${pricingConfig.refund.days} days of purchase if you've completed less than ${pricingConfig.refund.maxCompletionPercent}% of the project you bought (for an all-projects purchase: less than ${pricingConfig.refund.maxCompletionPercent}% of any one project).`,
        ],
      },
      { heading: "How to ask", body: [`Reply to your receipt email or write to ${site.supportEmail} with your payment ID. Refunds go back to the original payment method, usually within 5–7 working days, depending on your bank.`] },
      { heading: "What happens to access", body: ["Access to the refunded project ends when the refund is processed. Your build journal and any free-module progress stay in your account."] },
      { heading: "Pro + Review", body: ["The review component can't be refunded once a review has been delivered. The rest follows the policy above."] },
    ],
  },
};
