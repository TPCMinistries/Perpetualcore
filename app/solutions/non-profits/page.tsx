"use client";

/**
 * /solutions/non-profits — flagship industry vertical page.
 * Visual register matches homepage v6. Cross-links to 3-band spectrum.
 * Subscription at $99/staff/mo with volume discounts preserved.
 */

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EngagementBanner } from "@/components/landing/EngagementBanner";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const USE_CASES = [
  {
    name: "Grant writing and renewal",
    body: "Every successful proposal, rejection feedback, and funder communication preserved as queryable knowledge. Reuse winning narratives across applications. Increase win rates without re-inventing each cycle.",
  },
  {
    name: "Donor relationship management",
    body: "Before donor meetings, ask the system for the complete giving history, program interests, and past conversations. Make every interaction informed. Retention and lifetime value compound.",
  },
  {
    name: "Seamless staff transitions",
    body: "When staff leave, their knowledge stays. New hires access complete program histories, community contacts, best practices, institutional wisdom. Reduce onboarding from months to days.",
  },
  {
    name: "Impact reporting and storytelling",
    body: "Need impact data for a board meeting or grant report? Ask for program outcomes, success stories, metrics. Generate compelling reports in minutes — not hours of data archaeology.",
  },
  {
    name: "Program documentation",
    body: "Every program's curriculum, intake form, evaluation protocol, and lessons-learned in one queryable archive. Program design stops starting from scratch.",
  },
  {
    name: "Compliance + audit readiness",
    body: "Funder audits, board reports, IRS Form 990 prep — pull the documentation and decision trail from one place. The system tells you what's in your records and where the gaps are.",
  },
];

const PRICING_FEATURES = [
  "Unlimited grant templates and storage",
  "Donor relationship intelligence",
  "Program documentation + best-practice library",
  "All AI models included (Claude, GPT-4, Gemini, more)",
  "24/7 AI coach for staff",
  "Donor database integrations",
  "SOC 2 certified security and encryption",
  "Dedicated onboarding and training",
];

const VOLUME_DISCOUNTS = [
  { tier: "Volume (10+ staff)", value: "15% off" },
  { tier: "Volume (25+ staff)", value: "25% off" },
  { tier: "Annual payment", value: "20% off" },
  { tier: "Money-back guarantee", value: "30 days" },
];

const FAQS = [
  {
    q: "How is this different from Notion AI or general chatbots?",
    a: "Notion AI works with one document at a time. We give your organization institutional knowledge that compounds across years of work — grant histories, donor relationships, program outcomes, all queryable as one mind. The system reads the full corpus and writes the answer. Synthesis, not search.",
  },
  {
    q: "What about data privacy and donor confidentiality?",
    a: "SOC 2 certified. End-to-end encryption. Your data never trains foundation models. You control retention windows per source (30-day, 1-year, or custom). On-prem deployment available at the Institutional tier for organizations whose data can't leave their infrastructure.",
  },
  {
    q: "How does the 10–15% giving commitment work?",
    a: "10% of every dollar of revenue we earn from your organization flows to the Institute for Human Advancement — our 501(c)(3) parent that runs workforce development for low-income New Yorkers and field health programs in East Africa. Audited annually. Line-itemed on every invoice. You're funding a mission while paying for software.",
  },
  {
    q: "Can we start small and scale up?",
    a: "Yes. Most orgs start with one or two staff on Subscription ($99/mo each). The 3-band spectrum is designed for movement: subscriptions → retainers ($5K–$15K/mo) → engagements ($75K–$250K+ full installs). We discuss credit toward engagement scope case-by-case if you cross bands.",
  },
  {
    q: "Will you actually be there when our ED leaves?",
    a: "That's the central design point. The institutional knowledge layer captures what your ED knows so it isn't lost when they go. Plus the underlying Engine — the eight registries, the AI-First Framework, the skills library — was built to be operated by your team after we hand it over. You own the system. We don't disappear, but you don't need us.",
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

export default function NonProfitsPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <EngagementBanner />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">
              Industries · Non-profits and social-impact organizations
            </p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Institutional memory for{" "}
            <span className="italic text-foreground/85">mission-driven organizations.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Preserve grant strategies, track donor relationships, organize program wisdom, and
              maintain institutional knowledge when staff transitions happen.
            </p>
            <p>
              The AI-native operating system for non-profits whose data needs to be sovereign,
              whose mission needs to be funded, and whose institutional knowledge can&apos;t walk
              out the door.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="/signup?plan=non-profits">Start 14-day trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link
              href="/contact-sales?plan=non-profits"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Schedule a demo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mono stats row */}
          <div className="border-t border-border pt-6 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">∞</p>
              <p>Institutional memory</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">24/7</p>
              <p>AI coach available</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">11</p>
              <p>Models included</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">SOC 2</p>
              <p>Certified secure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Six use cases */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Use cases" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Six workflows non-profits already use it for.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Each one solves a specific pattern of institutional drift — knowledge that walks
                out, work that gets re-done, relationships that get forgotten. Pick one, see if
                the system thinks the way your team thinks.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {USE_CASES.map((c, i) => (
                <div key={c.name} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-x-6 sm:gap-x-10 py-7 border-b border-border">
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

      {/* 3-band cross-link */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="Three ways to engage" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Subscribe. Retain. Or install the full Engine.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Most non-profits start with Subscription at $99/staff/mo. Some scale to a managed
                retainer when work needs ongoing operating cadence. Some go straight to a full
                engagement that installs the Perpetual Engine across the organization.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            <Link href="#pricing" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 01</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Subscription</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$99/staff/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For non-profits 2–50 staff. Self-serve. 14-day trial. Volume discounts at 10+ and 25+ seats.
              </p>
            </Link>
            <Link href="/studio/retainers" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 02</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Retainers</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$5K–$15K/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For non-profits with ongoing capture or operations cadence. Capture Pipeline, Operator Concierge, Skills Subscription.
              </p>
            </Link>
            <Link href="/studio/engagements" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 03</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Engagement</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$75K–$250K+</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For mid-size non-profits ready to install the eight-registry Engine across operations. 90–180 day install. You own it.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Subscription pricing detail */}
      <section id="pricing" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="Subscription pricing" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                $99 per staff member per month.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                The self-serve tier. 14-day trial, no credit card required. Volume discounts at
                10+ and 25+ seats. Annual payment saves 20%.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl">
              <div className="border border-border bg-card p-8 sm:p-10 mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-semibold tracking-[-0.025em] text-foreground">$99</span>
                  <span className="font-mono text-sm text-muted-foreground">/staff/month</span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-8">
                  14-day trial · No credit card · Setup in 1 day
                </p>

                <ul className="space-y-3 mb-8">
                  {PRICING_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground leading-[1.65]">
                      <span className="font-mono text-foreground/40 mt-0.5">—</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-border pt-6 space-y-2">
                  {VOLUME_DISCOUNTS.map((d) => (
                    <div key={d.tier} className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <span>{d.tier}</span>
                      <span className="text-foreground font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-10">
                  <Button asChild className="w-full text-sm font-medium h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                    <Link href="/signup?plan=non-profits">
                      Start 14-day trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="04" label="Questions" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Five questions non-profits ask.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.q} className="border-b border-border">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full grid grid-cols-[60px_1fr_24px] gap-x-6 py-7 text-left hover:bg-surface-hover transition-colors items-baseline group"
                    >
                      <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                        Q.{i + 1}
                      </span>
                      <h4 className="text-base sm:text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {faq.q}
                      </h4>
                      <span className="text-muted-foreground pt-1">
                        {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-[60px_1fr_24px] gap-x-6 pb-7">
                        <span />
                        <p className="text-base text-muted-foreground leading-[1.7] max-w-2xl">
                          {faq.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Ready to amplify your impact" />
            <div className="max-w-2xl">
              <h3 className="display-hero text-3xl sm:text-4xl lg:text-[52px] text-foreground mb-10 leading-[1.05]">
                Build institutional knowledge that{" "}
                <span className="italic">compounds over time.</span>
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Most non-profits lose more knowledge to attrition than to any other failure mode.
                The system you adopt today is the system your next ED inherits. Make it count.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  size="lg"
                  asChild
                  className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <Link href="/signup?plan=non-profits">
                    Start 14-day trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/contact-sales?plan=non-profits"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3"
                >
                  Schedule a demo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
