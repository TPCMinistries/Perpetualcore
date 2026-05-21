/**
 * DeepFutures — the fund arm of Perpetual Core.
 * Stub landing: thesis, stage, check size, structural pitch, contact CTAs.
 * Replace with full fund site once the entity is formalized + DPM page.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "DeepFutures — The fund arm of Perpetual Core",
  description:
    "DeepFutures invests in AI-native companies at pre-seed and seed. We invest where the studio installs, alongside founders building the operating systems for the next generation.",
};

const THESIS_POINTS = [
  {
    title: "Vertical AI agents over generic chat.",
    body:
      "The model labs and cloud vendors will not optimize for IRB rules, PEPFAR data sovereignty, offline-first connectivity, or vertical regulatory regimes. The opportunity is operator-owned AI tuned to the workflows the platforms will never see.",
  },
  {
    title: "Operator-owned systems over platform dependency.",
    body:
      "Sovereign data, sovereign skills, installable infrastructure. The systems we install in engagements are the same shape as the systems we want to invest in — installable, transparent, governed by the operator.",
  },
  {
    title: "Founders who can ship under constraint.",
    body:
      "Production AI under regulatory or mission constraint is harder than production AI for a SaaS marketing site. We back founders who can ship in the hard contexts the JV consultancies won't touch — and where defensibility lives.",
  },
];

export default function FundPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-24 pb-20 sm:pt-32 sm:pb-24">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-10">
            <span aria-hidden className="block h-1.5 w-1.5 bg-foreground" />
            <p className="eyebrow !text-foreground/70">§ 03 · Fund</p>
          </div>

          <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-4">
            DeepFutures
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-semibold leading-[1.05] tracking-[-0.025em] text-foreground mb-10 max-w-3xl">
            We invest where we install.
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-10 max-w-2xl">
            DeepFutures backs AI-native companies at pre-seed and seed. Operator-owned systems,
            vertical AI agents, infrastructure for the next generation. By introduction.
          </p>

          {/* Stat row */}
          <div className="grid grid-cols-3 border-y border-border max-w-3xl">
            <div className="py-5 pr-5">
              <p className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-foreground mb-1">
                Pre-seed / Seed
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Stage
              </p>
            </div>
            <div className="py-5 px-5 border-l border-border">
              <p className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-foreground mb-1">
                $50K–$250K
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Check size
              </p>
            </div>
            <div className="py-5 pl-5 border-l border-border">
              <p className="text-xl sm:text-2xl font-semibold tracking-[-0.015em] text-foreground mb-1">
                By introduction
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Thesis */}
      <section id="thesis" className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <div>
              <p className="eyebrow mb-3">§ 01</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">
                Thesis
              </h2>
            </div>
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">
                The next decade of AI is operator-owned. We invest in the founders building it.
              </h3>
            </div>
          </div>

          <div className="border-t border-border max-w-5xl">
            {THESIS_POINTS.map((point, i) => (
              <div
                key={point.title}
                className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_280px_1fr] gap-6 sm:gap-12 py-8 border-b border-border"
              >
                <span className="font-mono text-[11px] text-muted-foreground tracking-[0.18em] pt-1">
                  0{i + 1}
                </span>
                <h4 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground col-span-1 sm:col-auto">
                  {point.title}
                </h4>
                <p className="text-base text-muted-foreground leading-[1.7] col-span-2 sm:col-auto">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structural pitch */}
      <section className="border-t border-border py-20 sm:py-28 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div>
              <p className="eyebrow mb-3">§ 02</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">
                Why DeepFutures
              </h2>
            </div>
            <div className="max-w-2xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-8">
                Most funds can&apos;t install what they invest in.
              </h3>
              <div className="space-y-5 text-base text-muted-foreground leading-[1.7]">
                <p>
                  Perpetual Core runs an engagement studio that installs AI operating systems
                  inside mission-driven organizations and fund-backed portcos. The same shape of
                  AI infrastructure we build for clients is the shape we want to invest in.
                </p>
                <p>
                  That means DeepFutures portfolio companies get more than capital: an installable
                  reference architecture, a methodology that&apos;s shipped at production scale, and
                  the kind of operator network you build by being in the field, not at the deck.
                </p>
                <p className="text-foreground font-medium">
                  We invest where we install. That is the structural argument.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTAs */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div>
              <p className="eyebrow mb-3">§ 03</p>
              <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">
                Contact
              </h2>
            </div>
            <div className="max-w-3xl">
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.15] tracking-[-0.02em] text-foreground mb-10">
                Two doors. Pick yours.
              </h3>

              <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
                <a
                  href="mailto:lorenzo@perpetualcore.com?subject=DeepFutures%20%E2%80%94%20founder%20intro"
                  className="bg-card p-6 sm:p-8 hover:bg-surface-hover transition-colors"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                    For founders
                  </p>
                  <p className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-2">
                    Get an introduction →
                  </p>
                  <p className="text-sm text-muted-foreground leading-[1.6]">
                    Short paragraph on what you&apos;re building. We respond within a week.
                  </p>
                </a>
                <a
                  href="mailto:lorenzo@perpetualcore.com?subject=DeepFutures%20%E2%80%94%20LP%20inquiry"
                  className="bg-card p-6 sm:p-8 hover:bg-surface-hover transition-colors"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary mb-3">
                    For LPs
                  </p>
                  <p className="text-lg font-semibold tracking-[-0.01em] text-foreground mb-2">
                    Inquire about the fund →
                  </p>
                  <p className="text-sm text-muted-foreground leading-[1.6]">
                    LP materials available under NDA. Open to discussions.
                  </p>
                </a>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-start gap-5">
                <Button
                  asChild
                  className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]"
                >
                  <Link href="/">
                    Back to Perpetual Core <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Link
                  href="/engine"
                  className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2"
                >
                  How the Engine works <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
