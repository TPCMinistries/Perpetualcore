import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SkipLink } from "@/components/ui/accessibility";

export const metadata = {
  title: "Deployment evidence — Perpetual Core",
  description:
    "Inspectable deployment evidence from Perpetual Core systems, with the limits of each proof stated plainly.",
};

const EVIDENCE = [
  {
    index: "01",
    system: "RFP Engine",
    domain: "Opportunity intelligence",
    proof:
      "A production reconciliation fetched and upserted 1,972 opportunity records with zero processing errors. It also resolved 46 historical timeout-drift rows.",
    boundary:
      "This proves system operation and data reconciliation. It does not claim submissions, grants won, revenue, or customer ROI.",
    href: "https://rfp.perpetualcore.com",
  },
  {
    index: "02",
    system: "IHA Care",
    domain: "Care operations",
    proof:
      "A live synthetic-data environment supports bounded FQHC buyer evaluation of intake, coordination, and reporting workflows.",
    boundary:
      "This is not unrestricted PHI production and does not claim clinical, billing, or patient outcomes.",
    href: "https://care.theiha.org",
  },
  {
    index: "03",
    system: "Uplift Workforce",
    domain: "Program operations",
    proof:
      "A production platform supports active healthcare-training operations across applicant, program, and staff workflows.",
    boundary:
      "Placement, completion, service-volume, and efficiency totals are not included without separate verified receipts.",
    href: "https://workforce.upliftcommunities.com",
  },
] as const;

export default function DeploymentEvidencePage() {
  return (
    <div className="pc-v4 min-h-screen bg-[#050507] text-white">
      <SkipLink />
      <Navbar tone="dark" />
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pc-v4-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_84%_16%,rgba(109,91,255,0.24),transparent_34%),radial-gradient(circle_at_12%_4%,rgba(84,230,177,0.1),transparent_28%)]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#54e6b1]">
              Perpetual Core / proof register
            </p>
            <h1 className="mt-7 max-w-5xl text-[50px] font-semibold leading-[0.94] tracking-[-0.06em] sm:text-[72px] lg:text-[88px]">
              Ambition, with
              <span className="block text-white/42">receipts attached.</span>
            </h1>
            <p className="mt-8 max-w-3xl text-[17px] leading-8 text-white/64 sm:text-[20px]">
              We separate deployed software from business outcomes. Each record
              states what was observed, what it proves, and what it does not.
            </p>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#08080b] py-20 sm:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
            <div className="grid gap-px border border-white/10 bg-white/10">
              {EVIDENCE.map((item) => (
                <article
                  key={item.index}
                  className="grid gap-8 bg-[#0b0b0f] p-7 sm:p-10 lg:grid-cols-[120px_0.7fr_1.3fr]"
                >
                  <div>
                    <span className="font-mono text-[11px] text-[#54e6b1]">
                      {item.index}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/42">
                      {item.domain}
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em]">
                      {item.system}
                    </h2>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-white/72 transition hover:text-[#54e6b1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff]"
                      data-pc-event="product_live_surface_open"
                      data-product={item.system}
                      data-placement="deployment-evidence"
                    >
                      Inspect live surface
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                  <div className="space-y-5">
                    <div className="border border-white/10 bg-white/[0.025] p-5">
                      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#54e6b1]">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        Observed proof
                      </p>
                      <p className="mt-4 text-base leading-8 text-white/76">
                        {item.proof}
                      </p>
                    </div>
                    <div className="border border-white/10 p-5">
                      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#a79cff]">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        Evidence boundary
                      </p>
                      <p className="mt-4 text-sm leading-7 text-white/54">
                        {item.boundary}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-24 text-center sm:py-32">
          <div className="pc-v4-grid absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
            <h2 className="text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
              Define the next receipt.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/62">
              We scope the operating problem and the evidence required to know
              whether the first deployment deserves to expand.
            </p>
            <Link
              href="/contact-sales"
              className="mt-9 inline-flex min-h-12 items-center bg-white px-7 text-sm font-semibold uppercase tracking-[0.06em] text-black transition hover:bg-[#54e6b1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b7cff]"
              data-pc-event="case_study_contact"
              data-placement="deployment-evidence-closing"
            >
              Scope an evidence-backed deployment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer tone="dark" />
    </div>
  );
}
