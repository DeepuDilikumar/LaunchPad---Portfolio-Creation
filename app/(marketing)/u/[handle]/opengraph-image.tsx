import { ogImage, ogSize } from "@/lib/og";
import { getPublicProfile } from "@/lib/public-profile";
import { getProject } from "@/content/catalog";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Build record";

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data || !data.profile.isPublic) return ogImage({ title: "Build record" });
  const name = data.profile.name || `@${data.profile.handle}`;
  return ogImage({
    eyebrow: "Build record",
    title: name,
    subtitle: data.profile.headline || `${data.packs.length} published projects`,
    chips: data.packs.map((p) => `${p.verified ? "✓ " : ""}${getProject(p.project)?.name ?? p.project}`),
  });
}
