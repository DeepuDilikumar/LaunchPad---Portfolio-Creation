import { Fragment } from "react"

import { PLACEHOLDER, type ResumeDocument } from "@/lib/resume/document"

/** Highlights [placeholders] so students fill them in or delete them. */
export function WithPlaceholders({ text }: { text: string }) {
  const parts = text.split(new RegExp(`(${PLACEHOLDER.source})`, "g"))
  return (
    <>
      {parts.map((part, i) =>
        new RegExp(`^${PLACEHOLDER.source}$`).test(part) ? (
          <mark key={i} className="rounded bg-warning-bg px-0.5 text-warning">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  )
}

function Heading({ children }: { children: string }) {
  return <h3 className="mt-4 border-b border-border pb-0.5 text-[0.75rem] font-medium tracking-[0.08em] uppercase">{children}</h3>
}

/** On-screen version of the ATS PDF: single column, standard headings. */
export function ResumePreview({ doc }: { doc: ResumeDocument }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 text-[0.8125rem] leading-snug text-[#111] shadow-e1">
      <p className="text-lg font-medium">{doc.name || "Your name"}</p>
      {doc.headline ? <p>{doc.headline}</p> : null}
      <p className="text-[#444] [overflow-wrap:anywhere]">{doc.contact.join(" | ")}</p>
      {doc.education.length ? (
        <>
          <Heading>Education</Heading>
          {doc.education.map((e, i) => (
            <div key={i} className="mt-1">
              <p className="flex justify-between gap-2 font-medium">
                <span>{e.institution}</span>
                <span className="font-normal">{e.period}</span>
              </p>
              {e.detail ? <p className="text-[#444]">{e.detail}</p> : null}
            </div>
          ))}
        </>
      ) : null}
      {doc.skills.length ? (
        <>
          <Heading>Skills</Heading>
          {doc.skills.map((s) => (
            <p key={s.label} className="mt-0.5">
              <span className="font-medium">{s.label}:</span> {s.items}
            </p>
          ))}
        </>
      ) : null}
      {doc.projects.length ? (
        <>
          <Heading>Projects</Heading>
          {doc.projects.map((p, i) => (
            <div key={i} className="mt-1.5">
              <p>
                <span className="font-medium">{p.title}</span>
                {p.tech ? <span className="text-[#444]"> | {p.tech}</span> : null}
              </p>
              <ul className="list-disc pl-4">
                {p.bullets.map((b, j) => (
                  <li key={j}>
                    <WithPlaceholders text={b} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      ) : null}
      {doc.experience.length ? (
        <>
          <Heading>Experience</Heading>
          {doc.experience.map((x, i) => (
            <div key={i} className="mt-1.5">
              <p className="flex justify-between gap-2">
                <span>
                  <span className="font-medium">{x.role}</span>
                  {x.company ? `, ${x.company}` : ""}
                </span>
                <span>{x.period}</span>
              </p>
              <ul className="list-disc pl-4">
                {x.bullets.map((b, j) => (
                  <li key={j}>
                    <WithPlaceholders text={b} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      ) : null}
    </div>
  )
}
