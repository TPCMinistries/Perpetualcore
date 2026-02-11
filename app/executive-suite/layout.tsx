import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Executive Suite - AI Intelligence for Leadership",
  description:
    "Perpetual Core's Executive Suite gives leaders AI-powered briefings, strategic insights, competitive intelligence, and decision-support tools to stay ahead.",
  openGraph: {
    title: "Executive Suite | Perpetual Core",
    description:
      "AI-powered briefings, strategic insights, and decision-support tools for business leaders.",
  },
};

export default function ExecutiveSuiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
