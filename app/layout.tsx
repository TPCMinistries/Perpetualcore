import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo/structured-data";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { CrispChat } from "@/components/landing/CrispChat";
import { ExitIntent } from "@/components/landing/ExitIntent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

// Display serif — used only for hero h1s and rare editorial moments.
// One distinctive voice in an otherwise sans-corporate page.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.com"),
  title: {
    default: "Perpetual Core — An AI-first studio",
    template: "%s | Perpetual Core",
  },
  description: "We install operating systems for mission-driven organizations. Engagements start at $75,000. Production AI under PEPFAR rules, IRB review, and GDPR-equivalent consent.",
  keywords: [
    "AI implementation studio",
    "AI operating system",
    "mission-driven AI",
    "nonprofit AI implementation",
    "AI for healthcare",
    "AI for foundations",
    "Perpetual Engine",
    "AI engagement studio",
  ],
  authors: [{ name: "Perpetual Core" }],
  creator: "Perpetual Core",
  publisher: "Perpetual Core",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Perpetual Core",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Perpetual Core",
    title: "Perpetual Core — An AI-first studio",
    description: "We install operating systems for mission-driven organizations. Engagements start at $75,000.",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Perpetual Core — An AI-first studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Perpetual Core — An AI-first studio",
    description: "We install operating systems for mission-driven organizations. Engagements start at $75,000.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable}`}>
      <head>
        <JsonLd id="ld-org" data={organizationSchema()} />
        <JsonLd id="ld-website" data={websiteSchema()} />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </QueryProvider>
        <CookieConsent />
        <CrispChat />
        <ExitIntent />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
