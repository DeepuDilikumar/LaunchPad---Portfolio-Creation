import { GeistSans } from "geist/font/sans"
import localFont from "next/font/local"

/** Geist Sans: preloaded, it renders the hero headline (the LCP element). */
export const fontSans = GeistSans

/**
 * Geist Mono: used for scores, prices and code, none of which are critical above the fold.
 * Not preloaded, so it doesn't compete with the sans font on slow mobile networks.
 */
export const fontMono = localFont({
  src: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
})
