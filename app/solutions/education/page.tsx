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
    name: "Curriculum + lesson-plan continuity",
    body: "Every successful unit, rubric, scaffold, and student-response pattern preserved as queryable knowledge. New educators inherit what worked. Teaching wisdom compounds across grades instead of leaving with retirees.",
  },
  {
    name: "Student insight + intervention tracking",
    body: "Track learning patterns, accommodations, and interventions per student across years and educators. Surface what worked before. Make every parent conference informed by the full record, not last quarter's snapshot.",
  },
  {
    name: "New teacher onboarding",
    body: "When a teacher leaves, their playbook stays. New hires access lesson archives, classroom-management approaches, parent-communication templates, and grade-level wisdom. Onboarding shrinks from months to weeks.",
  },
  {
    name: "Assessment + reporting workflows",
    body: "Need narratives for report cards, IEP updates, or accreditation? Ask the system for student progress, work-sample evidence, attendance patterns. Generate compliant reports in minutes — not weekends.",
  },
  {
    name: "Professional development library",
    body: "Every PD session, instructional-coach observation, and best-practice doc in one searchable archive. PD design stops repeating itself. Teachers find what their school has already learned.",
  },
  {
    name: "Compliance + accreditation prep",
    body: "Title I documentation, NYSED audits, accreditation visits — pull the records and decision trail from one place. The system tells you what's documented and where the gaps are before the visit.",
  },
];

const PRICING_FEATURES = [
  "Unlimited curriculum + lesson-plan storage",
  "Student-insight knowledge base",
  "Professional development library",
  "All AI models included (Claude, GPT-4, Gemini, more)",
  "24/7 AI coach for educators",
  "SIS / LMS integrations (Google Classroom, Canvas, Schoology)",
  "FERPA + SOC 2 certified, signed DPAs available",
  "Dedicated onboarding and training",
];

const VOLUME_DISCOUNTS = [
  { tier: "Volume (10+ educators)", value: "15% off" },
  { tier: "Volume (25+ educators)", value: "25% off" },
  { tier: "Annual payment", value: "20% off" },
  { tier: "Money-back guarantee", value: "30 days" },
];

const FAQS = [
  {
    q: "How do you protect student data and ensure FERPA compliance?",
    a: "FERPA compliant and SOC 2 Type II certified. All data encrypted with 256-bit encryption at rest and in transit. Student data never trains foundation models. Complete audit logs and granular permissions — you control exactly who accesses what. DPAs and BAAs signed as required by your district or state.",
  },
  {
    q: "How is this different from Google Classroom AI or general chatbots?",
    a: "Google Classroom AI works inside one assignment. We give your school institutional knowledge that compounds across years — curriculum archives, student histories, instructional-coach observations, parent-communication patterns. The system reads the full corpus and writes the answer. Synthesis, not search.",
  },
  {
    q: "Will this work with our existing SIS and LMS?",
    a: "Yes. We integrate with Google Classroom, Canvas, Schoology, PowerSchool, Infinite Campus, and most major SIS / LMS systems. Integration setup is part of onboarding. We can also ingest legacy archives — old curriculum docs, lesson plans, PD recordings — so your school's prior work becomes queryable.",
  },
  {
    q: "Can we start small and scale up?",
    a: "Yes. Most schools start with one grade level or department on Subscription ($99/educator/mo). The 3-band spectrum is designed for movement: subscriptions → retainers ($5K–$15K/mo) → engagements ($75K–$250K+ full installs across the district). We discuss credit toward engagement scope case-by-case if you cross bands.",
  },
  {
    q: "What happens when a master teacher retires?",
    a: "That's the central design point. The institutional knowledge layer captures what they know — lesson archives, classroom-management patterns, parent-communication wisdom — so it isn't lost when they go. The next teacher inherits the playbook. Plus the underlying Engine was built to be operated by your school after we hand it over. You own the system.",
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

export default function EducationPage() {
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
              Industries · Schools and educational organizations
            </p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Teaching wisdom that{" "}
            <span className="italic text-foreground/85">compounds across grades.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Preserve master-teacher expertise, share curriculum across grade levels, track student
              insight across years, and onboard new educators in weeks instead of months.
            </p>
            <p>
              The AI-native operating system for schools whose data needs to be FERPA-compliant,
              whose teaching playbook can&apos;t walk out the door when staff retire, and whose
              institutional knowledge deserves to outlast any single educator.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              size="lg"
              asChild
              className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
            >
              <Link href="/signup?plan=education">Start 14-day trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link
              href="/contact-sales?plan=education"
              className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary"
            >
              Schedule a demo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mono stats row */}
          <div className="border-t border-border pt-6 mt-16 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">∞</p>
              <p>Teaching resources</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">24/7</p>
              <p>AI coach available</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">FERPA</p>
              <p>Certified secure</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-foreground mb-1 font-sans">SOC 2</p>
              <p>Type II audited</p>
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
                Six workflows schools already use it for.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Each one solves a specific pattern of institutional drift — knowledge that walks
                out, work that gets re-done, student insight that gets forgotten. Pick one, see if
                the system thinks the way your school thinks.
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
                Most schools start with Subscription at $99/educator/mo. Some scale to a managed
                retainer when the curriculum-archive and PD-library work needs ongoing cadence.
                Some go straight to a full engagement that installs the Perpetual Engine across
                the district.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            <Link href="#pricing" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 01</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Subscription</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$99/educator/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For schools 2–50 educators. Self-serve. 14-day trial. Volume discounts at 10+ and 25+ seats.
              </p>
            </Link>
            <Link href="/studio/retainers" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 02</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Retainers</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$5K–$15K/mo</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For districts with ongoing curriculum, PD, or accreditation cadence. Capture Pipeline, Operator Concierge, Skills Subscription.
              </p>
            </Link>
            <Link href="/studio/engagements" className="group block p-6 sm:p-7 hover:bg-surface-hover transition-colors flex flex-col">
              <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">BAND · 03</p>
              <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">Engagement</h4>
              <p className="text-base font-semibold leading-[1.3] tracking-[-0.01em] text-foreground mb-2">$75K–$250K+</p>
              <p className="text-sm text-muted-foreground leading-[1.6] flex-1">
                For districts and networks ready to install the eight-registry Engine. 90–180 day install. You own it.
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
                $99 per educator per month.
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
              <div className="border border-border bg-card p-8 sm:p-10">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-semibold tracking-[-0.025em] text-foreground">$99</span>
                  <span className="font-mono text-sm text-muted-foreground">/educator/month</span>
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-8">
                  14-day trial · No credit card · FERPA compliant · Setup in 1 day
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
                    <Link href="/signup?plan=education">
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
                Five questions schools ask.
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
            <SectionRail index="—" label="Teach more. Re-do less." />
            <div className="max-w-2xl">
              <h3 className="display-hero text-3xl sm:text-4xl lg:text-[52px] text-foreground mb-10 leading-[1.05]">
                Built so teaching wisdom{" "}
                <span className="italic">outlasts any single educator.</span>
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Most schools lose more institutional knowledge to retirement and turnover than to
                any other failure mode. The system you adopt today is the system your next cohort
                of educators inherits. Make it count.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button
                  size="lg"
                  asChild
                  className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <Link href="/signup?plan=education">
                    Start 14-day trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Link
                  href="/contact-sales?plan=education"
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
