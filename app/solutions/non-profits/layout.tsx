import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Non-Profits - Perpetual Core",
  description:
    "Maximize impact with AI-powered grant writing, donor communication, volunteer management, and impact reporting for nonprofit organizations.",
  openGraph: {
    title: "AI for Non-Profits | Perpetual Core",
    description: "AI-powered grant writing, donor management, and impact reporting.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
