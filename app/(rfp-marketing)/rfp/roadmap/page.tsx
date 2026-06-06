import type { Metadata } from "next";
import { RoadmapContent } from "./RoadmapContent";

export const metadata: Metadata = {
  title: "Public roadmap",
  description:
    "What's live, what's in private beta, and what's next this quarter on RFP Engine. Updated weekly. Federal buyers ask — we publish.",
  alternates: {
    canonical: "https://rfp.perpetualcore.com/rfp/roadmap",
  },
  openGraph: {
    url: "https://rfp.perpetualcore.com/rfp/roadmap",
    title: "Public roadmap — RFP Engine | Perpetual Core",
    description:
      "Honest staging: Live now / In private beta / Next this quarter. No breathless promises.",
  },
};

export default function Page() {
  return <RoadmapContent />;
}
