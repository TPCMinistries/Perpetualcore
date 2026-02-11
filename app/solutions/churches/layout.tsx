import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Churches & Ministries - Perpetual Core",
  description:
    "Streamline sermon prep, member communication, volunteer coordination, and event planning with AI built for faith-based organizations.",
  openGraph: {
    title: "AI for Churches | Perpetual Core",
    description: "AI-powered sermon prep, member care, and volunteer coordination.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
