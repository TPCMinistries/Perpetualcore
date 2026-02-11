import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Productivity Guide - Download Now",
  description:
    "Download our free guide to AI-powered productivity. Learn how to automate repetitive tasks, streamline communication, and make smarter decisions with AI.",
  openGraph: {
    title: "Free AI Productivity Guide | Perpetual Core",
    description:
      "Learn how to automate tasks, streamline communication, and boost productivity with AI.",
  },
};

export default function LeadMagnetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
