import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Real Estate - Perpetual Core",
  description:
    "Automate lead follow-up, listing descriptions, market analysis, and client communication with AI built for real estate professionals.",
  openGraph: {
    title: "AI for Real Estate | Perpetual Core",
    description: "AI-powered lead follow-up, listings, and market analysis for agents.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
