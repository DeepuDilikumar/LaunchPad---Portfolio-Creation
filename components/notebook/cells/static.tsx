/**
 * Server-rendered cells and MDX element overrides.
 */
import type { ReactNode } from "react";
import { isValidElement } from "react";
import { highlight } from "@/lib/shiki";
import { CellFrame } from "./frame";
import { IconCoin, IconMic, IconShield } from "@/components/ui/icons";
import { CopyButton } from "@/components/ui/copy-button";

export function Explain({ id, children }: { id: string; children: ReactNode }) {
  return (
    <CellFrame id={id} kind="explain">
      <div className="prose-bp t-body">{children}</div>
    </CellFrame>
  );
}

const expectLabels = {
  terminal: "What you should see in the terminal",
  tree: "The file tree you should end up with",
  screenshot: "What you should see",
  diff: "The change you should see",
} as const;

export function Expect({
  id,
  kind = "terminal",
  example,
  caption,
  children,
}: {
  id: string;
  kind?: keyof typeof expectLabels;
  /** Output that was not captured from a real run: labelled "Example output". */
  example?: boolean;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <CellFrame id={id} kind="expect">
      <figure className="theme-dark overflow-hidden rounded-[16px] border border-line bg-bg">
        <figcaption className="flex min-h-9 items-center justify-between gap-3 border-b border-line px-4 t-small text-text-2">
          <span>{example ? "Example output · yours will differ in the details" : expectLabels[kind]}</span>
          {kind === "terminal" ? <span aria-hidden className="font-mono text-[11px] text-text-3">❯_</span> : null}
        </figcaption>
        <div className="expect-body [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:px-4 [&_pre]:py-3.5">{children}</div>
        {caption ? <p className="border-t border-line px-4 py-2.5 t-small text-text-2">{caption}</p> : null}
      </figure>
    </CellFrame>
  );
}

const calloutIcons = { interview: IconMic, cost: IconCoin, security: IconShield } as const;
const calloutTitles = { interview: "Interview angle", cost: "Cost", security: "Security" } as const;

export function Callout({ id, kind = "interview", children }: { id: string; kind?: keyof typeof calloutIcons; children: ReactNode }) {
  const Icon = calloutIcons[kind];
  return (
    <CellFrame id={id} kind="callout">
      <div role="note" className="flex gap-3 rounded-[16px] border border-line bg-surface-1 px-4 py-3.5" aria-label={calloutTitles[kind]}>
        <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-text-1">
          <Icon size={14} />
        </span>
        <div>
          <p className="t-small font-medium text-text-1">{calloutTitles[kind]}</p>
          <div className="prose-bp t-small mt-0.5 [&_p]:text-[13px] [&_p]:leading-[20px]">{children}</div>
        </div>
      </div>
    </CellFrame>
  );
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/** MDX `pre` override: highlight fenced code with Shiki on the server. */
export async function Pre({ children }: { children?: ReactNode }) {
  let lang = "text";
  let code = textOf(children);
  if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
    const cls = children.props.className ?? "";
    lang = cls.match(/language-([\w-]+)/)?.[1] ?? "text";
    code = textOf(children.props.children);
  }
  code = code.replace(/\n$/, "");
  const html = await highlight(code, lang);
  return (
    <div className="code-block theme-dark group relative rounded-[14px] border border-line bg-bg [.expect-body_&]:rounded-none [.expect-body_&]:border-0">
      <div className="[&_pre]:overflow-x-auto [&_pre]:px-4 [&_pre]:py-3.5" dangerouslySetInnerHTML={{ __html: html }} />
      {lang === "bash" || lang === "sh" ? (
        <CopyButton text={code.replace(/^\$ /gm, "")} className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100" />
      ) : null}
    </div>
  );
}

export const mdxElements = {
  pre: Pre,
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    /^https?:/.test(p.href ?? "") ? <a {...p} target="_blank" rel="noreferrer noopener" /> : <a {...p} />,
};
