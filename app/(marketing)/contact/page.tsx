import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Teams and colleges",
  description: "Bulk access codes for engineering teams and colleges.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  return (
    <div className="container-bp grid gap-12 pb-24 pt-32 md:grid-cols-[1fr_440px] md:pt-40">
      <div>
        <h1 className="t-hero text-text-1">{topic === "review" ? "Apply for Pro + Review" : "Teams and colleges"}</h1>
        <p className="mt-5 max-w-[520px] t-body text-text-2">
          {topic === "review"
            ? "Review seats are limited each month because a working engineer reviews every project. Tell us a little about yourself and which project you'll start with."
            : "We give teams and colleges bulk access codes. Each learner redeems a code to unlock the projects, and their progress and proof pages stay their own."}
        </p>
        <ul className="mt-8 space-y-3 t-body text-text-2">
          <li>· One code per cohort or team, with a seat limit and an expiry date</li>
          <li>· Learners keep their build journal and proof pages after the course</li>
          <li>· Invoices with GST for Indian organisations</li>
        </ul>
      </div>
      <ContactForm initialKind={topic === "review" ? "review" : "team"} />
    </div>
  );
}
