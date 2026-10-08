import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/dashboard", "/journal", "/settings", "/proof/", "/checkout", "/onboarding", "/styleguide"] }],
    sitemap: `${site.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
