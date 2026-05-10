/**
 * /studio/methodology — the AI-First Framework.
 *
 * Per COPY_STUDIO.md Page 3 + UI audit §7: alternating timeline for
 * the four phases (Learn → Wire → Automate → Scale), composed from
 * primitives. Plus §3 "What we don't do" — the antipattern callout.
 *
 * Sections:
 *   1. Hero (text-only)
 *   2. The four phases (alternating-side timeline)
 *   3. What we don't do (5-bullet boundaries list)
 *   4. CTA
 *
 * Sharpening levers from UI audit §5: font-semibold, gradient text on
 * H1 only, mono-violet, max-w-3xl prose columns. The alternating
 * timeline shape is adapted from the ComparisonTable component pattern
 * but composed inline here to keep this page self-contained.
 */

import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Methodology — Perpetual Core",
  description:
    "The AI-First Framework. Learn → Wire → Automate → Scale. Four phases that turn a 90-day audit into a system your team owns and extends.",
};

const PHASES = [
  {
    number: "01",
    title: "Learn.",
    duration: "Two weeks.",
    body: "We read your org the way an operator does — calls, docs, voice notes, the channels where decisions actually happen. We don't ask you to fill out a 40-page intake. We sit in your meetings, watch your handoffs, and find the operational gaps your team has stopped seeing because they live with them.",
  },
  {
    number: "02",
    title: "Wire.",
    duration: "Three to four weeks.",
    body: "We install the eight registries in your stack — your Supabase, your storage, your auth. The substrate is now in place. Your operators can already query, filter, and report on data that previously lived in spreadsheets, voice notes, and people's heads.",
  },
  {
    number: "03",
    title: "Automate.",
    duration: "Six to ten weeks.",
    body: 'We build skills against your real workflows. Anthropic SKILL.md format, per-portco JSON, versioned, auditable. Each skill is a unit of automated work your operators can read, audit, and modify. No black boxes. No "trust the model."',
  },
  {
    number: "04",
    title: "Scale.",
    duration: "Two to four weeks.",
    body: "Your team operates and extends the system. We document. We train. We hand over. You own it.",
  },
];

const BOUNDARIES = [
  "A 200-slide transformation deck.",
  "A Big-4 partnership press release.",
  'A "proprietary AGI platform."',
  "An end-to-end agentic anything.",
  "A vendor relationship that requires us to stay forever.",
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 1. Hero */}
      <section className="container mx-auto px-4 pt-24 pb-20 sm:pt-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            The methodology.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              AI-First Framework.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10">
            Learn &rarr; Wire &rarr; Automate &rarr; Scale. The four phases that turn a 90-day audit into a system your team owns and extends.
          </p>
          <Button size="lg" asChild className="text-base px-7">
            <Link href="/studio/process">
              See the engagement arc <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 2. The four phases — alternating timeline */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The framework.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Four phases, in order. None skipped.
          </h2>
        </div>

        {/* Alternating-side timeline. On mobile collapses to a single column. */}
        <div className="max-w-5xl">
          {PHASES.map((phase, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={phase.number}
                className="grid md:grid-cols-2 gap-6 md:gap-12 py-10 border-b border-border/40 last:border-b-0"
              >
                {/* Number block — alternates side */}
                <div className={`${isLeft ? "md:order-1" : "md:order-2"}`}>
                  <div className="flex items-baseline gap-4 mb-2">
                    <span className="text-5xl font-semibold text-primary/80 tracking-tight">
                      {phase.number}
                    </span>
                    <h3 className="text-2xl font-semibold tracking-tight">{phase.title}</h3>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground tracking-wide">
                    {phase.duration}
                  </p>
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

        <div className="mt-12">
          <Button variant="outline" asChild>
            <Link href="/engine">
              See the Engine substrate <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 3. What we don't do — antipattern callout */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">Boundaries.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            A short list of things we will not sell you.
          </h2>
        </div>

        <Card className="border-border/60 max-w-3xl">
          <CardContent className="p-7">
            <ul className="space-y-4">
              {BOUNDARIES.map((item) => (
                <li key={item} className="flex gap-4">
                  <div className="flex-shrink-0 h-6 w-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center mt-0.5">
                    <X className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-base leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
            <p className="text-base text-muted-foreground leading-relaxed mt-7 pt-7 border-t border-border/40">
              If that&apos;s what you wanted, you have several good options. None of them are us.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 4. Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Ready to install the framework?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Engagements start at $75,000. We take a limited number per quarter.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/process">See the engagement arc</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
