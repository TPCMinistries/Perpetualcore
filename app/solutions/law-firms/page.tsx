"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EngagementBanner } from "@/components/landing/EngagementBanner";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const USE_CASES = [
  {
    name: "Matter + case-history continuity",
    body: "Every prior matter, brief, motion, and decision-rationale preserved as queryable knowledge. New associates inherit how the firm has handled similar issues. Knowledge stops walking out when senior partners retire.",
  },
  {
    name: "Brief + research drafting",
    body: "Drafted in your firm's voice, grounded in your prior work product. The system reads the matter file, the related briefs, the controlling precedents — and produces a starting draft. Attorneys edit and validate, instead of starting blank.",
  },
  {
    name: "Senior-partner knowledge capture",
    body: "Decades of judgment, deal patterns, and counseling instincts preserved before retirement. The system captures the why behind decisions, not just the what. Successor attorneys inherit the depth, not just the file.",
  },
  {
    name: "Client + matter intelligence",
    body: "Before a client meeting, ask the system for the complete history, related matters, prior counsel given, and outstanding issues. Make every conversation informed. Client experience becomes consistent across the firm.",
  },
  {
    name: "Practice-group knowledge base",
    body: "Practice-area protocols, sample documents, jurisdiction-specific nuances, and ethics-screening procedures in one queryable archive. Attorneys stop reinventing what the firm already knows.",
  },
  {
    name: "Compliance + ethics workflows",
    body: "Conflict checks, retention-policy enforcement, billing-narrative drafting, and audit-trail generation. The system tells you what's documented and where the gaps are before a bar audit or malpractice review.",
  },
];

const PRICING_FEATURES = [
  "Unlimited matter, brief, and work-product archive",
  "Practice-area knowledge bases with granular access controls",
  "Attorney-client privilege protected via permissions + audit logs",
  "All AI models included (Claude, GPT-4, Gemini, more)",
  "24/7 AI coach for attorneys + staff",
  "Document management integrations (NetDocuments, iManage, more)",
  "SOC 2 certified, end-to-end encryption, complete audit trails",
  "Dedicated onboarding and practice-area customization",
];

const VOLUME_DISCOUNTS = [
  { tier: "Volume (20+ attorneys)", value: "15% off" },
  { tier: "Volume (50+ attorneys)", value: "25% off" },
  { tier: "Annual payment", value: "20% off" },
  { tier: "Money-back guarantee", value: "30 days" },
];

const FAQS = [
  {
    q: "How does this protect attorney-client privilege and confidentiality?",
    a: "Granular permissions per attorney, practice area, and client matter. SOC 2 certified. All data encrypted at rest and in transit. Complete audit logs of every access. Client data never trains foundation models. You control retention windows per matter. On-prem deployment available at the Institutional tier for firms whose data can't leave their infrastructure.",
  },
  {
    q: "Is this compliant with ABA technology and ethics rules?",
    a: "The platform is designed against ABA Model Rule 1.6 (Confidentiality of Information) expectations — encryption, access controls, audit trails, vendor-confidentiality terms. Formal ethics review is pending counsel sign-off before we make any compliance certification claim. Firms should conduct their own ethics review consistent with their jurisdiction's Model Rules adoption.",
  },
  {
    q: "Will this work with our existing document management system?",
    a: "Yes. We integrate with NetDocuments, iManage, Worldox, SharePoint, and most major DMS systems. Integration is part of onboarding. We can also ingest legacy archives — decades of briefs, motions, and matter files — so your firm's prior work becomes queryable institutional knowledge rather than scattered filing-cabinet wisdom.",
  },
  {
    q: "How does pricing work for growing firms?",
    a: "$999/attorney/mo. Pay only for active attorneys — add or remove users anytime, no penalties. Volume discounts at 20+ and 50+ attorneys. Annual payment saves 20%. The 3-band spectrum is designed for movement: subscriptions → retainers ($5K–$15K/mo) → engagements ($75K–$250K+ full installs). We discuss credit toward engagement scope case-by-case if you cross bands.",
  },
  {
    q: "What happens when a senior partner retires?",
    a: "That's the central design point. The institutional knowledge layer captures what they know — deal patterns, counseling instincts, decision rationale — so it isn't lost when they transition. Successor attorneys inherit the depth of what came before. Plus the underlying Engine was built to be operated by your team after we hand it over. You own the system.",
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

export default function LawFirmsPage() {
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
              Industries · Law firms and legal organizations
            </p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Senior-partner judgment that{" "}
            <span className="italic text-foreground/85">doesn&apos;t walk out at retirement.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Preserve matter histories, capture decision rationale, accelerate brief drafting,
              and inherit practice-area wisdom across generations of attorneys — without
              compromising attorney-client privilege.
            </p>
            <p>
              The AI-native operating system for firms whose data sits behind privilege,
              whose institutional knowledge defines the brand, and whose successor attorneys
              deserve to inherit the depth of what came before them.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="/signup?plan=law">Start 14-day trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link
              href="/contact-sales?plan=law"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Schedule a demo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mono stats row */}
          <div className="border-t border-border pt-6 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">∞</p>
              <p>Matter archive</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">24/7</p>
              <p>AI coach available</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">SOC 2</p>
              <p>Certified secure</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">ABA</p>
              <p>Rule 1.6 aware*</p>
            </div>
          </div>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            * Formal ABA ethics review pending counsel sign-off.
          </p>
        </div>
      </section>

      {/* Six use cases */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Use cases" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Six workflows law firms already use it for.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Each one solves a specific pattern of institutional drift — judgment that walks
                out at retirement, briefs that get re-drafted from scratch, conflict checks that
                rely on recall. Pick one, see if the system thinks the way your firm thinks.
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
                Most firms start with Subscription at $999/attorney/mo. Some scale to a managed
                retainer when matter-archive, brief-drafting, or compliance work needs ongoing
                cadence. Some go straight to a full engagement that installs the Perpetual Engine
                across the firm.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            <Link href="#pricing" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 01</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Legal Subscription</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$999/attorney/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For firms 5–100 attorneys. Self-serve with onboarding. 14-day trial. Volume discounts at 20+ and 50+ seats.
              </p>
            </Link>
            <Link href="/studio/retainers" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 02</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Retainers</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$5K–$15K/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For firms with ongoing capture, brief-drafting, or knowledge-management cadence. Capture Pipeline, Operator Concierge, Skills Subscription.
              </p>
            </Link>
            <Link href="/studio/engagements" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 03</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Engagement</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$75K–$250K+</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For mid-size and large firms ready to install the eight-registry Engine across practice groups. 90–180 day install. You own it.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing detail */}
      <section id="pricing" className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="Legal Subscription" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                $999 per attorney per month.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Legal-tier pricing reflects the privilege-protection infrastructure, the DMS
                integration work, and the granular permissions stack. 14-day trial. Annual
                payment saves 20%.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl">
              <div className="border border-border bg-card p-8 sm:p-10">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-semibold tracking-[-0.025em] text-foreground">$999</span>
                  <span className="font-mono text-sm text-muted-foreground">/attorney/month</span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-8">
                  14-day trial · DMS integration available · ABA Rule 1.6 aware*
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
                    <Link href="/contact-sales?plan=law">
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
                Five questions law firms ask.
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
            <SectionRail index="—" label="Built for privilege, not for marketing copy" />
            <div className="max-w-2xl">
              <h3 className="display-hero text-3xl sm:text-4xl lg:text-[52px] text-foreground mb-10 leading-[1.05]">
                Built for the constraints law firms{" "}
                <span className="italic">actually operate under.</span>
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Attorney-client privilege. ABA Model Rules. State bar variations. Conflict-check
                obligations. Malpractice exposure. The regulatory regime is the design parameter,
                not an afterthought.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  size="lg"
                  asChild
                  className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <Link href="/contact-sales?plan=law">
                    Request a demo <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/studio/engagements"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3"
                >
                  Or install at firm scale <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
