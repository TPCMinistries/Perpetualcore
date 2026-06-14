/**
 * /studio/process — the engagement arc, week-by-week timeline.
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Process — Perpetual Core",
  description:
    "Day 1 to Month 6: how an engagement actually runs. A timeline you can show your board. We'd rather you see the work than read the deck.",
};

const TIMELINE = [
  { week: "Week 1–2", title: "Intake and audit", body: "We show up, ask questions, sit in meetings. Written audit at the end of week 2 — what we found, what we'd install first, what we'd leave alone. If the audit doesn't land, you don't proceed. No retainer claimed." },
  { week: "Week 3–6", title: "Registry install", body: "The eight registries go into your Supabase. Your operators are already querying live data by week 5." },
  { week: "Week 7–14", title: "Skills build", body: "Production skills built against the workflows the audit identified. Weekly demos. Pull the plug at any phase boundary." },
  { week: "Week 15–20", title: "Training and handover", body: "Your team operates the system in production. We sit in. We coach. The skills library has 15–30 working units by handover." },
  { week: "Week 21–24", title: "Post-handover", body: "We're available, not embedded. Your team runs the system. We show up for the questions that don't have obvious answers." },
  { week: "Month 7+", title: "Retainer (optional)", body: "$5,000–$35,000/month, scoped to engagement. We stay close on what you build next. Cancellable any month." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function ProcessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 01 · Studio · Process</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Day 1 to Month 6:{" "}
            <span className="italic text-foreground/85">
              how an engagement actually runs.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            A timeline you can show your board. We&apos;d rather you see the work than read the deck.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/contact-sales">Book an intake call <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="/studio/methodology" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              Read the methodology <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="The arc" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                180 days, broken honestly.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {TIMELINE.map((phase, i) => (
                <div key={phase.week} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_220px_1fr] gap-6 sm:gap-12 py-10 border-b border-border items-baseline">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-1">
                      {phase.week}
                    </p>
                    <h4 className="text-xl font-semibold tracking-[-0.015em] text-foreground">
                      {phase.title}.
                    </h4>
                  </div>
                  <p className="text-base text-muted-foreground leading-[1.7] col-span-2 sm:col-auto">
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
            <SectionRail index="—" label="Start" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Ready to start?
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Scoped studio engagements can start around $30,000. Intake calls are 30 minutes;
                we&apos;ll tell you within a week if it&apos;s a fit.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button size="lg" asChild className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/contact-sales">Map the first workflow <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Link href="/contact-sales" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                  Book an intake call <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
