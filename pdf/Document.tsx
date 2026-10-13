import { QuestionPage } from "../components/guide/QuestionPage";
import type { LoadedQuestion } from "../lib/content/load";
import type { GuideMeta } from "../lib/content/schema";

export type Edition = "a4" | "phone";

interface Props {
  meta: GuideMeta;
  questions: LoadedQuestion[];
  edition: Edition;
  brand: string;
  logoMark: string;
  author: string;
  supportEmail: string;
  siteUrl: string;
  drafts: boolean;
}

export function GuideDocument({
  meta,
  questions,
  edition,
  brand,
  logoMark,
  author,
  supportEmail,
  siteUrl,
  drafts,
}: Props) {
  const modules = meta.modules
    .map((m) => ({ ...m, questions: questions.filter((q) => q.module === m.slug) }))
    .filter((m) => m.questions.length > 0);
  const followUps = questions.reduce((n, q) => n + q.follow_ups.length, 0);

  return (
    <div className={`edition-${edition}`}>
      <section className="page cover" data-preview="cover">
        <div className="brand">
          <span className="brand-mark">{logoMark}</span>
          {brand}
        </div>
        <div>
          <h1>
            {meta.title.replace(/ Guide$/, "")} <span className="marker">Guide</span>
          </h1>
          <p>
            {questions.length} questions. Each one comes with the follow-ups that come next, what
            they test, and a strong answer you can adapt to your own work.
          </p>
          <div className="facts">
            <span className="chip">{modules.length} modules</span>
            <span className="chip">{followUps} follow-ups</span>
            <span className="chip">{edition === "a4" ? "A4 edition" : "phone edition"}</span>
            <span className="chip">v{meta.version}</span>
          </div>
        </div>
        <div>
          <span className="note">the second question decides the offer</span>
          <div className="mono">
            Written by {author} · {siteUrl.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </section>

      <section className="page prose" data-preview="how-to-use">
        <h2>How to use this guide</h2>
        <ol>
          <li>Read the question and answer it out loud, as you would in the room.</li>
          <li>Read the usual answer and why it fails. If yours looked like it, that is the gap.</li>
          <li>Work down the follow-up ladder. Answer each one before reading the strong points.</li>
          <li>Rebuild your answer with the strong-answer moves, using a project of your own.</li>
          <li>Tick the self-check. Come back to anything you could not tick in two days.</li>
        </ol>
        <p>
          The answer skeletons are there to adapt, not to memorise. Interviewers hear rehearsed
          scripts all day; what they remember is a real decision you made and what it cost.
        </p>
        <p>
          Found a mistake? Email {supportEmail}. Fixes ship as free updates for 12 months, and the
          errata list is public at {siteUrl.replace(/^https?:\/\//, "")}/changelog.
        </p>
      </section>

      <section className="page prose" data-preview="contents">
        <h2>Contents</h2>
        {modules.map((m) => (
          <div key={m.slug} className="toc-module">
            <h3>
              <span>{String(m.number).padStart(2, "0")}</span>
              {m.title}
            </h3>
            {m.questions.map((q) => (
              <div key={q.id} className="toc-row">
                <span className="mono">{q.label}</span>
                <span>{q.title}</span>
              </div>
            ))}
          </div>
        ))}
      </section>

      {modules.map((m) => (
        <div key={m.slug}>
          <section className="page module-divider" data-preview={`module-${m.number}`}>
            <span className="big">{String(m.number).padStart(2, "0")}</span>
            <h2>{m.title}</h2>
            <span className="mono">
              {m.questions.length} question{m.questions.length === 1 ? "" : "s"}
            </span>
          </section>
          {m.questions.map((q) => (
            <section key={q.id} className="page" data-preview={q.id}>
              <QuestionPage
                q={q}
                guideTitle={meta.title}
                version={meta.version}
                edition={edition}
                showDraftMark={drafts}
              />
            </section>
          ))}
        </div>
      ))}

      <section className="page prose" data-preview="closing">
        <h2>Before your interview</h2>
        <p>
          Pick the three modules closest to the role. Do their follow-up ladders out loud, once a
          day, until the interview.
        </p>
        <p>
          This copy is licensed to the buyer named in the footer. Please don&apos;t share it.
          Updates are free for 12 months and arrive by email.
        </p>
        <p className="mono">
          {brand} · v{meta.version} · {supportEmail}
        </p>
      </section>
    </div>
  );
}
