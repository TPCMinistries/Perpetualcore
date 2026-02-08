import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/lib/providers/query-provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://perpetualcore.ai"),
  title: {
    default: "Perpetual Core | AI-Powered Knowledge Platform",
    template: "%s | Perpetual Core",
  },
  description: "Transform how your team works with AI-powered knowledge management. Persistent memory, RAG search, AI agents, and multi-model intelligence in one unified platform.",
  keywords: [
    "AI knowledge management",
    "RAG search",
    "AI agents",
    "document AI",
    "enterprise AI",
    "team collaboration",
    "AI assistant",
    "knowledge base",
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
    title: "Perpetual Core | AI-Powered Knowledge Platform",
    description: "Transform how your team works with AI-powered knowledge management. Persistent memory, RAG search, AI agents, and multi-model intelligence.",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Perpetual Core - AI-Powered Knowledge Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Perpetual Core | AI-Powered Knowledge Platform",
    description: "Transform how your team works with AI-powered knowledge management. Persistent memory, RAG search, AI agents, and multi-model intelligence.",
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
    <html lang="en" suppressHydrationWarning>
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
