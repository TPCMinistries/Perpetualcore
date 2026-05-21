/**
 * /compare/vs-claude-for-teams — head-to-head with Anthropic's Claude for Teams
 * ($30/user/month). Long-tail SEO target for "claude for teams alternative"
 * and "perpetual core vs claude" queries. Visual register matches /compare.
 * JSON-LD: BreadcrumbList + FAQPage.
 */

import Link from "next/link";
import { ArrowRight, Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";

export const metadata = {
  title: "Perpetual Core vs Claude for Teams — honest comparison",
  description:
    "Claude for Teams is $30/user/month for Anthropic's models + Projects. Perpetual Core is $99/month for multi-model routing (Claude included), persistent org memory, 15 industry advisors, calendar/email integration, and an install path. Here's when each makes sense.",
};

type Row = {
  feature: string;
  pc: "yes" | "no" | "partial";
  competitor: "yes" | "no" | "partial";
  note?: string;
};

const ROWS: Row[] = [
  {
    feature: "Claude Sonnet 4.5 access (1M context)",
    pc: "yes",
    competitor: "yes",
    note: "Both ship Claude. PC also routes to GPT-4o, Gemini, and others based on task type.",
  },
  {
    feature: "Multi-model routing (Claude + GPT-4o + Gemini)",
    pc: "yes",
    competitor: "no",
    note: "Claude for Teams is locked to Anthropic models. PC picks the best model per query.",
  },
  {
    feature: "Persistent organizational memory (cross-user, cross-session)",
    pc: "yes",
    competitor: "partial",
    note: "Claude Projects share context within a project, but no org-wide memory layer.",
  },
  {
    feature: "15 industry-specific AI advisors pre-built",
    pc: "yes",
    competitor: "no",
    note: "PC ships legal, ops, HR, fundraising, clinical advisors out-of-box. Claude requires you to build each Project.",
  },
  {
    feature: "Long-context window for analysis",
    pc: "yes",
    competitor: "yes",
    note: "Claude excels here. PC routes long-context tasks to Claude automatically.",
  },
  {
    feature: "Gmail + Google Calendar integration",
    pc: "yes",
    competitor: "no",
    note: "Claude for Teams has no native calendar/email connectors yet.",
  },
  {
    feature: "Document RAG on full corpus (pgvector)",
    pc: "yes",
    competitor: "partial",
    note: "Claude Projects ingest documents, but PC indexes your whole corpus with vector search.",
  },
  {
    feature: "BYOK (route through your Anthropic API key)",
    pc: "yes",
    competitor: "no",
    note: "On PC Pro tier you can route through your existing enterprise Anthropic contract.",
  },
  {
    feature: "Production engagement option ($75K+ install)",
    pc: "yes",
    competitor: "no",
    note: "PC offers Atlas Discovery ($5K-$15K) → full engagement. Claude is self-serve only.",
  },
  {
    feature: "10–15% of revenue funds nonprofit mission work",
    pc: "yes",
    competitor: "no",
    note: "PC partially funds the Institute for Human Advancement with every dollar.",
  },
  {
    feature: "501(c)(3) nonprofit discount",
    pc: "yes",
    competitor: "no",
    note: "PC ships 30% off Vellum for verified 501(c)(3)s. Anthropic has no public nonprofit program.",
  },
  {
    feature: "SOC 2 / SSO / SAML on team tier",
    pc: "yes",
    competitor: "yes",
  },
];

const FAQ = [
  {
    question: "We love Claude. Why would we use anything else?",
    answer:
      "You don't have to leave Claude — PC routes to Claude Sonnet 4.5 automatically, so you keep using the model you love. What PC adds: multi-model routing for non-Claude-optimal tasks (vision, web search, spreadsheet), persistent organizational memory across all users, pre-built industry advisors, and Gmail/Calendar integration. Think of PC as the operating system; Claude is one of the models inside.",
  },
  {
    question: "What about Claude's long-context window — that's their killer feature.",
    answer:
      "Agreed, and PC uses it. When you ask a long-context question on PC (analyze this 500-page contract, summarize this codebase), the router sends it to Claude. You get the long-context advantage without locking yourself to a single-model interface. For shorter or vision tasks, PC routes to GPT-4o; for spreadsheet work, often Gemini. Best model per task, automatically.",
  },
  {
    question: "Can I migrate my Claude Projects to Perpetual Core?",
    answer:
      "Yes. Export your Claude Project system prompts and the documents you've uploaded. Paste the system prompts into PC's advisor builder, re-upload the corpus, and PC's pgvector index handles the rest. The migration usually takes under an hour for a small handful of Projects.",
  },
  {
    question: "Why not just use Claude API + ChatGPT API directly?",
    answer:
      "You can — many engineering teams do exactly this. PC is for orgs that want a turnkey operating layer without DIY-ing the router, the document index, the org memory, the advisors, the audit log, the BAA, and the team-facing UI. If your team has engineers willing to build that, you don't need us. If not, PC saves you 3-6 months of internal tooling work.",
  },
  {
    question: "How does Claude for Teams pricing compare for a 10-person team?",
    answer:
      "Claude for Teams: 10 users × $30/mo = $300/mo. PC Teams pricing is custom (typically $150-$300/mo for 10 seats). Comparable headline cost — but PC gives you GPT-4o + Gemini on top of Claude, plus the advisor library, plus calendar/email, plus the install-engagement path. If you only need Claude, stay on Claude for Teams. If you want one operating layer, PC.",
  },
];

function CellIcon({ v }: { v: Row["pc"] }) {
  if (v === "yes") return <Check className="h-4 w-4 text-emerald-600 mx-auto" />;
  if (v === "partial") return <Minus className="h-4 w-4 text-amber-500 mx-auto" />;
  return <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />;
}

function SectionRail({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-baseline gap-3 text-muted-foreground">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{index}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.22em]">{label}</span>
    </div>
  );
}

export default function VsClaudeForTeamsPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
            { name: "vs Claude for Teams", path: "/compare/vs-claude-for-teams" },
          ]),
          faqSchema(FAQ),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="vs Claude for Teams" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              We use Claude too.<br />
              We just don&apos;t stop there.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              Claude for Teams is $30/user/month for Anthropic&apos;s models + Projects.
              Perpetual Core is $99/month — and Claude is one of the models inside.
              We add multi-model routing, shared org memory, 15 industry advisors,
              Gmail/Calendar integration, and the option to install AI workflows
              that move real metrics. Here&apos;s when each makes sense.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-t border-border py-16 sm:py-20">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="01" label="Feature matrix" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground py-4 pr-4">
                      Capability
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground py-4 px-3 text-center">
                      Perpetual Core
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground py-4 px-3 text-center">
                      Claude for Teams
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.feature} className="border-b border-border/60">
                      <td className="py-4 pr-4 text-foreground">
                        {row.feature}
                        {row.note && (
                          <p className="mt-1 text-xs text-muted-foreground leading-snug">
                            {row.note}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-3 text-center bg-foreground/[0.02]">
                        <CellIcon v={row.pc} />
                      </td>
                      <td className="py-4 px-3 text-center">
                        <CellIcon v={row.competitor} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-wrap gap-4 mt-6 text-xs text-muted-foreground font-mono uppercase tracking-[0.18em]">
                <span className="inline-flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" /> Yes
                </span>
                <span className="inline-flex items-center gap-2">
                  <Minus className="h-3.5 w-3.5 text-amber-500" /> Partial
                </span>
                <span className="inline-flex items-center gap-2">
                  <X className="h-3.5 w-3.5 text-muted-foreground/50" /> Not really
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* When to use what */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="02" label="When to use what" />
            <div className="max-w-3xl space-y-8">
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Stay on Claude for Teams if…
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  Your team uses AI primarily for long-context analysis, you&apos;re
                  happy with Anthropic&apos;s models specifically, you don&apos;t need
                  Gmail/Calendar integration, and your team can build Claude Projects
                  to organize context. Claude is the best long-context model on the
                  market right now — if that&apos;s 90% of your AI work, you&apos;re fine.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Add or switch to Perpetual Core if…
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  You want Claude AND GPT-4o AND Gemini routed by task — Claude for
                  long-context, GPT-4o for vision, Gemini for spreadsheet work. Plus
                  the persistent org memory layer, the 15 pre-built industry advisors,
                  Gmail/Calendar connectors, and the option to install AI workflows
                  ($75K+ engagement) that Anthropic doesn&apos;t offer.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Run both, honestly.
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  Many of our customers keep Claude for Teams for deep analytical work
                  and add Perpetual Core as the persistent organizational layer. Pro
                  tier is $99/month with BYOK — bring your existing Anthropic API key
                  and route through your enterprise contract.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="03" label="Common questions" />
            <div className="max-w-3xl">
              <dl className="divide-y divide-border border-y border-border">
                {FAQ.map((item) => (
                  <details key={item.question} className="group py-6">
                    <summary className="flex cursor-pointer items-start justify-between gap-6 list-none">
                      <dt className="text-base sm:text-lg font-medium text-foreground leading-snug">
                        {item.question}
                      </dt>
                      <span
                        className="font-mono text-xs text-muted-foreground mt-1 transition-transform group-open:rotate-45"
                        aria-hidden
                      >
                        +
                      </span>
                    </summary>
                    <dd className="mt-4 text-sm sm:text-base text-muted-foreground leading-[1.7]">
                      {item.answer}
                    </dd>
                  </details>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="—" label="Try it" />
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground mb-6">
                Free tier is permanent. Pro is $99/month.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                1 user, basic chat, 100 sources on Free. No card required. Upgrade
                to Pro any time. Cancel any month. Or compare against{" "}
                <Link href="/compare/vs-chatgpt-teams" className="underline underline-offset-4">
                  ChatGPT Teams
                </Link>{" "}
                or{" "}
                <Link href="/compare/vs-microsoft-copilot" className="underline underline-offset-4">
                  Microsoft Copilot
                </Link>
                .
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="text-sm font-medium h-10 px-5 shadow-none bg-foreground text-background hover:bg-foreground/90 rounded-[6px]">
                  <Link href="/signup?plan=free">
                    Start free <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="text-sm font-medium h-10 px-5 shadow-none rounded-[6px]">
                  <Link href="/pricing">See pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
