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
import { ServiceWorkerReset } from "@/components/system/ServiceWorkerReset";

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
    default: "Perpetual Core — AI systems that work as one company",
    template: "%s | Perpetual Core",
  },
  description: "Perpetual Core is an operator-built AI systems company: a governed intelligence platform, a marketplace of specialized products and capabilities, and a studio that installs them into real organizations.",
  keywords: [
    "AI venture studio",
    "AI implementation studio",
    "AI-native venture studio",
    "Perpetual Engine",
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
    title: "Perpetual Core — AI systems that work as one company",
    description: "Governed company context, specialized AI systems, and human-approved workflows. Start with one capability and expand into a company-wide operating system.",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Perpetual Core — governed intelligence and specialized AI systems for companies",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Perpetual Core — AI systems that work as one company",
    description: "A governed intelligence platform, capability marketplace, and implementation studio.",
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
        <link
          rel="alternate"
          type="application/rss+xml"
          title="Perpetual Core — Notes"
          href="/blog/rss.xml"
        />
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
        <ServiceWorkerReset />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
