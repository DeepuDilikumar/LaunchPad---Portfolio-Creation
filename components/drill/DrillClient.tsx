"use client";

import { useState } from "react";

interface Result {
  score: number;
  feedback: string;
  signalsHit: string[];
  strong: { moves: string[]; model: string };
}

type Line = { who: "interviewer" | "you"; text: string; tag?: string };

export function DrillLogin() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <form
      className="card-ink flex flex-col gap-3 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await fetch("/api/drill/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = (await res.json()) as { message?: string; error?: string };
        setMsg(data.message ?? data.error ?? "Done.");
      }}
    >
      <label htmlFor="drill-email" className="font-semibold">
        The email you bought the guide with
      </label>
      <div className="flex flex-wrap gap-2.5">
        <input
          id="drill-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-ink bg-card min-h-12 flex-[1_1_220px] rounded-[10px] border-[1.5px] px-3.5"
        />
        <button type="submit" className="keycap !min-h-12 !text-base">
          Email me a login link
        </button>
      </div>
      {msg ? (
        <p role="status" className="m-0 text-sm">
          {msg}
        </p>
      ) : null}
    </form>
  );
}

export function DrillClient({
  questions,
}: {
  questions: { id: string; label: string; title: string; module: string }[];
}) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [rated, setRated] = useState(false);

  async function start(id: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/drill/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: id }),
    });
    const data = (await res.json()) as { sessionId?: string; question?: string; error?: string };
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Couldn't start.");
    setSessionId(data.sessionId!);
    setLines([{ who: "interviewer", text: data.question! }]);
    setResult(null);
    setRated(false);
  }

  async function send() {
    if (!sessionId) return;
    setBusy(true);
    setError(null);
    const mine = answer.trim();
    setLines((l) => [...l, { who: "you", text: mine }]);
    setAnswer("");
    const res = await fetch("/api/drill/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, answer: mine }),
    });
    const data = (await res.json()) as {
      done?: boolean;
      question?: string;
      type?: string;
      error?: string;
    } & Partial<Result>;
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLines((l) => l.slice(0, -1));
      setAnswer(mine);
      return;
    }
    if (data.done) setResult(data as Result);
    else setLines((l) => [...l, { who: "interviewer", text: data.question!, tag: data.type }]);
  }

  if (!sessionId) {
    return (
      <div className="flex flex-col gap-3">
        {error ? (
          <p role="alert" className="text-red-dark m-0">
            {error}
          </p>
        ) : null}
        <span className="label">// pick a question</span>
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {questions.map((q) => (
            <li key={q.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => start(q.id)}
                className="border-chip bg-card hover:border-blue flex min-h-12 w-full cursor-pointer flex-col gap-1 rounded-[10px] border-[1.5px] px-4 py-3 text-left"
              >
                <span className="text-muted font-mono text-[11px]">
                  {q.label} · {q.module}
                </span>
                <span className="font-semibold">{q.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="border-ink bg-term flex flex-col gap-3 rounded-2xl border-[1.5px] p-5 font-mono text-sm leading-relaxed text-[#EDE7D6]"
        aria-live="polite"
      >
        {lines.map((l, i) => (
          <p key={i} className="m-0 whitespace-pre-wrap">
            <span className={l.who === "interviewer" ? "text-[#9DB3FF]" : "text-[#8FD19E]"}>
              {l.who === "interviewer" ? "interviewer >" : "you >"}
            </span>{" "}
            {l.tag && l.tag !== "none" ? <span className="text-[#E8B93C]">[{l.tag}] </span> : null}
            {l.text}
          </p>
        ))}
        {busy ? <p className="m-0 text-[#A39A88]">interviewer is thinking…</p> : null}
      </div>
      {error ? (
        <p role="alert" className="text-red-dark m-0">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-4">
          <div className="card-ink flex flex-col gap-2 p-5">
            <span className="text-muted font-mono text-xs font-semibold">SCORE</span>
            <span className="h-display text-5xl">{result.score}/10</span>
            <p className="m-0">{result.feedback}</p>
            {result.signalsHit.length ? (
              <p className="text-red-dark m-0 text-sm">
                Watch out for: {result.signalsHit.join("; ")}
              </p>
            ) : null}
          </div>
          <div className="border-green bg-green-wash flex flex-col gap-2 rounded-[10px] border-[1.5px] p-5">
            <span className="text-green-dark font-mono text-[11px] font-semibold">
              STRONG ANSWER
            </span>
            {result.strong.moves.map((m, i) => (
              <span key={m}>
                {i + 1}. {m}
              </span>
            ))}
            <p className="text-ink-2 m-0 mt-2 text-sm">{result.strong.model}</p>
          </div>
          {!rated ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">How useful was this drill?</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="border-ink bg-card min-h-11 min-w-11 rounded-lg border-[1.5px]"
                  onClick={async () => {
                    await fetch("/api/drill/rate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sessionId, rating: n }),
                    });
                    setRated(true);
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <p className="m-0 text-sm">Thanks, noted.</p>
          )}
          <button
            type="button"
            className="keycap-ghost self-start"
            onClick={() => setSessionId(null)}
          >
            Drill another question
          </button>
        </div>
      ) : (
        <form
          className="flex flex-col gap-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <label htmlFor="drill-answer" className="font-semibold">
            Your answer (say it out loud first, then type the gist)
          </label>
          <textarea
            id="drill-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="border-ink bg-card min-h-32 rounded-[10px] border-[1.5px] p-3 text-base"
            maxLength={4000}
          />
          <button
            type="submit"
            className="keycap self-start"
            disabled={busy || answer.trim().length < 3}
          >
            Send answer
          </button>
        </form>
      )}
    </div>
  );
}
