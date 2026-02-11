import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Plans for Every Team Size",
  description:
    "Choose the right Perpetual Core plan. Free tier included. Starter, Pro, Team, Business, and Enterprise plans with AI chat, document processing, integrations, and more.",
  openGraph: {
    title: "Pricing | Perpetual Core",
    description:
      "Transparent pricing for AI-powered business operations. Free tier included. Scale from solopreneur to enterprise.",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
