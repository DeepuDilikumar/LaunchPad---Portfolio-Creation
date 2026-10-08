import type { ReactNode } from "react";

/**
 * Renders the small markdown subset learners write (## headings, paragraphs, - lists,
 * **bold**) as React elements. User text is never injected as HTML.
 */
function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
}

export function SafeMarkdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>);
      para = [];
    }
    if (list.length) {
      blocks.push(
        <ul key={blocks.length}>
          {list.map((l, i) => (
            <li key={i}>{inline(l)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  for (const raw of source.split("\n")) {
    const line = raw.trimEnd();
    if (/^#{1,3}\s/.test(line)) {
      flush();
      blocks.push(<h3 key={blocks.length}>{line.replace(/^#{1,3}\s/, "")}</h3>);
    } else if (/^\s*[-*]\s/.test(line)) {
      if (para.length) flush();
      list.push(line.replace(/^\s*[-*]\s/, ""));
    } else if (!line.trim()) flush();
    else {
      if (list.length) flush();
      para.push(line.trim());
    }
  }
  flush();
  return <div className="prose-bp t-body">{blocks}</div>;
}
