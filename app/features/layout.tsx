import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features - AI Operating System for Business",
  description:
    "Explore Perpetual Core's AI-powered features: intelligent chat, document processing, email automation, CRM, voice memos, workflow agents, and 30+ integrations.",
  openGraph: {
    title: "Features | Perpetual Core",
    description:
      "AI-powered chat, document processing, email automation, CRM, voice memos, and workflow agents — all in one platform.",
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
