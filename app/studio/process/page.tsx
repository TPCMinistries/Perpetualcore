/**
 * /studio/process — the engagement arc.
 *
 * Per COPY_STUDIO.md Page 4 + UI audit §7: week-by-week timeline,
 * adapting the ComparisonTable shape (alternating timeline rows). Each
 * milestone has a week range and an honest description.
 *
 * Sections:
 *   1. Hero (text-only)
 *   2. The timeline — six milestones from Week 1–2 through Month 7+
 *   3. Final CTA
 *
 * Sharpening levers from UI audit §5: gradient text on H1 only, mono-violet,
 * font-semibold, max-w-3xl prose columns, py-32 boundaries.
 *
 * The /consultation 301 redirect now points here (was temp-routed to
 * /studio/engagements during Session 1).
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
  {
    week: "Week 1–2",
    title: "Intake and audit.",
    body: "We show up, ask questions, sit in meetings. You get a written audit at the end of week 2 — what we found, what we'd install first, what we'd leave alone. If the audit doesn't land, you don't proceed. No retainer claimed.",
  },
  {
    week: "Week 3–6",
    title: "Registry install.",
    body: "The eight registries go into your Supabase. Your operators are already querying live data by week 5.",
  },
  {
    week: "Week 7–14",
    title: "Skills build.",
    body: "We build production skills against the workflows the audit identified. You see weekly demos. You can pull the plug at any phase boundary.",
  },
  {
    week: "Week 15–20",
    title: "Training and handover.",
    body: "Your team operates the system in production. We sit in. We coach. We answer questions. The skills library has 15 to 30 working units by handover.",
  },
  {
    week: "Week 21–24",
    title: "Post-handover.",
    body: "We're available, not embedded. Your team runs the system. We show up for the questions that don't have obvious answers.",
  },
  {
    week: "Month 7+",
    title: "Retainer (optional).",
    body: "$5,000–$15,000/month, scoped to engagement. We stay close on what you build next. Or we don't. Your call.",
  },
];

export default function ProcessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 1. Hero */}
      <section className="container mx-auto px-4 pt-24 pb-20 sm:pt-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            The engagement arc.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            Day 1 to Month 6:{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              how an engagement actually runs
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10">
            A timeline you can show your board. We&apos;d rather you see the work than read the deck.
          </p>
          <Button size="lg" asChild className="text-base px-7">
            <Link href="/contact-sales">
              Book an intake call <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 2. The timeline — alternating rows adapted from ComparisonTable shape */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The arc.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            180 days, broken honestly.
          </h2>
        </div>

        <div className="max-w-5xl">
          {TIMELINE.map((phase, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={phase.week}
                className="grid md:grid-cols-2 gap-6 md:gap-12 py-10 border-b border-border/40 last:border-b-0"
              >
                {/* Week label — alternates side */}
                <div className={`${isLeft ? "md:order-1" : "md:order-2"}`}>
                  <p className="text-sm font-medium text-primary tracking-wide mb-2">
                    {phase.week}
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight">{phase.title}</h3>
                </div>
                {/* Body — alternates side */}
                <div
                  className={`${isLeft ? "md:order-2" : "md:order-1"} flex items-center`}
                >
                  <p className="text-base text-muted-foreground leading-relaxed">{phase.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Ready to start?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Engagements start at $75,000. Intake calls are 30 minutes; we&apos;ll tell you within a week if it&apos;s a fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/contact-sales">Book an intake call</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
