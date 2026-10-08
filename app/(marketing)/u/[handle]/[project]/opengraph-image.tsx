import { ogImage, ogSize } from "@/lib/og";
import { getPublicPack } from "@/lib/public-profile";
import { getProject } from "@/content/catalog";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Project proof page";

export default async function Image({ params }: { params: Promise<{ handle: string; project: string }> }) {
  const { handle, project } = await params;
  const data = await getPublicPack(handle, project);
  const p = getProject(project);
  if (!data || !p || !data.profile.isPublic) return ogImage({ title: "Proof page" });
  const name = data.profile.name || `@${data.profile.handle}`;
  return ogImage({
    eyebrow: `${name} · ${data.pack.verified ? "Verified build" : "Proof page"}`,
    accent: p.accent,
    title: `${p.name}: ${p.title}`,
    chips: [...(data.pack.verified ? ["✓ Verified build"] : []), ...data.pack.metrics.slice(0, 3).map((m) => `${m.label}: ${m.value}`)],
  });
}
