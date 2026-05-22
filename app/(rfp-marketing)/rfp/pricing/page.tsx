import type { Metadata } from "next";
import { PricingContent } from "./PricingContent";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Transparent pricing for RFP Engine. Starter at $299, Pro at $799, Agency at $2,499. 14-day free trial, no card. Optional win-fee. 25% nonprofit discount.",
  alternates: {
    canonical: "https://rfp.perpetualcore.com/rfp/pricing",
  },
  openGraph: {
    url: "https://rfp.perpetualcore.com/rfp/pricing",
    title: "Pricing — RFP Engine | Perpetual Core",
    description:
      "Starter $299. Pro $799. Agency $2,499. 14-day free trial. Optional win-fee on awards over $250K.",
  },
};

export default function Page() {
  return <PricingContent />;
}
