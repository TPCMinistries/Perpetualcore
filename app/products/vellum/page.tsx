/**
 * /products/vellum — Vellum by Perpetual Core: institutional memory.
 * Free trial / $299 Operator / $1,500 Team / Institution. 30% mission discount.
 * Visual register matches homepage v6. EarlyAccessForm preserved.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { EarlyAccessForm } from "@/components/vellum/EarlyAccessForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { productSchema, breadcrumbSchema } from "@/lib/seo/structured-data";
import { PC_PRODUCTS } from "@/lib/seo/products";

export const metadata = {
  title: "Vellum by Perpetual Core — institutional memory",
  description:
    "Institutional memory for organizations. Calls, docs, voice notes, channels — one queryable mind. Free trial / $299 Operator / $1,500 Team / Institution. 30% mission-driven discount for verified 501(c)(3)s.",
};

const PRICING_TIERS = [
  {
    name: "Trial",
    price: "$0",
    cadence: null,
    body: "1 user, 100 sources, basic synthesis. The on-ramp — bring a small corpus, see if Vellum thinks the way your team thinks before you connect the real institution.",
    discountEligible: false,
  },
  {
    name: "Operator",
    price: "$299",
    cadence: "/month",
    body: "1 user, unlimited sources, voice + channels, 30-day retention. The single-operator tier — built for the founder, ED, or program lead who carries the org's memory.",
    discountEligible: true,
    featured: true,
  },
  {
    name: "Team",
    price: "$1,500",
    cadence: "/month",
    body: "Up to 10 users, core integrations, 1-year retention, and onboarding. The team tier — shared memory across an executive or program team without turning knowledge work into another unpaid admin job.",
    discountEligible: true,
  },
  {
    name: "Institution",
    price: "Contact",
    cadence: null,
    body: "25+ users, SSO, custom retention, on-prem option. For institutions whose data can't leave their own infrastructure or whose compliance team needs every retention parameter on the table.",
    discountEligible: false,
  },
];

const FEATURES = [
  { name: "Every source, one mind", body: "Calls, board docs, Slack channels, voice memos, Google Drive, transcripts. Vellum reads them, indexes them, and answers across them — not from one of them." },
  { name: "Synthesis, not search", body: "Most knowledge tools surface a list of links. Vellum reads the full corpus and writes the answer with citations to the source documents. The answer is the deliverable." },
  { name: "Voice in. Voice out.", body: "Walk-and-talk briefings. Phone-call transcripts that flow back in as queryable memory. The voice channel isn't an afterthought — it's a first-class input and output." },
  { name: "Retention you control", body: "30-day, 1-year, or custom retention windows depending on tier. Operator-grade memory without the audit risk of forever-storage. Per-source overrides on Institution." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function VellumPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          productSchema(PC_PRODUCTS.vellum),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Products", path: "/products" },
            { name: "Vellum", path: "/products/vellum" },
          ]),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-status-invite" />
            <p className="eyebrow !text-foreground/70">§ 02 · Products · Vellum by Perpetual Core</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Institutional memory for{" "}
            <span className="italic text-foreground/85">organizations.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              For executive directors, founders, and program directors whose calls, docs, voice
              notes, and Slack channels need to be one queryable mind — not seventeen disconnected
              sources.
            </p>
            <p>
              <span className="text-foreground font-medium">30% mission-driven discount</span>{" "}
              on Operator and Team for verified 501(c)(3)s.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="#early-access">Reserve early access <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="#pricing" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              See pricing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Vellum */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="Why Vellum" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-10">
                Most organizations lose more knowledge to attrition than to any other failure mode.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  When an ED leaves, a program director rolls off, or a founder steps back from
                  operations, the institution loses something it never wrote down. Vellum captures
                  that working memory in real time — calls, voice notes, decisions, drafts, channels
                  — and renders it queryable as one mind.
                </p>
                <p>
                  Vellum is not consumer note-taking dressed up in a pricing page. It is
                  institutional memory: the layer that sits underneath an organization&apos;s
                  operating cadence and answers questions that would otherwise require pulling
                  someone off their work.
                </p>
                <p>
                  Inside the Perpetual Engine, Vellum operates on the Knowledge registry — one of
                  the eight registries the studio installs in every engagement. Vellum is the
                  surface most teams encounter first, because Knowledge is the registry where ROI
                  shows up fastest.
                </p>
                <p className="text-foreground font-medium">The synthesis is the deliverable.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="What Vellum does" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Four surfaces — every one of them in production.
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {FEATURES.map((f, i) => (
              <div key={f.name} className={`p-6 sm:p-7 flex flex-col ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} border-border`}>
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                  0{i + 1}
                </span>
                <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-4">
                  {f.name}.
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="Pricing" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Trial / $299 / $1,500 / Contact.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                30% mission-driven discount on Operator and Team for verified 501(c)(3)s. Applied
                at checkout after verification. Negotiated on Institution.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {PRICING_TIERS.map((tier, i) => (
              <div key={tier.name} className={`p-6 sm:p-7 flex flex-col ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} border-border`}>
                <div className="flex items-center justify-between mb-10">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    0{i + 1}
                  </span>
                  {tier.featured && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      Most common
                    </span>
                  )}
                </div>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {tier.name}
                </h4>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-semibold tracking-[-0.025em] text-foreground">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-sm text-muted-foreground font-mono">{tier.cadence}</span>
                  )}
                </div>
                {tier.discountEligible && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-4">
                    30% off for 501(c)(3)s
                  </p>
                )}
                <p className="text-sm text-muted-foreground leading-[1.65] mb-6 flex-1">
                  {tier.body}
                </p>
                <Link
                  href="#early-access"
                  className="inline-flex items-center text-xs font-medium text-foreground hover:text-primary transition-colors mt-auto"
                >
                  Reserve <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>

          {/* IHA callout */}
          <div className="border border-t-0 border-border bg-card p-6 sm:p-8 grid sm:grid-cols-[200px_1fr] gap-6 items-baseline">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              10% to IHA
            </p>
            <p className="text-sm text-muted-foreground leading-[1.7]">
              <span className="text-foreground font-medium">
                10% of every Vellum subscription funds the{" "}
                <a href="https://theiha.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
                  Institute for Human Advancement
                </a>
                .
              </span>{" "}
              Vellum sits at the base 10% line — Sage, the personal product, sits at the elevated
              15% rate. Both follow the{" "}
              <Link href="/engine/spec" className="underline underline-offset-4 hover:text-primary">
                Engine spec
              </Link>{" "}
              giving floor.
            </p>
          </div>
        </div>
      </section>

      {/* Early access form */}
      <section id="early-access" className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="04" label="Early access" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Reserve a tier. We&apos;ll reach out when invitations open.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Vellum by Perpetual Core is in early access. Pick the tier you&apos;d use. For
                Operator and Team we capture a payment method via Stripe so you&apos;re ready when
                invitations open.{" "}
                <span className="text-foreground font-medium">No charge today.</span>
              </p>
              <EarlyAccessForm />
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe or install */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Subscribe or install" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Vellum is the surface most teams meet first.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                If your organization wants the full eight-registry Engine installed — not just the
                Knowledge surface — that&apos;s an engagement. Knowledge installs start around $75,000. Vellum
                subscribers who outgrow the SaaS tier get an introduction to the studio process;
                we don&apos;t double-charge for what you&apos;ve already paid for.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/studio/engagements">See engagements <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
                <Link href="/engine" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  Read the Engine <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
