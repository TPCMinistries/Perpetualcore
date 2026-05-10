/**
 * /products/platform — the AI OS for individuals and small teams.
 *
 * Per Session 2 build brief Step 6 + UI audit §3: this is where the
 * platform-product content lives. The studio repositioning moves it
 * off `/`. Hero is text-only; pricing teaser at the bottom links to
 * /pricing.
 *
 * Per BRIEF_RECONCILED A5:
 *   - "Built for Everyone" personas grid: NOT included (deleted entirely).
 *   - "Stop juggling tools" CTA: NOT included.
 *
 * The original homepage React components (HeroSection, BentoFeatures,
 * InteractiveChatDemo, ComparisonTable, ExecSuiteShowcase, UseCases,
 * "Watch It Learn" timeline, etc.) referenced in UI_AUDIT no longer
 * exist on disk — the homepage was rewritten in Session 1 commit
 * 004b867 with -1297 lines. The content those components carried is
 * recomposed here from primitives in the studio-frame visual register
 * (font-semibold, mono-violet, max-w-3xl prose columns, no orbs).
 *
 * Sections (mapped from UI_AUDIT.md §3):
 *   1. Hero — text-only platform value prop
 *   2. Eleven models, one workspace (BentoFeatures replacement — 4-pillar)
 *   3. Persistent memory + AI executive advisors (ExecSuiteShowcase replacement)
 *   4. Day 1 → Month 3 timeline ("Watch It Learn" replacement)
 *   5. Built for every industry (UseCases replacement — quiet list)
 *   6. Pricing teaser → /pricing
 */

import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Cpu,
  Workflow,
  Sparkles,
  Calendar,
  Mail,
  MessageSquare,
  Target,
  ShieldCheck,
  GraduationCap,
  Stethoscope,
  Building2,
  Briefcase,
  Scale,
  HandCoins,
  Heart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Platform — Perpetual Core",
  description:
    "AI OS for individuals and small teams. 11 models, persistent memory, AI executive advisors. Free / $49 Starter / $99 Pro.",
};

const PILLARS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Cpu,
    title: "Eleven models, one workspace.",
    body: "GPT-4o, Claude, Gemini, DeepSeek, o1 and six more — auto-routed by task type. You don't pick the model; the platform picks the right one for the job and gets out of your way.",
  },
  {
    icon: Brain,
    title: "Persistent memory.",
    body: "Conversations, documents, decisions — all retained across sessions. The platform remembers what you told it last week, last month, last quarter. No re-explaining yourself every morning.",
  },
  {
    icon: Workflow,
    title: "AI executive advisors.",
    body: "Pre-built advisor roles — strategy, finance, ops, legal, growth — that operate over your context. Not a generic chatbot; a panel of specialists that know your work.",
  },
  {
    icon: Sparkles,
    title: "Document RAG and voice.",
    body: "Upload contracts, board decks, voice notes, transcripts. Query across them. Voice in, voice out. The platform reads what you read and hears what you hear.",
  },
];

const ADVISORS: { icon: LucideIcon; role: string; body: string }[] = [
  { icon: Target, role: "Chief Strategy", body: "Stress-tests positioning, prioritization, and bets." },
  { icon: HandCoins, role: "Chief Financial", body: "Reads your numbers and tells you what they mean." },
  { icon: Workflow, role: "Chief Operating", body: "Surfaces the operational gaps you've stopped seeing." },
  { icon: Scale, role: "Chief Legal", body: "First-pass review on contracts, policies, and risk." },
  { icon: Briefcase, role: "Chief Marketing", body: "Voice-consistent draft copy across channels." },
  { icon: Calendar, role: "Chief of Staff", body: "Calendar, agenda prep, follow-ups, weekly review." },
];

const TIMELINE = [
  {
    when: "Day 1",
    title: "Sign in. Pick a model. Start working.",
    body: "No setup wizard. The platform routes your first prompt to the right model and starts a conversation that will outlast the session.",
  },
  {
    when: "Week 1",
    title: "Your context is loaded.",
    body: "Upload your top 20 documents. Connect Gmail, Calendar, WhatsApp. The advisors stop guessing — they're operating on your real material.",
  },
  {
    when: "Month 1",
    title: "The platform knows your work.",
    body: "You stop re-explaining yourself. The advisors reference last week's decisions in this week's conversations. Memory compounds.",
  },
  {
    when: "Month 3",
    title: "The platform finishes your sentences.",
    body: "Drafting moves from 'starting from scratch' to 'editing the platform's first pass.' That's the inflection. Most users hit it in week 8 to 10.",
  },
];

const INDUSTRIES = [
  { icon: Stethoscope, label: "Healthcare" },
  { icon: GraduationCap, label: "Education" },
  { icon: Heart, label: "Non-profits" },
  { icon: Building2, label: "Faith institutions" },
  { icon: Scale, label: "Law firms" },
  { icon: HandCoins, label: "Accounting" },
  { icon: Briefcase, label: "Consulting" },
  { icon: Target, label: "Sales teams" },
  { icon: MessageSquare, label: "Creative agencies" },
  { icon: Mail, label: "Real estate" },
  { icon: ShieldCheck, label: "IT services" },
  { icon: Workflow, label: "Financial advisors" },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    body: "1 user, 5,000 messages/mo, the open-weight models, no document upload.",
    featured: false,
  },
  {
    name: "Starter",
    price: "$49",
    cadence: "/month",
    body: "1 user, all 11 models, 50,000 messages/mo, document RAG, basic advisors.",
    featured: true,
  },
  {
    name: "Pro",
    price: "$99",
    cadence: "/month",
    body: "1 user, unlimited messages, full advisor panel, voice in/out, integrations (Gmail, Calendar, WhatsApp).",
    featured: false,
  },
];

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* 1. Hero — text-only, platform value prop */}
      <section className="container mx-auto px-4 pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-6">
            The Platform.
          </p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight leading-[1.1] mb-8">
            AI OS for{" "}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              individuals and small teams
            </span>
            .
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed mb-6">
            11 models. Persistent memory. AI executive advisors. One workspace.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Platform is the on-ramp, not the destination — for solo operators and 5-to-50-person teams who want production-grade AI without the engagement floor. If your operation needs an installed system, that&apos;s an engagement. If you want a workspace that gets to know you, that&apos;s the Platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/pricing">
                See pricing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/auth/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Four pillars */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            What&apos;s in the box.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Four things that make the Platform feel different from a chat window.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card
                key={pillar.title}
                className="border-border/60 hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-7">
                  <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-3">{pillar.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{pillar.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 3. AI executive advisors */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The advisor panel.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Six AI executive advisors, operating over your context.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Each advisor is a specialist with a role — and access to the same memory and documents. Ask the CFO advisor about runway and the COO advisor about hiring; they read each other&apos;s notes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ADVISORS.map((advisor) => {
            const Icon = advisor.icon;
            return (
              <Card key={advisor.role} className="border-border/60">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{advisor.role}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{advisor.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 4. Day 1 → Month 3 timeline */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Watch it learn.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight">
            Day 1 to Month 3: how the Platform compounds.
          </h2>
        </div>

        <div className="max-w-5xl">
          {TIMELINE.map((row, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div
                key={row.when}
                className="grid md:grid-cols-2 gap-6 md:gap-12 py-10 border-b border-border/40 last:border-b-0"
              >
                <div className={`${isLeft ? "md:order-1" : "md:order-2"}`}>
                  <p className="text-sm font-medium text-primary tracking-wide mb-2">{row.when}</p>
                  <h3 className="text-2xl font-semibold tracking-tight">{row.title}</h3>
                </div>
                <div className={`${isLeft ? "md:order-2" : "md:order-1"} flex items-center`}>
                  <p className="text-base text-muted-foreground leading-relaxed">{row.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Built for every industry */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            The buyers.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Built for every industry the studio installs in.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The Platform is the on-ramp for the same buyer the studio serves at the engagement tier — just at the workspace scale instead of the org scale.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {INDUSTRIES.map((industry) => {
            const Icon = industry.icon;
            return (
              <div
                key={industry.label}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/60 bg-muted/20"
              >
                <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{industry.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Pricing teaser */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl mb-14">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Pricing.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Free / $49 Starter / $99 Pro.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Below the engagement floor. The Platform is the on-ramp for buyers who want production AI without a $75K install.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`flex flex-col ${tier.featured ? "border-primary/60" : "border-border/60"}`}
            >
              <CardContent className="p-7 flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
                <div className="mb-5 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{tier.price}</span>
                  {tier.cadence && (
                    <span className="text-sm text-muted-foreground">{tier.cadence}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tier.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild>
            <Link href="/pricing">
              See full pricing <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/signup">Start free</Link>
          </Button>
        </div>
      </section>

      {/* Final CTA — point platform users back to the studio */}
      <section className="container mx-auto px-4 py-32 border-t border-border/40">
        <div className="max-w-3xl">
          <p className="text-sm italic text-muted-foreground tracking-wide mb-4">
            Beyond the workspace.
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight leading-tight mb-6">
            Need this installed across an organization, not a workspace?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            The Platform is the on-ramp. The engagement is the install. If you&apos;re running a $5M to $50M mission-driven org and want the operating system in your Supabase, that&apos;s a different conversation. Engagements start at $75,000.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" asChild className="text-base px-7">
              <Link href="/studio/engagements">
                See engagements <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-7">
              <Link href="/products">See the full portfolio</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
