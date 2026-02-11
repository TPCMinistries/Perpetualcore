import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developers - API, SDK & Integration Docs",
  description:
    "Build on Perpetual Core with our REST API, webhooks, and SDK. Create custom integrations, AI agents, and automated workflows for your applications.",
  openGraph: {
    title: "Developer Portal | Perpetual Core",
    description:
      "REST API, webhooks, and SDK for building custom AI integrations and automated workflows.",
  },
};

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
