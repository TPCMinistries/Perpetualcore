/**
 * /packages — concrete first-purchase offers.
 *
 * This page is for buyers who understand the pricing architecture but need a
 * smaller, named way to begin. It keeps the main pricing page from anchoring
 * the whole studio too low while still giving small and mid-market buyers a
 * real door.
 */

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";
import { PackageCheckoutButton } from "@/components/packages/PackageCheckoutButton";

export const metadata = {
  title: "AI Operating System Packages — Perpetual Core",
  description:
    "Start with Perpetual Core through software access, guided setup, a first workflow package, or a managed 90-day AI operating lane.",
};

const SOFTWARE_COSTS = [
  {
    name: "Personal operator",
    price: "$149-$299/mo",
    body: "Sage or a narrow personal/product surface for one operator who wants to start using the Engine without an implementation scope.",
  },
  {
    name: "Focused product",
    price: "$299-$499/mo",
    body: "Vellum, Janice, RFP, or similar product access for one defined job: knowledge, people operations, capture, or diligence.",
  },
  {
    name: "Team surface",
    price: "$1.5K-$2.5K/mo",
    body: "Shared workspace, team memory, integrations, and onboarding for a small team that needs the product to become part of weekly operations.",
  },
];

const PACKAGES = [
  {
    index: "01",
    name: "Software Access",
    price: "$149-$499/mo",
    duration: "Start this week",
    bestFor: "One person or one product job",
    body: "For a buyer who wants to get into the ecosystem without implementation. They pick one product surface, connect a small amount of context, and learn by using it.",
    includes: [
      "One product surface",
      "Basic onboarding",
      "Email support",
      "Upgrade path into setup or lane",
    ],
    cta: "Buy Software Access",
    checkoutId: "software-access",
  },
  {
    index: "02",
    name: "Guided Setup",
    price: "$2.5K-$5K + software",
    duration: "7-10 business days",
    bestFor: "Small businesses and warm referrals",
    body: "For someone who wants help getting in but does not need a custom build yet. We configure the first product, import starter context, and set the operating rhythm.",
    includes: [
      "One intake call",
      "Product setup and context import",
      "One workflow template",
      "30-day check-in",
    ],
    cta: "Buy Guided Setup",
    checkoutId: "guided-setup",
    featured: true,
  },
  {
    index: "03",
    name: "First Workflow Package",
    price: "$7.5K-$15K",
    duration: "2-3 weeks",
    bestFor: "A company with one obvious pain",
    body: "For a buyer who has a real workflow problem but is not ready for a $30K+ sprint. We map the workflow, attach the right product, and ship the first working operating loop.",
    includes: [
      "Workflow map",
      "Product configuration",
      "Light automation or template build",
      "Success metric and next-step recommendation",
    ],
    cta: "Buy First Workflow",
    checkoutId: "first-workflow",
  },
  {
    index: "04",
    name: "90-Day Operating Lane",
    price: "$5K-$12K/mo",
    duration: "90-day starter",
    bestFor: "Businesses that want us in the loop",
    body: "For companies that need an AI operating partner, not just software. We run one named lane with them: capture, knowledge, people, diligence, or executive operations.",
    includes: [
      "Named operating lane",
      "Weekly operating rhythm",
      "Product plus workflow tuning",
      "Month-three expand, renew, or handoff decision",
    ],
    cta: "Place Lane Deposit",
    checkoutId: "operating-lane-deposit",
  },
];

const FIT_GUIDE = [
  {
    signal: "I want to start using one product surface.",
    answer: "Software Access",
  },
  {
    signal: "I want help getting the product configured correctly.",
    answer: "Guided Setup",
  },
  {
    signal: "I have one workflow costing time, revenue, or clarity.",
    answer: "First Workflow Package",
  },
  {
    signal: "I want Perpetual Core involved as an operating partner.",
    answer: "90-Day Operating Lane",
  },
];

const POST_PURCHASE_STEPS = [
  {
    title: "Stripe payment",
    body: "The buyer pays for software access, setup, a first workflow, or the lane deposit.",
  },
  {
    title: "Intake context",
    body: "They send company, workflow, data, and outcome context from the success page.",
  },
  {
    title: "Operating start",
    body: "We confirm the first operating lane, onboarding window, and next commercial step.",
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

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Packages", path: "/packages" },
        ])}
      />
      <Navbar />

      <section className="container mx-auto px-6 sm:px-8 py-16 sm:py-24">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <span aria-hidden className="block h-1.5 w-1.5 bg-primary" />
            <p className="eyebrow !text-foreground/70">Starter packages · Software + setup · First workflow</p>
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.045em] leading-[0.98] text-foreground mb-8">
            Start with the right AI operating layer.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.6] mb-10 max-w-3xl">
            Perpetual Core helps companies install practical AI across knowledge, sales,
            operations, proposals, and executive work. Begin with software, setup, one
            workflow, or a managed operating lane.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-primary text-primary-foreground hover:bg-primary/90 rounded-[6px]">
              <Link href="/contact-sales?plan=guided-setup">
                Start guided setup <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link href="/pricing" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              See full pricing architecture <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-20 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-10">
            <SectionRail index="01" label="Software cost" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Software gives you the system. Setup makes it usable.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Some teams only need access to a focused AI workspace. Others need help
                connecting company context, shaping workflows, and training the first users.
                Choose the entry point that matches the urgency of the business problem.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SOFTWARE_COSTS.map((item) => (
              <div key={item.name} className="border border-border bg-card p-6 sm:p-7">
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-4">
                  {item.name}
                </h4>
                <p className="text-3xl font-semibold tracking-[-0.025em] text-foreground mb-5">
                  {item.price}
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="Starter offers" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Four ways to begin without overbuilding.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Start with a narrow software surface, configure the first workflow, or bring
                Perpetual Core into the operating rhythm for 90 days. Each path is designed
                to create a working result before expanding.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {PACKAGES.map((pkg) => (
              <div
                key={pkg.name}
                className={`border border-border bg-card p-6 sm:p-7 flex flex-col ${
                  pkg.featured ? "border-primary/40 bg-primary/[0.04]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-8">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    {pkg.index}
                  </span>
                  {pkg.featured && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      Warm lead
                    </span>
                  )}
                </div>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {pkg.name}
                </h4>
                <p className="text-2xl font-semibold tracking-[-0.025em] text-foreground mb-2">
                  {pkg.price}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
                  {pkg.duration} · {pkg.bestFor}
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65] mb-6">
                  {pkg.body}
                </p>
                <ul className="space-y-2 mb-8">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-foreground/45 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <PackageCheckoutButton packageId={pkg.checkoutId}>
                  {pkg.cta}
                </PackageCheckoutButton>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 border border-border bg-surface-hover/40 p-5">
            <p className="text-sm text-muted-foreground leading-[1.65] flex-1">
              Need a custom invoice, ACH, procurement review, or a different first payment
              amount? Use the sales form and we can issue a manual Stripe invoice.
            </p>
            <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
              <Link href="/contact-sales?intent=manual-invoice">
                Request invoice <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-28 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="Choose a path" />
            <div className="max-w-3xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-8">
                Pick the starting point that matches the business problem.
              </h3>
              <div className="space-y-3">
                {FIT_GUIDE.map((rule) => (
                  <div key={rule.signal} className="grid gap-3 border border-border bg-card p-5 sm:grid-cols-[1fr_240px]">
                    <p className="text-sm text-muted-foreground leading-[1.65]">
                      {rule.signal}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {rule.answer}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-10 border-l-2 border-primary/50 pl-6">
                <p className="text-base text-muted-foreground leading-[1.7]">
                  Not sure which path fits? Start with Guided Setup when the need is clear
                  but the system is not configured yet. Choose the 90-Day Operating Lane when
                  the company wants Perpetual Core involved as an AI consultant and operator.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="04" label="After payment" />
            <div className="grid gap-4 md:grid-cols-3">
              {POST_PURCHASE_STEPS.map((step, index) => (
                <div key={step.title} className="border border-border bg-card p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-lg font-semibold tracking-[-0.015em] text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-[1.65]">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
