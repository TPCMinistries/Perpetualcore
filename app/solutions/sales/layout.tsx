import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Sales Teams - Perpetual Core",
  description:
    "Close more deals with AI-powered lead scoring, email sequences, meeting prep, and pipeline analytics. Built for sales teams that want to sell, not do admin.",
  openGraph: {
    title: "AI for Sales Teams | Perpetual Core",
    description: "AI-powered lead scoring, email sequences, and pipeline analytics.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
