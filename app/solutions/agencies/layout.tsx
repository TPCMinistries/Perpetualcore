import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Marketing Agencies - Perpetual Core",
  description:
    "Scale content creation, client management, and campaign reporting with AI. Purpose-built for agencies managing multiple brands and accounts.",
  openGraph: {
    title: "AI for Agencies | Perpetual Core",
    description: "Scale content, client management, and reporting across all your accounts.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
