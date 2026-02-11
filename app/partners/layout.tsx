import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Program - Grow with Perpetual Core",
  description:
    "Join the Perpetual Core partner program. Earn revenue by reselling, referring, or building integrations for the AI operating system trusted by businesses worldwide.",
  openGraph: {
    title: "Partner Program | Perpetual Core",
    description:
      "Earn revenue by reselling, referring, or building integrations for Perpetual Core.",
  },
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
