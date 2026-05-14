/**
 * /products/platform — the AI OS for individuals and small teams.
 * Visual register matches homepage v6. Pricing teaser links to /pricing.
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Platform — Perpetual Core",
  description:
    "AI OS for individuals and small teams. 11 models, persistent memory, AI executive advisors. Free / $49 Starter / $99 Pro. The on-ramp before retainers and engagements.",
};

const PILLARS = [
  {
    name: "Eleven models, one workspace.",
    body: "GPT-4o, Claude, Gemini, DeepSeek, o1 and six more — auto-routed by task type. You don't pick the model; the platform picks the right one for the job and gets out of your way.",
  },
  {
    name: "Persistent memory.",
    body: "Conversations, documents, decisions — all retained across sessions. The platform remembers what you told it last week, last month, last quarter. No re-explaining yourself every morning.",
  },
  {
    name: "AI executive advisors.",
    body: "Pre-built advisor roles — strategy, finance, ops, legal, growth — that operate over your context. Not a generic chatbot; a panel of specialists that know your work.",
  },
  {
    name: "Document RAG and voice.",
    body: "Upload contracts, board decks, voice notes, transcripts. Query across them. Voice in, voice out. The platform reads what you read and hears what you hear.",
  },
];

const ADVISORS = [
  { role: "Chief Strategy", body: "Stress-tests positioning, prioritization, and bets." },
  { role: "Chief Financial", body: "Reads your numbers and tells you what they mean." },
  { role: "Chief Operating", body: "Surfaces the operational gaps you've stopped seeing." },
  { role: "Chief Legal", body: "First-pass review on contracts, policies, and risk." },
  { role: "Chief Marketing", body: "Voice-consistent draft copy across channels." },
  { role: "Chief of Staff", body: "Calendar, agenda prep, follow-ups, weekly review." },
];

const TIMELINE = [
  { when: "Day 1", title: "Sign in. Pick a model. Start working.", body: "No setup wizard. The platform routes your first prompt to the right model and starts a conversation that will outlast the session." },
  { when: "Week 1", title: "Your context is loaded.", body: "Upload your top 20 documents. Connect Gmail, Calendar, WhatsApp. The advisors stop guessing — they're operating on your real material." },
  { when: "Month 1", title: "The platform knows your work.", body: "You stop re-explaining yourself. The advisors reference last week's decisions in this week's conversations. Memory compounds." },
  { when: "Month 3", title: "The platform finishes your sentences.", body: "Drafting moves from 'starting from scratch' to 'editing the platform's first pass.' That's the inflection. Most users hit it in week 8 to 10." },
];

const PRICING_TIERS = [
  { name: "Free", price: "$0", cadence: null, body: "1 user, 5,000 messages/mo, open-weight models, no document upload." },
  { name: "Starter", price: "$49", cadence: "/month", body: "1 user, all 11 models, 50,000 messages/mo, document RAG, basic advisors.", featured: true },
  { name: "Pro", price: "$99", cadence: "/month", body: "1 user, unlimited messages, full advisor panel, voice in/out, integrations (Gmail, Calendar, WhatsApp)." },
];

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div>
      <p className="eyebrow mb-3">§ {index}</p>
      <h2 className="text-xs uppercase tracking-[0.18em] font-mono text-foreground">{label}</h2>
    </div>
  );
}

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="max-w-5xl">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden className="block h-1.5 w-1.5 rounded-full bg-status-live animate-pulse-dot" />
            <p className="eyebrow !text-foreground/70">§ 02 · Products · Platform — Live</p>
          </div>

          <h1 className="display-hero text-[40px] sm:text-[56px] lg:text-[80px] text-foreground mb-12 max-w-5xl leading-[1.05]">
            AI OS for individuals and{" "}
            <span className="italic text-foreground/85">small teams.</span>
          </h1>

          <div className="space-y-5 text-lg sm:text-xl text-muted-foreground leading-[1.55] mb-12 max-w-3xl">
            <p>11 models. Persistent memory. AI executive advisors. One workspace.</p>
            <p>
              Platform is the on-ramp before retainers and engagements — for solo operators and
              5-to-50-person teams who want production-grade AI without the engagement floor.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button size="lg" asChild className="text-sm font-medium px-7 h-11 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
              <Link href="/auth/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Link href="#pricing" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-3 border-b border-foreground/20 hover:border-primary">
              See pricing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Four pillars */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="01" label="What's in the box" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Four things that make the Platform feel different from a chat window.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {PILLARS.map((p, i) => (
                <div key={p.name} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-x-6 sm:gap-x-10 py-7 border-b border-border">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold tracking-[-0.01em] text-foreground mb-3">
                      {p.name}
                    </h4>
                    <p className="text-base text-muted-foreground leading-[1.7]">{p.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Advisor panel */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="02" label="The advisor panel" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Six AI executive advisors, operating over your context.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Each advisor is a specialist with a role — and access to the same memory and
                documents. Ask the CFO advisor about runway and the COO advisor about hiring; they
                read each other&apos;s notes.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {ADVISORS.map((a, i) => (
              <div key={a.role} className={`p-6 sm:p-7 flex flex-col ${i >= 3 ? "lg:border-t" : ""} border-border`}>
                <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground mb-10">
                  0{i + 1}
                </span>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {a.role}
                </h4>
                <p className="text-base text-muted-foreground leading-[1.6]">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="03" label="Watch it learn" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground">
                Day 1 to Month 3: how the Platform compounds.
              </h3>
            </div>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <div />
            <div className="max-w-3xl border-t border-border">
              {TIMELINE.map((row, i) => (
                <div key={row.when} className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_180px_1fr] gap-x-6 sm:gap-x-10 py-8 border-b border-border items-baseline">
                  <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground pt-1">
                    0{i + 1}
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary mb-1">
                      {row.when}
                    </p>
                    <h4 className="text-base font-semibold tracking-tight text-foreground">
                      {row.title}
                    </h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-[1.65] col-span-2 sm:col-auto">
                    {row.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-24 sm:py-32">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 mb-12">
            <SectionRail index="04" label="Pricing" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Free / $49 / $99.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7]">
                Platform sits at the bottom of the studio&apos;s 3-band spectrum. Outgrow it and
                the next door is a <Link href="/studio/retainers" className="text-foreground underline underline-offset-4 hover:text-primary">retainer</Link> or
                a <Link href="/studio/engagements" className="text-foreground underline underline-offset-4 hover:text-primary">full engagement</Link>.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 border border-border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border">
            {PRICING_TIERS.map((tier, i) => (
              <div key={tier.name} className="p-6 sm:p-7 flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground">
                    0{i + 1}
                  </span>
                  {tier.featured && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
                      Most common
                    </span>
                  )}
                </div>
                <h4 className="text-[11px] font-mono uppercase tracking-[0.22em] text-primary mb-3">
                  {tier.name}
                </h4>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-semibold tracking-[-0.025em] text-foreground">
                    {tier.price}
                  </span>
                  {tier.cadence && (
                    <span className="text-sm text-muted-foreground font-mono">{tier.cadence}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-[1.65] flex-1 mb-6">{tier.body}</p>
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center text-xs font-medium text-foreground hover:text-primary transition-colors mt-auto"
                >
                  Start with {tier.name} <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outgrow it */}
      <section className="border-t border-border py-24 sm:py-32 bg-surface-hover/40">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Outgrow it" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                When Platform isn&apos;t enough, the next band is right here.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                If your work outgrows self-serve, you don&apos;t need to leave Perpetual Core. The
                studio runs retainers ($5K–$15K/mo productized programs) and engagements
                ($75K–$250K+ full installs) for orgs that need more than a workspace.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/studio/retainers">See Retainers <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
                </Button>
                <Link href="/studio/engagements" className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
                  See Engagements <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
