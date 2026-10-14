import type { Roadmap } from "./schema";

/**
 * Computes the desktop map: a vertical spine of section blocks, topics branching left and right,
 * grouped topics in taped notes, and a "why next" phrase between consecutive sections.
 * Pure and deterministic, so the server computes it once and the client only paints.
 */

export const LAYOUT = {
  width: 1180,
  centerX: 590,
  mainW: 280,
  mainH: 50,
  row: 54,
  nodeW: 240,
  nodeH: 42,
  gap: 90,
  groupW: 330,
  whyH: 86,
  sectionGap: 22,
  top: 30,
} as const;

export interface MainBox {
  sectionId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minimum: boolean;
  index: number;
}
export interface NodeBox {
  topicId: string;
  sectionId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface GroupBox {
  sectionId: string;
  title: string;
  lines: string[];
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface WhyBox {
  sectionId: string;
  text: string;
  y: number;
}
export interface Edge {
  sectionId: string;
  d: string;
}

export interface MapLayout {
  width: number;
  height: number;
  spine: { x: number; y1: number; y2: number };
  mains: MainBox[];
  nodes: NodeBox[];
  groups: GroupBox[];
  whys: WhyBox[];
  edges: Edge[];
}

type Item = Roadmap["sections"][number]["left"][number];

function itemHeight(it: Item): number {
  const L = LAYOUT;
  if (typeof it === "string") return L.row;
  const rows = it.topics.length > 2 ? Math.ceil(it.topics.length / 2) : 1;
  return 60 + it.lines.length * 20 + rows * 56 + 18;
}

function curve(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

export function layoutRoadmap(roadmap: Roadmap): MapLayout {
  const L = LAYOUT;
  const leftEdge = L.centerX - L.mainW / 2;
  const rightEdge = L.centerX + L.mainW / 2;
  const mains: MainBox[] = [];
  const nodes: NodeBox[] = [];
  const groups: GroupBox[] = [];
  const whys: WhyBox[] = [];
  const edges: Edge[] = [];
  let y = L.top;

  roadmap.sections.forEach((s, index) => {
    if (s.why && index > 0) {
      whys.push({ sectionId: s.id, text: s.why, y });
      y += L.whyH;
    }
    const hl = s.left.reduce((n, it) => n + itemHeight(it), 0);
    const hr = s.right.reduce((n, it) => n + itemHeight(it), 0);
    const block = Math.max(hl, hr, L.mainH + 10);
    const my = y + block / 2 - L.mainH / 2;
    mains.push({
      sectionId: s.id,
      title: s.title,
      x: leftEdge,
      y: my,
      w: L.mainW,
      h: L.mainH,
      minimum: s.minimum,
      index,
    });

    for (const [side, items, total] of [
      ["L", s.left, hl],
      ["R", s.right, hr],
    ] as const) {
      let cy = y + (block - total) / 2;
      const fromX = side === "L" ? leftEdge : rightEdge;
      for (const it of items) {
        const h = itemHeight(it);
        if (typeof it === "string") {
          const x = side === "L" ? leftEdge - L.gap - L.nodeW : rightEdge + L.gap;
          nodes.push({ topicId: it, sectionId: s.id, x, y: cy, w: L.nodeW, h: L.nodeH });
          edges.push({
            sectionId: s.id,
            d: curve(fromX, my + L.mainH / 2, side === "L" ? x + L.nodeW : x, cy + L.nodeH / 2),
          });
        } else {
          const gx = side === "L" ? leftEdge - L.gap - L.groupW : rightEdge + L.gap;
          const gh = h - 14;
          groups.push({
            sectionId: s.id,
            title: it.group,
            lines: it.lines,
            x: gx,
            y: cy,
            w: L.groupW,
            h: gh,
          });
          const base = cy + 48 + it.lines.length * 20;
          const single = it.topics.length === 1;
          const subW = single ? L.groupW - 32 : (L.groupW - 32 - 14) / 2;
          it.topics.forEach((id, k) => {
            nodes.push({
              topicId: id,
              sectionId: s.id,
              x: gx + 16 + (single ? 0 : (k % 2) * (subW + 14)),
              y: base + (single ? 0 : Math.floor(k / 2) * 56),
              w: subW,
              h: L.nodeH,
            });
          });
          edges.push({
            sectionId: s.id,
            d: curve(fromX, my + L.mainH / 2, side === "L" ? gx + L.groupW : gx, cy + gh / 2),
          });
        }
        cy += h;
      }
    }
    y += block + L.sectionGap;
  });

  const last = mains[mains.length - 1];
  return {
    width: L.width,
    height: Math.round(y + 20),
    spine: { x: L.centerX, y1: L.top - 10, y2: last.y + last.h / 2 },
    mains,
    nodes,
    groups,
    whys,
    edges,
  };
}
