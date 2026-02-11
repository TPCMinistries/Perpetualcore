import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI for Financial Advisors - Perpetual Core",
  description:
    "Automate client reporting, compliance documentation, and portfolio insights with AI. Help financial advisors serve more clients with less overhead.",
  openGraph: {
    title: "AI for Financial Advisors | Perpetual Core",
    description: "Automate reporting, compliance docs, and portfolio insights with AI.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
