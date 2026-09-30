import localFont from "next/font/local"

/**
 * Google Sans Flex (UI + headings) and Google Sans Code (scores, prices, code).
 * Both are SIL Open Font License fonts from Google Fonts, self-hosted (Latin subset)
 * so there is no third-party request and no layout shift. Licences sit next to the files.
 */
export const fontSans = localFont({
  src: "./fonts/GoogleSansFlex-latin.woff2",
  variable: "--font-google-sans",
  weight: "400 700",
  display: "swap",
  preload: true,
  fallback: ["Roboto", "Segoe UI", "system-ui", "sans-serif"],
})

/** Not preloaded: nothing above the fold depends on it. */
export const fontMono = localFont({
  src: "./fonts/GoogleSansCode-latin.woff2",
  variable: "--font-google-sans-code",
  weight: "400 600",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
})
