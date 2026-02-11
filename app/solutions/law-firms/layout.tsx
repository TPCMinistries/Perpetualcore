import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Law Firms - Perpetual Core",
  description:
    "Accelerate legal research, contract review, and client communication with AI. Purpose-built for solo practitioners and mid-size law firms.",
  openGraph: {
    title: "AI for Law Firms | Perpetual Core",
    description: "Accelerate legal research, contract review, and client communication.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
