"use client";

/**
 * /solutions/healthcare — flagship healthcare vertical.
 * Visual register matches homepage v6. HIPAA language hedged per legal review.
 * Platform Pro Healthcare Edition at $899/provider/mo. BAA included.
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
    name: "Clinical documentation",
    body: "SOAP notes, encounter summaries, referral letters drafted from voice memos and structured data. Documentation burden reduced; provider attention returned to the patient.",
  },
  {
    name: "Patient communications",
    body: "Pre-visit prep, post-visit follow-ups, care-plan reminders — all queued and personalized against each patient's history and consent state. Templates that read like the provider wrote them.",
  },
  {
    name: "Care-team handoffs",
    body: "Shift change, on-call rotation, consult referral — institutional context preserved across the team. The next clinician knows what the last one did without paging or waiting.",
  },
  {
    name: "Prior authorization + appeals",
    body: "Pull payer policies, patient history, and clinical evidence into appeal drafts. Reduce denials. Reduce the hours providers lose to administrative volume.",
  },
  {
    name: "Quality reporting (HEDIS, MIPS)",
    body: "Measure gap analysis, care-plan compliance, outreach lists — the registry surfaces what your population needs and who's missing what. Reporting becomes ongoing operations, not a year-end scramble.",
  },
  {
    name: "Compliance + audit trail",
    body: "Every record access, agent action, and consent change logged with provenance. The audit log that lets you answer regulator questions six months later without forensics.",
  },
];

const PRICING_FEATURES = [
  "HIPAA-aware infrastructure with signed BAA",
  "256-bit encryption at rest and in transit",
  "Zero-knowledge architecture",
  "Patient data NEVER used to train AI models",
  "Complete audit logs of all data access",
  "All AI models (Claude, GPT-4, Gemini)",
  "EHR integrations (Epic, Cerner, Athena, eClinicalWorks)",
  "SOC 2 certified · vetted by hospital IT security teams",
];

const VOLUME_DISCOUNTS = [
  { tier: "Group practice (10+ providers)", value: "15% off" },
  { tier: "Health system (50+ providers)", value: "25% off" },
  { tier: "Annual payment", value: "20% off" },
  { tier: "Money-back guarantee", value: "30 days" },
];

const FAQS = [
  {
    q: "Is Perpetual Core HIPAA-aware? How is patient data protected?",
    a: "Yes. We operate HIPAA-aware infrastructure: 256-bit encryption at rest and in transit, zero-knowledge architecture (we cannot access your data), and a signed Business Associate Agreement (BAA) included with every healthcare plan. Patient data is NEVER used to train AI models. Complete audit logs of all data access, automatic compliance monitoring. We are vetted by major healthcare systems' IT security teams. Full HIPAA compliance certification is the responsibility of your covered entity; we provide the infrastructure and the BAA.",
  },
  {
    q: "Will this replace my EHR?",
    a: "No. We sit alongside your EHR — Epic, Cerner, Athena, eClinicalWorks, and others — and reduce the documentation and communication burden that lives outside the chart. The chart is still the chart. We're the operating layer above it.",
  },
  {
    q: "How is this different from Doximity GPT or general AI chatbots?",
    a: "Doximity GPT is a feature inside a directory product. We're an operating system: persistent memory across patients (consent-bounded), care-team coordination, prior-auth workflows, quality reporting — all queryable as one mind, not a chat window. The synthesis is the deliverable.",
  },
  {
    q: "How does the giving commitment work?",
    a: "10% of every dollar of revenue we earn from your practice or health system flows to the Institute for Human Advancement — our 501(c)(3) parent that runs workforce development for low-income New Yorkers and field health programs in East Africa. Audited annually. Line-itemed on every invoice. The healthcare margins fund the mission.",
  },
  {
    q: "We're a multi-state health system. Can we install this across our network?",
    a: "Yes. The $5K–$15K/mo retainer band or the $75K–$250K+ engagement band exists for organizations that need more than self-serve. An engagement installs the eight-registry Engine across the system: identity, knowledge, decisions, work, comms, claims, signal, trust — all federated to your stack. You own the system after we leave.",
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

export default function HealthcarePage() {
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
              Industries · Healthcare — HIPAA-aware · BAA included
            </p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            AI infrastructure for clinicians who&apos;d rather{" "}
            <span className="italic text-foreground/85">care than chart.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Reduce documentation burden. Streamline patient communications. Preserve care-team
              institutional memory across shift changes and provider transitions.
            </p>
            <p>
              Built for the regulatory regime healthcare actually operates under — HIPAA-aware,
              BAA-included, zero-knowledge architecture, vetted by major hospital IT security
              teams.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/contact-sales?plan=healthcare">Request a demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="#pricing" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              See pricing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="border-t border-border pt-6 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">BAA</p>
              <p>Included with every plan</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">256-bit</p>
              <p>Encryption at rest + in transit</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">0-trust</p>
              <p>Zero-knowledge architecture</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">SOC 2</p>
              <p>Certified secure</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Use cases" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Six workflows healthcare teams already use it for.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Each one solves a documentation burden, a coordination gap, or a compliance
                requirement. Start with one. Roll into the others as your team adopts.
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
                Per-provider subscription. Managed retainer. Whole-system install.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Most independent providers start with Platform Pro Healthcare at $899/provider/mo.
                Group practices move to a retainer when scaling makes self-serve unwieldy. Multi-site
                health systems install the full Engine.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            <Link href="#pricing" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 01</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Platform Pro Healthcare</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$899/provider/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                BAA included. 14-day trial. Volume discounts at 10+ and 50+ providers.
              </p>
            </Link>
            <Link href="/studio/retainers" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 02</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Retainers</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$5K–$15K/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                Managed AI workflows for group practices. Documentation retainer, prior-auth retainer, quality-reporting retainer.
              </p>
            </Link>
            <Link href="/studio/engagements" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 03</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Engagement</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$75K–$250K+</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For health systems ready to install the eight-registry Engine across the network. 90–180 day install. You own it.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing detail */}
      <section id="pricing" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="Platform Pro Healthcare" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                $899 per provider per month.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Healthcare-tier pricing reflects the BAA, the security infrastructure, and the
                EHR integration work. 14-day trial. Annual payment saves 20%.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl">
              <div className="border border-border bg-card p-8 sm:p-10">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-semibold tracking-[-0.025em] text-foreground">$899</span>
                  <span className="font-mono text-sm text-muted-foreground">/provider/month</span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-8">
                  14-day trial · BAA included · EHR integration available
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
                    <Link href="/contact-sales?plan=healthcare">
                      Request a demo <ArrowRight className="ml-2 h-4 w-4" />
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
                Five questions healthcare orgs ask.
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
            <SectionRail index="—" label="Care more. Chart less." />
            <div className="max-w-2xl">
              <h3 className="display-hero text-3xl sm:text-4xl lg:text-[52px] text-foreground mb-10 leading-[1.05]">
                Built for the constraints healthcare{" "}
                <span className="italic">actually operates under.</span>
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                HIPAA. State data sovereignty. EHR integration. Audit trails. Provider time. The
                regulatory regime is the design parameter, not an afterthought.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button size="lg" asChild className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/contact-sales?plan=healthcare">Request a demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Link href="/studio/engagements" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                  Or install at system scale <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
