import type { Metadata, Viewport } from "next"

import { MetaPixel } from "@/components/analytics/meta-pixel"
import { Toaster } from "@/components/ui/toaster"
import { SITE } from "@/config/site"
import { THEME_INIT_SCRIPT } from "@/lib/theme"
import { fontMono, fontSans } from "./fonts"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: "%s · LaunchPad",
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script edits <html> classes before hydration; that difference is expected.
    <html
      lang="en-IN"
      className={`${fontSans.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-(--z-toast)"
        >
          Skip to main content
        </a>
        {children}
        <Toaster />
        <MetaPixel />
      </body>
    </html>
  )
}
