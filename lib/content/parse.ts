/**
 * Pure MDX parsing helpers (no filesystem), shared by the content loader, the
 * content check script and unit tests.
 */
import matter from "gray-matter";
import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { CELL_KINDS, frontmatterSchema, type CellKind, type CellMeta, type Frontmatter } from "./schema";

interface JsxAttr {
  type: string;
  name?: string;
  value?: unknown;
}

interface MdNode {
  type: string;
  name?: string | null;
  attributes?: JsxAttr[];
  children?: MdNode[];
  position?: { start: { offset?: number }; end: { offset?: number } };
}

const processor = createProcessor({ remarkPlugins: [remarkGfm] });

function attr(node: MdNode, name: string): string | true | undefined {
  const a = node.attributes?.find((x) => x.type === "mdxJsxAttribute" && x.name === name);
  if (!a) return undefined;
  if (a.value === null || a.value === undefined) return true;
  if (typeof a.value === "string") return a.value;
  return undefined;
}

function isCell(name: string | null | undefined): name is CellKind {
  return !!name && (CELL_KINDS as readonly string[]).includes(name);
}

function labelFor(kind: CellKind, node: MdNode, source: string): string {
  const pick = (n: string) => {
    const v = attr(node, n);
    return typeof v === "string" ? v : undefined;
  };
  switch (kind) {
    case "Checkpoint":
      return `Checkpoint: ${pick("pass") ?? pick("cmd") ?? ""}`.trim();
    case "Decision":
      return `Decision: ${pick("question") ?? ""}`.trim();
    case "Pitfall":
      return `Pitfall: ${pick("title") ?? ""}`.trim();
    case "Interview":
      return `Interview: ${pick("q") ?? ""}`.trim();
    case "Prompt":
      return `Prompt (${pick("mode") ?? "build"})`;
    default: {
      const text = source.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return `${kind}: ${text.slice(0, 60)}${text.length > 60 ? "…" : ""}`;
    }
  }
}

export interface ParsedModule {
  frontmatter: Frontmatter;
  body: string;
  cells: CellMeta[];
}

export function parseFrontmatter(raw: string): { data: unknown; body: string } {
  const { data, content } = matter(raw);
  return { data, body: content };
}

/** Extract top-level cells with stable ids. Cells without an `id` get `<kind>-<index>`. */
export function extractCells(body: string): CellMeta[] {
  const tree = processor.parse(body) as unknown as MdNode;
  const cells: CellMeta[] = [];
  let index = 0;
  for (const node of tree.children ?? []) {
    if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && isCell(node.name)) {
      const kind = node.name;
      const explicit = attr(node, "id");
      const id = typeof explicit === "string" ? explicit : `${kind.toLowerCase()}-${index}`;
      const start = node.position?.start.offset ?? 0;
      const end = node.position?.end.offset ?? start;
      const source = body.slice(start, end);
      cells.push({
        id,
        kind,
        index,
        required: kind === "Checkpoint" ? attr(node, "required") === true || attr(node, "required") === "true" : kind === "Decision",
        source,
        label: labelFor(kind, node, source),
      });
      index++;
    }
  }
  return cells;
}

export function parseModule(raw: string, file = "module"): ParsedModule {
  const { data, body } = parseFrontmatter(raw);
  const fm = frontmatterSchema.safeParse(data);
  if (!fm.success) {
    throw new Error(`${file}: invalid frontmatter: ${fm.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
  }
  const cells = extractCells(body);
  const seen = new Set<string>();
  for (const c of cells) {
    if (seen.has(c.id)) throw new Error(`${file}: duplicate cell id "${c.id}"`);
    seen.add(c.id);
  }
  return { frontmatter: fm.data, body, cells };
}

/** Source for the logged-out/unpaid teaser: everything up to and including the first Explain cell. */
export function teaserSource(body: string, cells: CellMeta[]): string {
  const first = cells.find((c) => c.kind === "Explain");
  if (!first) return "";
  if (first.index !== 0) return ""; // never risk sending cells that come before the teaser
  const at = body.indexOf(first.source);
  if (at < 0) return "";
  return body.slice(0, at + first.source.length);
}

/** Rewrite cells so every top-level cell carries its computed id (as `id`) and `cellIndex`. */
export function remarkCellIds() {
  return (tree: MdNode) => {
    let index = 0;
    for (const node of tree.children ?? []) {
      if ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && isCell(node.name)) {
        node.attributes = node.attributes ?? [];
        const hasId = node.attributes.some((a) => a.type === "mdxJsxAttribute" && a.name === "id");
        if (!hasId) node.attributes.push({ type: "mdxJsxAttribute", name: "id", value: `${node.name.toLowerCase()}-${index}` });
        node.attributes.push({ type: "mdxJsxAttribute", name: "cellIndex", value: String(index) });
        index++;
      }
    }
  };
}
