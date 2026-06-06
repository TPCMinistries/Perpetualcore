import type { Metadata } from "next";
import { RoiContent } from "./RoiContent";

export const metadata: Metadata = {
  title: "ROI calculator",
  description:
    "Interactive ROI calculator for RFP Engine. Move four sliders — proposals per year, hours per proposal, hourly rate, expected time reduction — and see your annual savings against the Pro subscription. No email gate.",
  alternates: {
    canonical: "https://rfp.perpetualcore.com/rfp/roi",
  },
  openGraph: {
    url: "https://rfp.perpetualcore.com/rfp/roi",
    title: "ROI calculator — RFP Engine | Perpetual Core",
    description:
      "What's a 60% time cut worth to your team? Calculate annual hours and dollars saved against the Pro tier. The result is yours to keep — no email required.",
  },
};

export default function Page() {
  return <RoiContent />;
}
