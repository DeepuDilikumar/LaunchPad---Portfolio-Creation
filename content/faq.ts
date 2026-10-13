import { site } from "@/config/site";

const refund = `Email ${site.support.email} within ${site.refund.days} days of your first purchase and you get a full refund. No forms.`;

export const homeFaq = [
  {
    q: "Is this for freshers?",
    a: "No. It’s for engineers with real projects to talk about. The follow-ups probe decisions you made at work.",
  },
  {
    q: "How do I get the PDF?",
    a: `By email, as a download link, within minutes of paying. Your copy is stamped with your email.`,
  },
  {
    q: "Are these leaked company questions?",
    a: "No. They come from public interview write-ups and real work experience, rewritten from scratch.",
  },
  { q: "What if it doesn’t help?", a: refund },
];

export const productFaq = [
  {
    q: "Is it tied to one language or framework?",
    a: "No. The questions test decisions and failure reasoning, which carry across Java, Go, Node and Python.",
  },
  {
    q: "Does it include model answers?",
    a: "Yes: a strong answer in a few moves for every question, plus an answer skeleton to adapt to your own projects, not to memorise.",
  },
  {
    q: "How do I get it?",
    a: `A download link lands in your email within minutes of paying. Both editions, stamped with your email. The link works for ${site.delivery.linkHours} hours and ${site.delivery.maxDownloads} downloads, and you can ask for a fresh one any time.`,
  },
  {
    q: "Do I get updates?",
    a: `Yes. Free updates for ${site.delivery.updatesMonths} months, sent by email. Every change is listed on the public changelog.`,
  },
  { q: "What if it doesn’t help?", a: refund },
];

export const allFaq = [
  ...homeFaq,
  ...productFaq.filter((f) => !homeFaq.some((h) => h.q === f.q)),
  {
    q: "Is the price going to change?",
    a: `The price on the page is the price you pay, GST included. A launch price, when there is one, shows its end date and ends on that date.`,
  },
  {
    q: "Can I pay with UPI?",
    a: "Yes. Checkout is handled by Razorpay: UPI, cards and netbanking all work.",
  },
  {
    q: "I didn’t get the email.",
    a: `Check spam first. Then open the thank-you page from your payment confirmation and ask for a fresh link, or email ${site.support.email}.`,
  },
  {
    q: "Can I share my copy?",
    a: "Please don’t. Each copy is stamped with the buyer’s email and order ID. Updates go only to buyers.",
  },
];
