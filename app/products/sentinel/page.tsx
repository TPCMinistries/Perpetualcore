/**
 * /products/sentinel — Sentinel due-diligence + intel landing.
 * Visual register matches homepage v6. Hands off to live subdomain
 * sentinel.perpetualcore.com. Cross-link to Sentinel on Retainer.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { PC_PRODUCTS } from "@/lib/seo/products";

export const metadata = {
  title: "Sentinel — Perpetual Core",
  description:
    "Due diligence and intel for the people Kroll won't take calls from. Live at sentinel.perpetualcore.com. Pay-per-vet, or hire as a $5K/mo retainer.",
};

const CAPABILITIES = [
  {
    name: "Open-source intelligence, structured.",
    body: "Public records, court filings, sanctions lists, news, and the long tail of social and forum surface. Pulled, deduped, and rendered as a coherent timeline — not a search results page.",
  },
  {
    name: "Adverse-media synthesis.",
    body: "Read across thousands of sources for a single subject in minutes. The synthesis surfaces the disqualifying detail before you draft the engagement letter.",
  },
  {
    name: "Reports your client can read.",
    body: "Defensible, citation-anchored reports — not a wall of links. Use them in deal memos, board packets, or your own write-up. The work product is the deliverable.",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function SentinelPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          productSchema(PC_PRODUCTS.sentinel),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: "Sentinel", path: "/products/sentinel" },
          ]),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-status-live animate-pulse-dot" />
            <p className="eyebrow !text-foreground/70">§ 02 · Products · Sentinel — Live</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Due diligence for the people{" "}
            <span className="italic text-foreground/85">Kroll won&apos;t take calls from.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              For attorneys, investigators, journalists, and operators running pre-deal or pre-hire
              diligence on subjects the legacy CRAs decline to touch.
            </p>
            <p>
              Production-grade. The first product we shipped from an engagement and kept running —
              and the proof point is the live URL.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <a href="https://sentinel.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                Run a vet at sentinel.perpetualcore.com <ArrowUpRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Link
              href="/studio/retainers"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Or hire as a retainer <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* What Sentinel does */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="What Sentinel does" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Three things, in production, on every vet.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {CAPABILITIES.map((c, i) => (
                <div
                  key={c.name}
                  className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-x-6 sm:gap-x-10 py-7 border-b border-border"
                >
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold tracking-[-0.01em] text-foreground mb-3">
                      {c.name}
                    </h4>
                    <p className="text-base text-muted-foreground leading-[1.7]">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Two ways to use Sentinel — pay-per-vet vs retainer */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="Two ways to use it" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Run vets one at a time. Or put Sentinel on retainer.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl grid sm:grid-cols-2 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
              <a
                href="https://sentinel.perpetualcore.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                  Self-serve
                </p>
                <p className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-2">
                  Run a single vet
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65] mb-6 flex-1">
                  Open the live site, paste in the subject, get the report. Pay per vet at the
                  going rate on sentinel.perpetualcore.com.
                </p>
                <span className="inline-flex items-center text-xs font-medium text-foreground group-hover:text-primary transition-colors mt-auto">
                  Open Sentinel <ArrowUpRight className="ml-1 h-3 w-3" />
                </span>
              </a>

              <Link
                href="/studio/retainers"
                className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                  Retainer
                </p>
                <p className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-2">
                  Sentinel on Retainer — $5K/mo
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65] mb-6 flex-1">
                  Unlimited vets per month, 48-hour SLA, production Sentinel run for one
                  organization on a monthly subscription. For teams running ongoing DD volume.
                </p>
                <span className="inline-flex items-center text-xs font-medium text-foreground group-hover:text-primary transition-colors mt-auto">
                  See Retainers <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="The proof is live" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Run a vet. The live site is the demo.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Most marketing pages describe what a product would do if it shipped. Sentinel
                ships. The studio installed it for a client. We kept it running. Open it and try
                it on a name you already know the answer to.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  size="lg"
                  asChild
                  className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <a href="https://sentinel.perpetualcore.com" target="_blank" rel="noopener noreferrer">
                    Run a vet <ArrowUpRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Link
                  href="/studio/engagements"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3"
                >
                  Install one inside your firm <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
