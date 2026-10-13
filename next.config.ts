import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  // Content files are read at build time by server components and API routes.
  outputFileTracingIncludes: {
    "/api/**": ["./content/**/*", "./config/**/*"],
    "/og": ["./node_modules/@fontsource/*/files/*-latin-*-normal.woff"],
    "/og/**": ["./node_modules/@fontsource/*/files/*-latin-*-normal.woff"],
  },
  async redirects() {
    // 301s for moved URLs live here, never as client-side stubs.
    return [
      { source: "/guide/:slug", destination: "/guides/:slug", permanent: true },
      { source: "/readiness-check", destination: "/check", permanent: true },
    ];
  },
};

export default nextConfig;
