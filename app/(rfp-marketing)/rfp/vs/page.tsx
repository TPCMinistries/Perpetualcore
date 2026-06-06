import type { Metadata } from "next";
import { VsContent } from "./VsContent";

export const metadata: Metadata = {
  title: "vs alternatives",
  description:
    "Honest comparison: RFP Engine vs Instrumentl, Grants.gov, OpenGrants, Submittable, ChatGPT direct, and capture consultants. Including where we fall short.",
  alternates: {
    canonical: "https://rfp.perpetualcore.com/rfp/vs",
  },
  openGraph: {
    url: "https://rfp.perpetualcore.com/rfp/vs",
    title: "vs alternatives — RFP Engine | Perpetual Core",
    description:
      "Side-by-side comparison with Instrumentl, Grants.gov, OpenGrants, Submittable, direct AI, and capture consultants. Including where we lose.",
  },
};

export default function Page() {
  return <VsContent />;
}
