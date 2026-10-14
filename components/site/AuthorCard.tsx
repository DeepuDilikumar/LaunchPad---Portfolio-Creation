import Link from "next/link";
import { site } from "@/config/site";

const isUrl = (s: string) => /^https?:\/\//.test(s);

/** A taped note from the author. Brand-only mode hides the personal details. */
export function AuthorCard({ variant = "home" }: { variant?: "home" | "product" }) {
  const a = site.author;
  if (!a.named) {
    return (
      <div className="bg-note mx-auto max-w-[720px] rounded border border-[#E8DA9A] px-8 py-8 shadow-[0_14px_30px_rgba(60,48,20,0.12)]">
        <p className="text-ink-2 m-0 text-[17px] leading-relaxed">{a.bio[0]}</p>
      </div>
    );
  }
  return (
    <div
      className={`bg-note relative mx-auto flex max-w-[720px] flex-col gap-4 rounded border border-[#E8DA9A] px-6 pt-10 pb-8 shadow-[0_14px_30px_rgba(60,48,20,0.12)] sm:px-9 ${variant === "home" ? "-rotate-[0.8deg]" : "rotate-[0.6deg]"}`}
    >
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 -ml-[60px] h-[26px] w-[120px] rotate-2 border border-black/5 bg-white/65"
      />
      <div className="flex items-center gap-3.5">
        <span
          className="bg-ink font-head text-marker flex h-14 w-14 items-center justify-center rounded-full text-2xl font-extrabold"
          aria-hidden="true"
        >
          {a.name[0]}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="font-head text-[26px] font-extrabold tracking-tight">
            {variant === "home" ? `Hi, I’m ${a.name}.` : `Written by ${a.name}`}
          </span>
          <span className="text-muted font-mono text-xs">{a.role}</span>
        </div>
      </div>
      {a.bio.map((p) => (
        <p key={p} className="text-ink-2 m-0 text-[17px] leading-relaxed">
          {p}
        </p>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="hand text-blue text-3xl">— {a.name}</span>
        <span className="flex gap-4">
          <Link
            href="/about"
            className="inline-flex min-h-11 items-center font-semibold no-underline"
          >
            About me →
          </Link>
          {isUrl(a.linkedin) ? (
            <a
              href={a.linkedin}
              rel="me noopener"
              className="inline-flex min-h-11 items-center font-semibold no-underline"
            >
              LinkedIn →
            </a>
          ) : null}
        </span>
      </div>
    </div>
  );
}
