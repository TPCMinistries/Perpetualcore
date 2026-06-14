import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Operating System Map - Download | Perpetual Core",
  description:
    "Download the AI Operating System Map for leaders who need to connect sales, operations, knowledge, customer communication, and executive visibility.",
  openGraph: {
    title: "AI Operating System Map | Perpetual Core",
    description:
      "A practical map for deciding where AI should enter the company first and how it expands into an operating system.",
  },
};

export default function LeadMagnetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
