import type { LoadedQuestion } from "@/lib/content/load";

const typeLabel: Record<string, string> = {
  technical: "technical",
  failure: "failure",
  tradeoff: "tradeoff",
  ownership: "ownership",
  measurement: "measure",
};

export interface QuestionPageProps {
  q: LoadedQuestion;
  guideTitle: string;
  version: string;
  edition?: "a4" | "phone" | "web";
  /** Footer text, e.g. the stamp placeholder on the site. */
  footer?: string;
  showDraftMark?: boolean;
  /** Roadmap topics this question tests; links open the basics in a new tab. Web only. */
  concepts?: { title: string; href: string }[];
}

/**
 * The single question layout. The PDF build renders this same component to static HTML,
 * so the sample on the product page is exactly what's in the PDF.
 */
export function QuestionPage({
  q,
  guideTitle,
  version,
  edition = "web",
  footer,
  showDraftMark,
  concepts,
}: QuestionPageProps) {
  return (
    <article className={edition === "phone" ? "qp qp--phone" : "qp"} data-question={q.id}>
      <div className="qp-meta">
        <span>
          {guideTitle} · Module {String(q.moduleNumber).padStart(2, "0")} · {q.moduleTitle}
        </span>
        <span>{q.label}</span>
      </div>
      {showDraftMark && !q.reviewed ? (
        <span className="qp-draft">DRAFT · NOT YET REVIEWED</span>
      ) : null}
      <h3 className="qp-title">{q.title}</h3>
      <div className="qp-tests">
        <span className="qp-label">What it tests · </span>
        {q.intent}
      </div>
      {concepts?.length ? (
        <div className="qp-concepts">
          <span className="qp-label">Concepts ↗</span>
          {concepts.map((c) => (
            <a key={c.href} href={c.href} target="_blank" rel="noopener" className="qp-concept">
              {c.title}
            </a>
          ))}
          <span className="qp-hand qp-concepts-note">opens the basics in a new tab</span>
        </div>
      ) : null}

      {q.flow ? (
        <div className="qp-flow" aria-label="Diagram">
          {q.flow.note ? <span className="qp-hand">{q.flow.note}</span> : null}
          <div className="qp-flow-row">
            {q.flow.nodes.map((n, i) => (
              <span key={n.label} className="qp-flow-row">
                <span className={n.bad ? "qp-node qp-node--bad" : "qp-node"}>{n.label}</span>
                {i < q.flow!.nodes.length - 1 ? (
                  <span className="qp-arrow" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="qp-weak">
        <div className="qp-weak-row">
          <span className="qp-label">Usual answer</span>
          <span className="qp-strike">“{q.weak_answer}”</span>
          {q.red_note ? <span className="qp-hand">{q.red_note}</span> : null}
        </div>
        <p className="qp-why">{q.why_it_fails}</p>
      </div>

      <div className="qp-ladder">
        <span className="qp-label">Follow-up ladder</span>
        {q.follow_ups.map((f) => (
          <div key={f.question} className="qp-rung">
            <span className={`qp-tag qp-tag--${f.type}`}>{typeLabel[f.type]}</span>
            <div className="qp-rung-body">
              <span className="qp-rung-q">{f.question}</span>
              <span className="qp-rung-tests">Tests: {f.what_it_tests}</span>
              <ul className="qp-points">
                {f.strong_points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="qp-strong">
        <span className="qp-label">Strong answer, in {q.answer_framework.length} moves</span>
        {q.answer_framework.map((m, i) => (
          <div key={m} className="qp-move">
            <span className="qp-move-n">{i + 1}</span>
            <span>{m}</span>
          </div>
        ))}
      </div>

      <div>
        <span className="qp-label">Answer skeleton · adapt it to your own project</span>
        <p className="qp-model">{q.model_answer}</p>
      </div>

      <div className="qp-signals">
        <span className="qp-label">Rejection signals</span>
        <ul>
          {q.rejection_signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="qp-check">
        <span className="qp-label">Self-check</span>
        <ul>
          {q.self_check.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      {footer !== undefined ? (
        <div className="qp-foot">
          <span>{footer}</span>
          <span>v{version}</span>
        </div>
      ) : null}
    </article>
  );
}
