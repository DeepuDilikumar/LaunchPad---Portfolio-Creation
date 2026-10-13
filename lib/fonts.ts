import localFont from "next/font/local";
// Latin-ext only (₹ and accented names). Latin itself comes from next/font below, preloaded with
// metric-matched fallbacks so text doesn't shift when the web fonts arrive.
import "@fontsource/bricolage-grotesque/latin-ext-800.css";
import "@fontsource/ibm-plex-sans/latin-ext-400.css";
import "@fontsource/ibm-plex-sans/latin-ext-600.css";

export const bricolage = localFont({
  variable: "--nf-head",
  display: "swap",
  src: [
    {
      path: "../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2",
      weight: "700",
    },
    {
      path: "../node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2",
      weight: "800",
    },
  ],
});

export const plexSans = localFont({
  variable: "--nf-sans",
  display: "swap",
  src: [
    {
      path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2",
      weight: "600",
    },
  ],
});

export const plexMono = localFont({
  variable: "--nf-mono",
  display: "swap",
  preload: false,
  src: [
    {
      path: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2",
      weight: "600",
    },
  ],
});

export const caveat = localFont({
  variable: "--nf-hand",
  display: "swap",
  preload: false,
  src: [
    {
      path: "../node_modules/@fontsource/caveat/files/caveat-latin-600-normal.woff2",
      weight: "600",
    },
  ],
});

export const fontVariables = [
  bricolage.variable,
  plexSans.variable,
  plexMono.variable,
  caveat.variable,
].join(" ");
