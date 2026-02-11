import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Consulting Firms - Perpetual Core",
  description:
    "Accelerate research, proposal writing, and client deliverables with AI. Help your consultants focus on strategy instead of admin work.",
  openGraph: {
    title: "AI for Consulting | Perpetual Core",
    description: "Accelerate research, proposals, and client deliverables with AI.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
