/**
 * /studio/engagements — engagement detail page.
 *
 * Per COPY_STUDIO.md (Engagements section) and UI audit §7 (reuse
 * /consulting layout as scaffold; replace copy). Three engagement
 * bands ($75K floor, $150K, $250K+), retainer band, what's included
 * block, intake CTA. Exact pricing strings preserved.
 *
 * Replaces /consulting (which 301-redirects here per next.config.mjs).
 */

import Link from "next/link";
import { ArrowRight, Database, Sparkles, FileText, GraduationCap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Engagements — Perpetual Core",
  description:
    "Engagements start at $75,000. A 90 to 180 day engagement that audits your operations, installs the Perpetual Engine, and hands you a system your team owns.",
};

const BANDS = [
  {
    name: "Foundations engagement",
    price: "$75,000",
    duration: "90 days · Single department",
    body: "Eight-registry install scoped to one operational surface (e.g., intake + case management for a workforce program; or grants + reporting for a foundation; or a single clinical workflow for a health system).",
    featured: true,
  },
  {
    name: "Operations engagement",
    price: "$150,000",
    duration: "120–150 days · Cross-department",
    body: "Eight-registry install across three to five departments. AI-First Framework applied end-to-end. Skills library populated with 15 to 30 production skills.",
    featured: false,
  },
  {
    name: "Institutional engagement",
    price: "$250,000+",
    duration: "180 days · Whole-org",
    body: "Engine installed at the operating-system layer. Custom skills, multi-tenant configuration, training cohort for your operators. Includes 90 days of post-handover support.",
    featured: false,
  },
];

const ARC = [
  {
    week: "Week 1–2",
    title: "Intake and audit",
    body: "We show up, ask questions, sit in meetings. You get a written audit at the end of week 2 — what we found, what we'd install first, what we'd leave alone. If the audit doesn't land, you don't proceed. No retainer claimed.",
  },
  {
    week: "Week 3–6",
    title: "Registry install",
    body: "The eight registries go into your Supabase. Your operators are already querying live data by week 5.",
  },
  {
    week: "Week 7–14",
    title: "Skills build",
    body: "We build production skills against the workflows the audit identified. You see weekly demos. You can pull the plug at any phase boundary.",
  },
  {
    week: "Week 15–20",
    title: "Training and handover",
    body: "Your team operates the system in production. We sit in. We coach. We answer questions. The skills library has 15 to 30 working units by handover.",
  },
  {
    week: "Week 21–24",
    title: "Post-handover",
    body: "We're available, not embedded. Your team runs the system. We show up for the questions that don't have obvious answers.",
  },
  {
    week: "Month 7+",
    title: "Retainer (optional)",
    body: "$5,000–$15,000/month, scoped to engagement. We stay close on what you build next. Or we don't. Your call.",
  },
];

const INCLUDED = [
  { icon: Database, label: "The eight registries", detail: "installed in your Supabase: entities, people, projects, work items, knowledge, agents, workflows, events." },
  { icon: Sparkles, label: "The AI-First Framework", detail: "applied to your real workflows." },
  { icon: FileText, label: "A compounding skills library", detail: "in the Anthropic SKILL.md format, with per-portco JSON config." },
  { icon: FileText, label: "Documentation", detail: "written for your operators, not for us." },
  { icon: GraduationCap, label: "Training", detail: "in-person or remote, for the team that has to keep this running." },
  { icon: Heart, label: "The Perpetual Engine commitment", detail: "10% of every engagement — $7,500 to $25,000+ per client — funds the Institute for Human Advancement." },
];

export default function StudioEngagementsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-20 sm:pt-32">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">Engagements.</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Engagements start at $75,000.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            A 90 to 180 day engagement that audits your operations, installs the Perpetual Engine across your departments, and hands you a system your team owns.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Three engagement bands, depending on the surface area you need installed. Each ends the same way: documented, trained, handed over. No SOW extensions to keep the lights on. No vendor lock-in. The Engine is yours after we leave.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/contact-sales">
                Book an intake call <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/studio/methodology">Read the methodology</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Three engagement bands */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">Pricing.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Three bands. Pick the one your operations need.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {BANDS.map((band) => (
            <Card
              key={band.name}
              className={`flex flex-col ${band.featured ? "border-primary/60" : "border-border/60"}`}
            >
              <CardContent className="p-7 flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-1">{band.name}</h3>
                  <p className="text-sm text-muted-foreground">{band.duration}</p>
                </div>
                <div className="mb-6">
                  <div className="text-4xl font-semibold tracking-tight mb-1">{band.price}</div>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed mb-auto">{band.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/60 bg-muted/30">
          <CardContent className="p-7">
            <h3 className="text-lg font-semibold mb-2">
              Retainer (optional, all bands): $5,000–$15,000/month, scoped to engagement.
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              For the operators who&apos;d rather we stay in the loop on what comes next. Cancellable any month. We don&apos;t need it; you might.
            </p>
          </CardContent>
        </Card>

        <div className="mt-10">
          <Button asChild>
            <Link href="/contact-sales">
              Book an intake call <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* What's included */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Every engagement.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-7 max-w-5xl">
          {INCLUDED.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex gap-4">
                <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-base leading-relaxed">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-muted-foreground">, {item.detail}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <Button variant="outline" asChild>
            <Link href="/engine">
              Read the Engine commitment <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Engagement arc — table-of-phases */}
      <section className="container mx-auto px-4 py-24 border-t border-border/40">
        <div className="max-w-3xl mb-12">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">The arc.</p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-4">
            180 days, broken honestly.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            A timeline you can show your board. We&apos;d rather you see the work than read the deck.
          </p>
        </div>

        <div className="border-t border-border/40 max-w-4xl">
          {ARC.map((phase) => (
            <div
              key={phase.week}
              className="grid md:grid-cols-[180px_1fr] gap-6 py-7 border-b border-border/40"
            >
              <div>
                <p className="text-sm font-medium text-primary tracking-wide">{phase.week}</p>
                <p className="text-base font-semibold mt-1">{phase.title}</p>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">{phase.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Engagements start at $75,000.
            </span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            We take a limited number of engagements per quarter. Intake calls are 30 minutes; we&apos;ll tell you within a week if it&apos;s a fit.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/contact-sales">
                Book an intake call <ArrowRight className="ml-2 h-4 w-4" />
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
