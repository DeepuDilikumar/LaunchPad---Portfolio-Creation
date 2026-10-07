import Link from "next/link";
import { Accordion } from "@/components/ui/accordion";
import { pricingConfig } from "@/config/pricing";

export const faqItems = [
  {
    q: "Do I need to know how to code?",
    a: "You should be comfortable reading code. The agent writes most of it; you review, test, and decide. Foundations covers the rest.",
  },
  {
    q: "Claude Code or Codex?",
    a: "Either. Every prompt has both versions. You'll need your own subscription or API access for the tool you pick.",
  },
  {
    q: "What will running the projects cost?",
    a: (
      <>
        Hosting and databases mostly fit in free tiers (Vercel, Supabase, Cloudflare R2, Upstash). The real cost is your agent.
        With a subscription plan you pay a flat monthly fee and work within its usage limits. With pay-as-you-go API access, cost
        depends on how long your sessions run, and the hard modules use more. Check current prices on the{" "}
        <a href="https://claude.com/pricing" target="_blank" rel="noreferrer noopener">
          Claude pricing page
        </a>{" "}
        and the{" "}
        <a href="https://openai.com/chatgpt/pricing" target="_blank" rel="noreferrer noopener">
          ChatGPT pricing page
        </a>
        . Every module flags the expensive steps.
      </>
    ),
    text: "Mostly free tiers for hosting and databases. Agent usage is the main cost; see each tool's pricing page.",
  },
  {
    q: "Is this vibe coding?",
    a: "You'll move fast with agents, but every module ends in tests, measurements, and decisions you can defend. That's the difference.",
  },
  {
    q: "Will this get me a job?",
    a: "No course can promise that. You'll leave with deployed systems, numbers, a decision record, and practice explaining them, which is what interviewers probe.",
  },
  {
    q: "How is this different from free courses?",
    a: "Free courses teach the tool. This walks you through building and defending six production systems, and gives you public proof.",
  },
  { q: "Refunds?", a: pricingConfig.refund.faq },
  {
    q: "Teams and colleges?",
    a: (
      <>
        We offer bulk access codes for teams and colleges. <Link href="/contact">Tell us what you need</Link>.
      </>
    ),
    text: "We offer bulk access codes for teams and colleges.",
  },
];

export function Faq() {
  return <Accordion items={faqItems.map(({ q, a }) => ({ q, a }))} />;
}
