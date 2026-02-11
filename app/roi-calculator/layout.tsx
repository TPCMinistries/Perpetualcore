import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ROI Calculator - Measure Your AI Savings",
  description:
    "Calculate how much time and money your business can save with Perpetual Core. Estimate ROI based on team size, current tools, and workflow complexity.",
  openGraph: {
    title: "ROI Calculator | Perpetual Core",
    description:
      "See exactly how much time and money AI automation can save your business.",
  },
};

export default function ROICalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
