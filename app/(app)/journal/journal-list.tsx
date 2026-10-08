"use client";

import Link from "next/link";
import { useState } from "react";
import { AccentAvatar } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

interface Entry {
  id: string;
  project: string;
  projectName: string;
  accent: string;
  moduleTitle: string;
  question: string;
  href: string;
  text: string;
  isPublic: boolean;
  updatedAt: string;
}

export function JournalList({ entries, projects }: { entries: Entry[]; projects: { slug: string; name: string }[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [vis, setVis] = useState<"all" | "public" | "private">("all");
  const [state, setState] = useState(() => Object.fromEntries(entries.map((e) => [e.id, e.isPublic])));
  const toast = useToast();

  const shown = entries.filter((e) => (filter === "all" || e.project === filter) && (vis === "all" || (vis === "public" ? state[e.id] : !state[e.id])));

  const toggle = async (id: string) => {
    const next = !state[id];
    setState((s) => ({ ...s, [id]: next }));
    const res = await fetch("/api/decisions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, isPublic: next }) });
    if (!res.ok) {
      setState((s) => ({ ...s, [id]: !next }));
      toast("That didn't save. Try again.", "failed");
    } else toast(next ? "Public on your profile" : "Private");
  };

  const chip = (active: boolean) => cn("h-8 rounded-full px-3 text-[13px] font-medium transition-colors", active ? "bg-surface-3 text-text-1" : "bg-surface-1 text-text-2 hover:text-text-1");

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by project">
        <button type="button" className={chip(filter === "all")} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>
          All projects
        </button>
        {projects.map((p) => (
          <button key={p.slug} type="button" className={chip(filter === p.slug)} aria-pressed={filter === p.slug} onClick={() => setFilter(p.slug)}>
            {p.name}
          </button>
        ))}
        <span className="mx-1 w-px bg-line" aria-hidden />
        {(["all", "public", "private"] as const).map((v) => (
          <button key={v} type="button" className={chip(vis === v)} aria-pressed={vis === v} onClick={() => setVis(v)}>
            {v === "all" ? "Any visibility" : v === "public" ? "Public" : "Private"}
          </button>
        ))}
      </div>
      <ul className="mt-6 space-y-3">
        {shown.map((e) => (
          <li key={e.id} className="rounded-[20px] border border-line bg-surface-1 p-4 md:p-5" data-journal-entry>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AccentAvatar color={e.accent} label={e.projectName} size={22} />
                <span className="t-small text-text-2">
                  {e.projectName} · {e.moduleTitle}
                </span>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 t-small text-text-2">
                <input type="checkbox" className="accent-white" checked={!!state[e.id]} onChange={() => void toggle(e.id)} />
                Public<span className="sr-only">: {e.projectName}, {e.moduleTitle}</span>
              </label>
            </div>
            {e.question ? <p className="mt-3 t-small text-text-2">{e.question}</p> : null}
            <p className="mt-1.5 whitespace-pre-wrap t-body text-text-1">{e.text}</p>
            <div className="mt-3 flex items-center justify-between">
              <time className="text-[12px] text-text-3" dateTime={e.updatedAt}>
                {new Date(e.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </time>
              <Link href={e.href} className="t-small text-text-2 underline decoration-line-strong underline-offset-4 hover:text-text-1">
                Open in module
              </Link>
            </div>
          </li>
        ))}
        {shown.length === 0 ? <li className="t-small text-text-2">No entries match these filters.</li> : null}
      </ul>
    </div>
  );
}
