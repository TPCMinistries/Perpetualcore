import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Consultation - See Perpetual Core in Action",
  description:
    "Schedule a free consultation to see how Perpetual Core can transform your business operations with AI-powered automation, document processing, and intelligent workflows.",
  openGraph: {
    title: "Book a Consultation | Perpetual Core",
    description:
      "Schedule a free demo and see how AI can transform your business operations.",
  },
};

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
