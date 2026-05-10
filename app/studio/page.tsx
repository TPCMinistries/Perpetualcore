/**
 * /studio — studio overview.
 *
 * Per COPY_STUDIO.md Page 1 + UI audit §7: composed from existing
 * primitives (Navbar, Footer, Card, Button) — no new visual system.
 *
 * Section composition:
 *   1. Hero (text-only, left-aligned, mono-violet)
 *   2. Who we serve — 5-card grid (operators-who-carry-weight)
 *   3. Methodology teaser — Learn → Wire → Automate → Scale
 *   4. Final CTA (limited engagements per quarter)
 *
 * Sharpening levers from UI audit §5: font-semibold not font-black,
 * gradient text capped to H1 only, mono-violet icon family, py-32
 * boundaries on text-led sections, max-w-3xl prose columns.
 */

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  HandCoins,
  Building2,
  Stethoscope,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Studio — Perpetual Core",
  description:
    "An AI-first studio for organizations the joint ventures won't serve. We install operating systems for mission-driven organizations. Engagements start at $75,000.",
};

const BUYERS = [
  {
    icon: Briefcase,
    title: "Mission-driven CEOs and EDs.",
    body: "Running $5M to $50M organizations. Already past the consultant-deck stage. Want a system, not a recommendation.",
  },
  {
    icon: HandCoins,
    title: "Foundation program officers.",
    body: 'Sourcing AI implementation partners for grantee portfolios. Need vendors who can clear "mission alignment, equity focus, sustainability beyond the grant period" — the screen most AI shops don\'t pass.',
  },
  {
    icon: Building2,
    title: "PE Operating Partners (fund-backed).",
    body: "Running portcos that need an AI-native COO before the next quarter's board meeting. Atlas is for you — by introduction only.",
  },
  {
    icon: Stethoscope,
    title: "COOs of regional health systems.",
    body: "Working under HIPAA, state-level data-sovereignty rules, and budget envelopes the JV tier ignores.",
  },
  {
    icon: Rocket,
    title: "Mission-aligned founders building toward acquisition.",
    body: "You want the operating system installed before the diligence team shows up.",
  },
];

const PHASES = [
  {
    title: "Learn.",
    body: "Two weeks. We sit in your meetings, watch your handoffs, and find the operational gaps your team has stopped seeing because they live with them.",
  },
  {
    title: "Wire.",
    body: "Three to four weeks. We install the eight registries in your stack — Supabase, storage, auth. The substrate is in place.",
  },
  {
    title: "Automate.",
    body: "Six to ten weeks. We build skills against your real workflows — Anthropic SKILL.md format, per-portco JSON, versioned and auditable.",
  },
  {
    title: "Scale.",
    body: "Two to four weeks. Your team operates and extends the system. We document. We train. We hand over. You own it.",
  },
];

export default function StudioOverviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 1. Hero — text-only, left-aligned */}
      <section className="container mx-auto px-4 pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            The studio.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            An AI-first studio for organizations the{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              joint ventures won&apos;t serve
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            Foundations. Faith institutions. Community colleges. Regional health systems. UN-aligned humanitarian agencies. The mid-market mission-driven tier — $500K to $50M in revenue — that the Anthropic-Blackstone and OpenAI-TPG ventures explicitly exclude.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            We&apos;re a small team that installs production AI systems under regulatory regimes most shops have never seen — PEPFAR data sovereignty, IRB review, GDPR-equivalent consent, offline-first connectivity. The constraints are the credential. If your shop has never deployed in a parish network in East Africa or a community-college student-services office, this isn&apos;t your engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/process">How we work</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Who we serve — 5-card grid */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Who comes to us.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Operators who carry weight.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We work with a narrow band of buyers, intentionally.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {BUYERS.map((buyer) => {
            const Icon = buyer.icon;
            return (
              <Card
                key={buyer.title}
                className="border-border/60 hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-7 flex flex-col h-full">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-3">{buyer.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {buyer.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Button asChild>
          <Link href="/studio/engagements">
            See engagements <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* 3. Methodology teaser */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The framework.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            AI-First Framework: Learn &rarr; Wire &rarr; Automate &rarr; Scale.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A four-phase engagement that audits your operations, installs the Perpetual Engine across your departments, and hands you a system your team owns. We document it. We train your operators. We leave.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-8 max-w-5xl mb-12">
          {PHASES.map((phase, i) => (
            <div key={phase.title} className="flex gap-5">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{i + 1}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{phase.title}</h3>
                <p className="text-base text-muted-foreground leading-relaxed">{phase.body}</p>
              </div>
            </div>
          ))}
        </div>

        <Button asChild>
          <Link href="/studio/methodology">
            Read the methodology <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* 4. Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Ready when you are.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            We take a limited number of engagements per quarter.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Engagements start at $75,000. Retainer $5,000–$15,000/month, scoped to engagement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                Start an engagement <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/about">Talk to the founder</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
