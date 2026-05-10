import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atlas Discovery — Perpetual Core",
  description:
    "A $5,000–$15,000 productized audit before any Atlas install. For fund Operating Partners and Ops leads diagnosing portcos.",
};

export default function AtlasDiscoveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
