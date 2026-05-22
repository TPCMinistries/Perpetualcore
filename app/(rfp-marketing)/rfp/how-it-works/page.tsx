import type { Metadata } from "next";
import { HowItWorksContent } from "./HowItWorksContent";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From solicitation drop to submission-ready PDF. Six agents — discovery, vault, draft, reviewer, compliance, submit — working a single file end-to-end while the last click stays human.",
  alternates: {
    canonical: "https://rfp.perpetualcore.com/rfp/how-it-works",
  },
  openGraph: {
    url: "https://rfp.perpetualcore.com/rfp/how-it-works",
    title: "How it works — RFP Engine | Perpetual Core",
    description:
      "Six agents. One workspace. Discovery every six hours. Vault-grounded drafts. Reviewer-checked. Compliance-gated. Submission stays human.",
  },
};

export default function Page() {
  return <HowItWorksContent />;
}
