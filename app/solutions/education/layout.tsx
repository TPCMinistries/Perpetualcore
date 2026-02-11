import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Education - Perpetual Core",
  description:
    "Personalize learning, automate grading, and streamline administration with AI. Built for schools, universities, and training organizations.",
  openGraph: {
    title: "AI for Education | Perpetual Core",
    description: "Personalize learning and streamline academic administration with AI.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
