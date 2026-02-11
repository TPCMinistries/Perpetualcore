import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for IT Services & MSPs - Perpetual Core",
  description:
    "Automate ticket triage, documentation, and client reporting with AI. Built for managed service providers and IT consulting firms.",
  openGraph: {
    title: "AI for IT Services | Perpetual Core",
    description: "Automate ticket triage, documentation, and client reporting with AI.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
