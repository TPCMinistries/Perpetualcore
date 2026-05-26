/**
 * /studio/engagements — engagement detail (arm 01 deep).
 * Three bands, retainer, what's included, 6-phase arc.
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Engagements — Perpetual Core",
  description:
    "Scoped studio engagements start around $30,000 and can expand into full Perpetual Engine installs across your operations. Documented, trained, handed over.",
};

const BANDS = [
  {
    index: "01",
    name: "Studio Sprint",
    price: "$30,000+",
    duration: "6-8 weeks · One operating surface",
    body: "A focused engagement around one high-value workflow: intake, capture, reporting, diligence, onboarding, or knowledge operations. Built to prove the operating case before a larger install.",
    featured: true,
  },
  {
    index: "02",
    name: "Engine Install",
    price: "Custom",
    duration: "90-150 days · Department or cross-department",
    body: "Eight-registry install across the operating surface. AI-First Framework applied end-to-end. Skills library populated with production workflows.",
    featured: false,
  },
  {
    index: "03",
    name: "Institutional",
    price: "$250,000+",
    duration: "180 days · Whole-org",
    body: "Engine installed at the operating-system layer. Custom skills, multi-tenant configuration, training cohort for your operators. Includes 90 days of post-handover support.",
    featured: false,
  },
];

const ARC = [
  { week: "Week 1–2", title: "Intake and audit", body: "We show up, ask questions, sit in meetings. Written audit at the end of week 2 — what we found, what we'd install first. If the audit doesn't land, you don't proceed. No retainer claimed." },
  { week: "Week 3–6", title: "Registry install", body: "The eight registries go into your Supabase. Operators are querying live data by week 5." },
  { week: "Week 7–14", title: "Skills build", body: "Production skills built against the workflows the audit identified. Weekly demos. Pull the plug at any phase boundary." },
  { week: "Week 15–20", title: "Training and handover", body: "Your team operates the system in production. We coach. The skills library has 15–30 working units by handover." },
  { week: "Week 21–24", title: "Post-handover", body: "We're available, not embedded. Your team runs the system. We show up for the questions that don't have obvious answers." },
  { week: "Month 7+", title: "Retainer (optional)", body: "$5,000–$15,000/month, scoped to engagement. We stay close on what you build next. Cancellable any month." },
];

const INCLUDED = [
  { name: "The eight registries", body: "Installed in your Supabase: entities, people, projects, work items, knowledge, agents, workflows, events." },
  { name: "The AI-First Framework", body: "Applied to your real workflows. Learn → Wire → Automate → Scale." },
  { name: "A compounding skills library", body: "Anthropic SKILL.md format, per-org JSON config. Versioned, auditable, yours." },
  { name: "Documentation", body: "Written for your operators, not for us. The system is documented to be operated and extended by your team." },
  { name: "Training", body: "In-person or remote, for the team that has to keep this running. Real workflows, not slideware." },
  { name: "The Engine commitment", body: "10% of every engagement funds the Institute for Human Advancement as a separate audited line item." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function StudioEngagementsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 01 · Studio · Engagements</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Start with a scoped studio engagement.
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              Engagements can start around $30,000 when the scope is narrow and the operating
              problem is clear. Larger Engine installs are scoped separately, but we do not
              need to force every buyer through that door first.
            </p>
            <p>
              Three bands depending on the surface area. Each ends the same way: documented,
              trained, handed over. No SOW extensions to keep the lights on. No vendor lock-in.
            </p>
            <p>
              Not ready to install? See{" "}
              <Link
                href="/studio/retainers"
                className="text-foreground underline underline-offset-4 hover:text-primary"
              >
                Retainers
              </Link>{" "}
              — productized programs at $5K–$15K/mo that roll into an engagement when the work
              scales.
            </p>
          </div>

          {/* Letter #001 — keeps pricing transparent without making the largest install
              band feel like the only way to begin. */}
          <aside className="border-l-2 border-foreground/15 pl-5 max-w-2xl mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
              № 001 · Letter from the founder
            </p>
            <Link
              href="/blog/the-75k-floor"
              className="group inline-flex items-baseline gap-2 text-foreground hover:text-primary transition-colors"
            >
              <span className="font-display italic text-xl sm:text-[22px] leading-[1.3] tracking-[-0.01em]">
                What a serious AI install actually costs.
              </span>
              <ArrowRight className="h-3.5 w-3.5 translate-y-0.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-[1.6]">
              The honest math behind vendor costs, engineering time, integration debt,
              and outcome evaluation. Five-minute read.
            </p>
          </aside>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/contact-sales">
                Book an intake call <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link href="/studio/retainers" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              Or see Retainers <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Three bands — table layout, mono pricing */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Pricing" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Three bands. Pick the one your operations need.
              </h3>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {BANDS.map((band) => (
              <div key={band.name} className="p-6 sm:p-7 flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <span className="font-mono text-[10px] text-muted-foreground tracking-[0.18em]">
                    {band.index}
                  </span>
                  {band.featured && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      Most common
                    </span>
                  )}
                </div>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {band.name}
                </h4>
                <p className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-foreground mb-3">
                  {band.price}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-6">
                  {band.duration}
                </p>
                <p className="text-sm text-muted-foreground leading-[1.65] flex-1">
                  {band.body}
                </p>
              </div>
            ))}
          </div>

          {/* Retainer row */}
          <div className="border border-t-0 border-border bg-card p-6 sm:p-7 grid sm:grid-cols-[200px_1fr_auto] gap-6 sm:gap-10 items-baseline">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Optional · all bands
              </p>
              <p className="text-xl font-semibold tracking-[-0.015em] text-foreground">
                Retainer
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-[1.65]">
              <span className="text-foreground font-medium">$5,000–$15,000/month</span>, scoped to
              engagement. For operators who&apos;d rather we stay in the loop on what comes next.
              Cancellable any month. We don&apos;t need it; you might.
            </p>
            <Link
              href="/contact-sales"
              className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.18em] text-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              Book intake
              <ArrowRight className="ml-2 h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="Included in every engagement" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Every engagement ships the same six things.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {INCLUDED.map((item, i) => (
                <div key={item.name} className="grid grid-cols-[60px_1fr] sm:grid-cols-[60px_240px_1fr] gap-6 py-6 border-b border-border items-baseline">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <h4 className="text-base font-semibold tracking-tight text-foreground">
                    {item.name}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-[1.65] col-span-3 sm:col-auto">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Engagement arc — 180-day timeline */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="The arc" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                180 days, broken honestly.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                A timeline you can show your board. We&apos;d rather you see the work than read the deck.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {ARC.map((phase, i) => (
                <div key={phase.week} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_200px_1fr] gap-6 py-7 border-b border-border items-baseline">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-1">
                      {phase.week}
                    </p>
                    <p className="text-base font-semibold tracking-tight text-foreground">
                      {phase.title}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-[1.65] col-span-2 sm:col-auto">
                    {phase.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Book intake" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Engagements run continuously. Yours can start in two weeks.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Intake calls are 30 minutes. We&apos;ll tell you within a week if it&apos;s a fit
                and what band lines up with your operation.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button size="lg" asChild className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/contact-sales">Book an intake call <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Link href="/about" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                  Talk to the founder <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
