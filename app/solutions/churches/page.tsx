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
    name: "Sermon + teaching archive",
    body: "Decades of sermons, biblical exposition frameworks, and theological notes preserved as queryable knowledge. Reuse and build on what your church has already taught. New teaching pastors inherit the depth, not just the title.",
  },
  {
    name: "Pastoral care + counseling continuity",
    body: "Counseling frameworks, member-care notes, and pastoral wisdom captured so it stays when staff transition. Honor confidentiality with granular permissions. The shepherd changes; the care doesn't restart from zero.",
  },
  {
    name: "Volunteer + ministry coordination",
    body: "Track who serves where, who has which gifts, who needs follow-up. Ask the system: who can serve in children's ministry this month? — and get an informed list with availability and history.",
  },
  {
    name: "Member journey + spiritual milestones",
    body: "Baptisms, weddings, prayer requests answered, life events walked through together. Preserve the stories of God's faithfulness across years. Make every pastoral conversation informed by the full record.",
  },
  {
    name: "Operations + governance archive",
    body: "Elder meeting minutes, budget rationale, policy decisions, building maintenance, vendor relationships — institutional wisdom that usually lives in one person's head. Make it queryable for the next generation of leaders.",
  },
  {
    name: "Communication + follow-up workflows",
    body: "Visitor follow-ups, new-member onboarding, prayer-chain coordination — drafted in your church's voice, sent with the right context. The system remembers who needs what, so caring follow-through stops slipping.",
  },
];

const PRICING_FEATURES = [
  "Unlimited sermon, teaching, and theological archive",
  "Pastoral care + counseling knowledge base (with confidentiality controls)",
  "Volunteer + ministry coordination",
  "All AI models included (Claude, GPT-4, Gemini, more)",
  "24/7 AI coach for staff",
  "ChMS integrations (Planning Center, Breeze, Rock RMS, more)",
  "SOC 2 certified, end-to-end encryption, granular permissions",
  "Dedicated onboarding for ministry context",
];

const VOLUME_DISCOUNTS = [
  { tier: "Volume (5+ staff)", value: "15% off" },
  { tier: "Volume (15+ staff)", value: "25% off" },
  { tier: "Annual payment", value: "20% off" },
  { tier: "Money-back guarantee", value: "30 days" },
];

const FAQS = [
  {
    q: "How is this different from Planning Center or general church management software?",
    a: "Planning Center tracks attendance and scheduling. We give your church institutional knowledge that compounds across decades — sermon archives, pastoral wisdom, counseling frameworks, member journeys. The system reads the full corpus and writes the answer. Synthesis on top of, not replacement of, your ChMS.",
  },
  {
    q: "How do you handle pastoral-care confidentiality?",
    a: "Granular permissions. Counseling notes, prayer requests, and pastoral conversations are encrypted at rest and in transit, with role-based access — only authorized pastors see what they need. Audit logs track every access. SOC 2 certified. Your member data never trains foundation models. We can sign data-handling agreements as required by your denomination or board.",
  },
  {
    q: "Will this work with our existing tools?",
    a: "Yes. We integrate with Planning Center, Breeze, Rock RMS, Subsplash, and most major church-management systems. Integration is part of onboarding. We can also ingest legacy archives — decades of sermon recordings, theological notes, elder meeting minutes — so your church's prior work becomes queryable.",
  },
  {
    q: "Can we start small and scale up?",
    a: "Yes. Most churches start with pastoral staff on Subscription ($99/staff/mo). The 3-band spectrum is designed for movement: subscriptions → retainers ($5K–$15K/mo) → engagements ($75K–$250K+ full installs). We discuss credit toward engagement scope case-by-case if you cross bands. Built from inside a church — the model is designed for ministry economics, not Silicon Valley budgets.",
  },
  {
    q: "What happens when our senior pastor retires?",
    a: "That's the central design point. The institutional knowledge layer captures what they know — sermon frameworks, counseling approaches, pastoral wisdom — so it isn't lost when they transition. The incoming pastor inherits the depth of what came before. Plus the underlying Engine was built to be operated by your team after we hand it over. You own the system. We don't disappear, but you don't need us.",
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

export default function ChurchesPage() {
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
              Industries · Churches and ministry organizations
            </p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Pastoral wisdom that{" "}
            <span className="italic text-foreground/85">outlasts any single pastor.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Preserve sermon archives, capture pastoral-care frameworks, coordinate volunteers,
              and track member journeys across decades — so ministry wisdom compounds instead of
              walking out the door when staff transition.
            </p>
            <p>
              Built from inside a church. The AI-native operating system for congregations whose
              data needs to be honored, whose institutional knowledge deserves to be stewarded, and
              whose next generation of leaders deserves to inherit the depth.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="/signup?plan=churches">Start 14-day trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link
              href="/contact-sales?plan=churches"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Schedule a demo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mono stats row */}
          <div className="border-t border-border pt-6 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">∞</p>
              <p>Sermon archive</p>
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
                Six workflows churches already use it for.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Each one solves a specific pattern of ministry drift — wisdom that walks out at
                retirement, member stories that get forgotten, follow-up that slips. Pick one,
                see if the system thinks the way your church thinks.
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
                Most churches start with Subscription at $99/staff/mo. Some scale to a managed
                retainer when sermon-archive, member-care, or operations work needs ongoing
                cadence. Some go straight to a full engagement that installs the Perpetual Engine
                across the ministry.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            <Link href="#pricing" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 01</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Subscription</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$99/staff/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For churches with 2–30 staff. Self-serve. 14-day trial. Volume discounts at 5+ and 15+ seats.
              </p>
            </Link>
            <Link href="/studio/retainers" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 02</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Retainers</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$5K–$15K/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For larger congregations and networks with ongoing capture or operations cadence. Capture Pipeline, Operator Concierge, Skills Subscription.
              </p>
            </Link>
            <Link href="/studio/engagements" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 03</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Engagement</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$75K–$250K+</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For mid-size churches and denominations ready to install the eight-registry Engine. 90–180 day install. You own it.
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
                5+ and 15+ seats. Annual payment saves 20%.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl">
              <div className="border border-border bg-card p-8 sm:p-10">
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
                    <Link href="/signup?plan=churches">
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
                Five questions churches ask.
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
            <SectionRail index="—" label="Steward what you've been entrusted with" />
            <div className="max-w-2xl">
              <h3 className="display-hero text-3xl sm:text-4xl lg:text-[52px] text-foreground mb-10 leading-[1.05]">
                Built so ministry wisdom{" "}
                <span className="italic">compounds across generations.</span>
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Most churches lose more institutional knowledge to pastoral transition than to any
                other failure mode. The system you steward today is the system your next pastor
                inherits. Build it on faithful infrastructure.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  size="lg"
                  asChild
                  className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <Link href="/signup?plan=churches">
                    Start 14-day trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/contact-sales?plan=churches"
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
