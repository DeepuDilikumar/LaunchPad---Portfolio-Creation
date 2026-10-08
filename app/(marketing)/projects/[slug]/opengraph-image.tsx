import { ogImage, ogSize } from "@/lib/og";
import { catalog, getProject } from "@/content/catalog";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Project syllabus";

export function generateStaticParams() {
  return catalog.map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getProject(slug)!;
  return ogImage({ eyebrow: p.kind === "track" ? "Track 0 · free" : `Project ${p.number}`, accent: p.accent, title: `${p.name}: ${p.title}`, subtitle: p.tagline, chips: p.hardParts.slice(0, 3) });
}
