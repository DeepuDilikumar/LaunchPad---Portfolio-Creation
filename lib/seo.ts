import type { Metadata } from "next";
import { site } from "@/config/site";

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}

export function ogImageUrl(params: { title: string; kicker?: string; note?: string }): string {
  const q = new URLSearchParams({ title: params.title });
  if (params.kicker) q.set("kicker", params.kicker);
  if (params.note) q.set("note", params.note);
  return `/og?${q.toString()}`;
}

/** Every page gets a canonical URL, a matching og:url and its own preview image. */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  og?: { title?: string; kicker?: string; note?: string; image?: string };
  noindex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(input.path);
  const image =
    input.og?.image ??
    ogImageUrl({
      title: input.og?.title ?? input.title,
      kicker: input.og?.kicker,
      note: input.og?.note,
    });
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? "website",
      url,
      siteName: site.name,
      title: input.title,
      description: input.description,
      locale: site.locale,
      images: [{ url: image, width: 1200, height: 630, alt: input.og?.title ?? input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
    robots: input.noindex ? { index: false, follow: false } : undefined,
  };
}
