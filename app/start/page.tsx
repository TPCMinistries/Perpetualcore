/**
 * /start — the canonical "how do I work with you" page.
 *
 * Maps the three-step engagement ladder: Map → Sprint → Lane/Install.
 * Linked from home, footer, /pricing FAQ. The aim is to give a visitor who
 * doesn't yet know what to buy a clean path: read the guide, scope the first
 * workflow, then decide whether to buy a lane, sprint, or install.
 *
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/seo/structured-data";

export const metadata = {
  title: "How to start with Perpetual Core",
  description:
    "Three steps from cold visitor to installed AI: read the buyer's guide, map the first workflow, then choose a managed lane, sprint, or install.",
};

const STEPS = [
  {
    index: "01",
    label: "Read",
    title: "The AI Implementation Buyer's Guide",
    duration: "30 minutes",
    cost: "Free",
    body: "Before you talk to any vendor — us included — read the guide. It covers the four cost buckets, the outcome-eval framework, the vendor evaluation rubric, and four signals that the right answer is to not install AI at all. Vendor-agnostic.",
    primaryCta: { label: "Open the guide", href: "/guide/ai-implementation-buyers-guide" },
    secondaryCta: { label: "Get it by email", href: "/lead-magnet" },
  },
  {
    index: "02",
    label: "Audit",
    title: "AI OS Map or Atlas Discovery",
    duration: "1-3 weeks",
    cost: "$7,500 – $25,000+",
    body: "We sit in your operations the way an operator does. Calls, docs, voice notes, the channels where decisions actually happen. Deliverable: operational map, ranked AI install candidates, outcome-eval scope, and a contract framework your CFO can co-sign.",
    primaryCta: { label: "Read about Discovery", href: "/products/atlas-discovery" },
    secondaryCta: { label: "Talk to sales", href: "/contact-sales?intent=ai-os-map" },
    footnote: "Qualified Discovery fees can credit toward a sprint or install if you proceed within 90 days.",
  },
  {
    index: "03",
    label: "Install",
    title: "Sprint or Engine Install",
    duration: "4-24 weeks",
    cost: "$30,000 – $500,000+",
    body: "Four bands ($30K-$75K sprint, $75K-$150K department OS, $150K-$500K+ Engine install) scoped to the operating problem. We don't write decks. We ship workflows that move the metric you co-signed in the outcome-eval scope.",
    primaryCta: { label: "See engagement bands", href: "/studio/engagements" },
    secondaryCta: { label: "Read the methodology", href: "/studio/methodology" },
  },
  {
    index: "04",
    label: "Maintain",
    title: "Managed lane or post-install retainer",
    duration: "Monthly",
    cost: "$5,000 – $35,000/month",
    body: "For operators who'd rather we stay in the loop. Scoped to the engagement that shipped, cancellable any month. Includes the outcome-eval recheck cadence (6, 12, 24 weeks post-install) and ad-hoc operator support.",
    primaryCta: { label: "See retainer programs", href: "/studio/retainers" },
    secondaryCta: { label: "Talk to sales", href: "/contact-sales?plan=retainer" },
  },
];

const ALTERNATIVES = [
  {
    label: "I just want the SaaS",
    body: "Product surfaces start around $149/month. Guided setup and first-workflow packages give you a cleaner way to begin if you want help.",
    href: "/packages",
  },
  {
    label: "I'm comparing vendors",
    body: "Honest feature-by-feature against ChatGPT Teams, Claude for Teams, and DIY tool stacks. Use it to evaluate any vendor — us included.",
    href: "/compare",
  },
  {
    label: "I'm a founder, not a buyer",
    body: "DeepFutures invests in mission-aligned founders building toward AI-native operating systems. Pre-seed, by introduction.",
    href: "/fund",
  },
  {
    label: "I represent an IHA program",
    body: "Mission partners under the Institute for Human Advancement get 30% off Vellum subscriptions and access to the Founders 1,000 cohort.",
    href: "/institute",
  },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{index}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export default function StartPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "How to start", path: "/start" },
        ])}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="How to start" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              Four steps. No surprises.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              The honest map from cold visitor to installed AI. Read first.
              Audit second. Install only after we've co-signed what success
              looks like.
            </p>
          </div>
        </div>
      </section>

      {/* The four steps */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="space-y-px bg-border border border-border">
            {STEPS.map((step) => (
              <div key={step.index} className="bg-card p-7 sm:p-10">
                <div className="grid lg:grid-cols-[200px_1fr_280px] gap-6 lg:gap-12">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
                      Step {step.index} · {step.label}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground">
                      {step.duration}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-1">
                      {step.cost}
                    </p>
                  </div>
                  <div className="max-w-2xl">
                    <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-[1.7]">
                      {step.body}
                    </p>
                    {step.footnote && (
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
                        {step.footnote}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 self-start">
                    <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px] justify-start">
                      <Link href={step.primaryCta.href}>
                        {step.primaryCta.label}
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px] justify-start">
                      <Link href={step.secondaryCta.href}>
                        {step.secondaryCta.label}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* If this map isn't yours */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Different path?" />
            <div className="max-w-3xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-8">
                Not every visitor needs Discovery.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10 max-w-2xl">
                The four-step ladder above is for organizations buying
                production AI. If that's not you, here's where to go.
              </p>
              <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
                {ALTERNATIVES.map((alt) => (
                  <Link
                    key={alt.href}
                    href={alt.href}
                    className="group bg-card p-6 sm:p-7 hover:bg-surface-hover transition-colors"
                  >
                    <p className="text-base font-semibold tracking-[-0.01em] text-foreground mb-2 inline-flex items-center gap-1">
                      {alt.label}
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-sm text-muted-foreground leading-[1.65]">
                      {alt.body}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
