import type { Metadata } from "next";
import { TrustContent } from "./TrustContent";

export const metadata: Metadata = {
  title: "Trust & security",
  description:
    "RFP Engine security posture: per-tenant encryption, RLS-isolated Postgres, zero-retention inference, audit-grade activity logs, SOC 2 in progress. Built for federal scrutiny, open to your auditors.",
  alternates: {
    canonical: "https://rfp.perpetualcore.com/rfp/trust",
  },
  openGraph: {
    url: "https://rfp.perpetualcore.com/rfp/trust",
    title: "Trust & security — RFP Engine | Perpetual Core",
    description:
      "Per-tenant keys. RLS-enforced isolation. Append-only audit log. SOC 2 in audit window. What we hold today and what we don't.",
  },
};

export default function Page() {
  return <TrustContent />;
}
