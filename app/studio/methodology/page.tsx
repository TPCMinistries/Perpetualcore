/**
 * /studio/methodology — the AI-First Framework deep dive.
 * Four phases (Learn → Wire → Automate → Scale) with detail; boundary list.
 * Visual register matches homepage v6.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Methodology — Perpetual Core",
  description:
    "The AI-First Framework: Learn → Wire → Automate → Scale. Four phases that turn a 90-day audit into a system your team owns and extends. Published as part of the Perpetual Engine standard.",
};

const PHASES = [
  {
    number: "01",
    title: "Learn",
    duration: "Two weeks",
    body: "We read your org the way an operator does — calls, docs, voice notes, the channels where decisions actually happen. We don't ask you to fill out a 40-page intake. We sit in your meetings, watch your handoffs, and find the operational gaps your team has stopped seeing because they live with them.",
  },
  {
    number: "02",
    title: "Wire",
    duration: "Three to four weeks",
    body: "We install the eight registries in your stack — your Supabase, your storage, your auth. The substrate is now in place. Your operators can already query, filter, and report on data that previously lived in spreadsheets, voice notes, and people's heads.",
  },
  {
    number: "03",
    title: "Automate",
    duration: "Six to ten weeks",
    body: "We build skills against your real workflows. Anthropic SKILL.md format, per-org JSON config, versioned, auditable. Each skill is a unit of automated work your operators can read, audit, and modify. No black boxes. No “trust the model.”",
  },
  {
    number: "04",
    title: "Scale",
    duration: "Two to four weeks",
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

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 01 · Studio · Methodology</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            Learn → Wire → Automate →{" "}
            <span className="italic text-foreground/85">Scale.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>
              The AI-First Framework. Four phases that turn a 90-day audit into a system your
              team owns and extends. The same arc on every engagement, scaled to the band.
            </p>
            <p>
              The framework is part of the{" "}
              <Link href="/engine/spec" className="text-foreground underline underline-offset-4 hover:text-primary">
                Perpetual Engine spec
              </Link>
              . Adopt, fork, extend — the methodology is the contribution, not the company.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/contact-sales">Map the first workflow <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="/engine/spec" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              Read the spec <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Four phases — long-form */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="Four phases" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                None skipped. All four, every engagement.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {PHASES.map((p) => (
                <div key={p.number} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_180px_1fr] gap-6 sm:gap-12 py-10 border-b border-border items-baseline">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    {p.number}
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-1">
                      {p.duration}
                    </p>
                    <h4 className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-foreground">
                      {p.title}.
                    </h4>
                  </div>
                  <p className="text-base text-muted-foreground leading-[1.7] col-span-2 sm:col-auto">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What we don't do */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="What we don't do" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Five things you won&apos;t get from us.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Boundary is part of the methodology. If you want any of the things below, we have
                referrals. None of them are us.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {BOUNDARIES.map((b, i) => (
                <div key={b} className="grid grid-cols-[60px_1fr] gap-6 py-6 border-b border-border items-baseline">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground pt-1">
                    × 0{i + 1}
                  </span>
                  <p className="text-base sm:text-lg font-medium tracking-tight text-foreground">
                    {b}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Install" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                The methodology is the spec. The engagement is how it gets installed.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                If you want the framework run in your stack by the team who wrote it, start an
                engagement. If you want to adopt the methodology yourself, read the spec.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button size="lg" asChild className="text-sm font-medium h-11 px-7 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/contact-sales">Map the first workflow <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Link href="/engine/spec" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3">
                  Read the Engine spec <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
