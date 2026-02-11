import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Accountants & CPA Firms - Perpetual Core",
  description:
    "Automate tax prep, bookkeeping, and client communication with AI. Perpetual Core helps accounting firms save 8+ hours per CPA per week.",
  openGraph: {
    title: "AI for Accountants | Perpetual Core",
    description: "Save 8+ hours per CPA per week with AI-powered accounting workflows.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
