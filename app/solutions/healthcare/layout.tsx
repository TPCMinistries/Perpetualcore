import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Healthcare - Perpetual Core",
  description:
    "Streamline patient communication, clinical documentation, and care coordination with HIPAA-aware AI built for healthcare providers.",
  openGraph: {
    title: "AI for Healthcare | Perpetual Core",
    description: "HIPAA-aware AI for patient communication and clinical documentation.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
