import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Readiness Quiz - How Ready Is Your Business?",
  description:
    "Take our free AI readiness assessment. Discover where your business stands on AI adoption and get a personalized roadmap for implementing AI-powered operations.",
  openGraph: {
    title: "AI Readiness Quiz | Perpetual Core",
    description:
      "Discover where your business stands on AI adoption and get a personalized implementation roadmap.",
  },
};

export default function AIReadinessQuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
