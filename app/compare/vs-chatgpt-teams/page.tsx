/**
 * /compare/vs-chatgpt-teams — head-to-head with ChatGPT Teams ($25/user/month).
 * Long-tail SEO target for "perpetual core vs chatgpt teams" and adjacent
 * "chatgpt teams alternative" queries. Visual register matches /compare and
 * homepage v6. JSON-LD: BreadcrumbList + FAQPage.
 */

import Link from "next/link";
import { ArrowRight, Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";

export const metadata = {
  title: "Perpetual Core vs ChatGPT Teams — honest comparison",
  description:
    "ChatGPT Teams is $25/user/month for one model + custom GPTs. Perpetual Core is $99/month for multi-model routing, persistent organizational memory, 15 industry advisors, and an install path. Here's when each makes sense.",
};

type Row = {
  feature: string;
  pc: "yes" | "no" | "partial";
  competitor: "yes" | "no" | "partial";
  note?: string;
};

const ROWS: Row[] = [
  {
    feature: "Multi-model routing (Claude + GPT-4o + Gemini)",
    pc: "yes",
    competitor: "no",
    note: "ChatGPT Teams is locked to OpenAI models. PC routes each query to the best model for the task.",
  },
  {
    feature: "Persistent organizational memory across all sessions",
    pc: "yes",
    competitor: "partial",
    note: "ChatGPT has per-conversation memory + Projects, but no org-wide shared memory layer.",
  },
  {
    feature: "15 industry-specific AI advisors",
    pc: "yes",
    competitor: "no",
    note: "PC ships pre-built advisors (legal, ops, HR, fundraising, clinical, etc). ChatGPT requires you build custom GPTs from scratch.",
  },
  {
    feature: "Custom GPTs / advisor builder",
    pc: "yes",
    competitor: "yes",
  },
  {
    feature: "Document RAG on your full corpus (pgvector)",
    pc: "yes",
    competitor: "partial",
    note: "ChatGPT custom GPTs accept ~20 docs each. PC indexes your whole document store with pgvector.",
  },
  {
    feature: "Gmail + Google Calendar integration",
    pc: "yes",
    competitor: "no",
    note: "ChatGPT Teams has no native calendar/email connectors. PC has both.",
  },
  {
    feature: "BYOK (bring your own OpenAI / Anthropic key)",
    pc: "yes",
    competitor: "no",
    note: "On PC Pro tier you can route through your existing enterprise API keys.",
  },
  {
    feature: "Production engagement option ($75K+ install)",
    pc: "yes",
    competitor: "no",
    note: "PC offers Atlas Discovery ($5K-$15K) → full engagement. ChatGPT is self-serve only.",
  },
  {
    feature: "10–15% of revenue funds nonprofit mission work",
    pc: "yes",
    competitor: "no",
    note: "Every PC dollar partially funds the Institute for Human Advancement.",
  },
  {
    feature: "501(c)(3) nonprofit discount",
    pc: "yes",
    competitor: "partial",
    note: "OpenAI has limited nonprofit programs. PC ships 30% off Vellum for verified 501(c)(3)s.",
  },
  {
    feature: "SOC 2 / SSO / SAML on team tier",
    pc: "yes",
    competitor: "yes",
  },
  {
    feature: "Self-serve pricing under $100/user/month",
    pc: "yes",
    competitor: "yes",
    note: "ChatGPT Teams: $25/user/mo (min 2 users). PC Pro: $99/mo single, Teams custom.",
  },
];

const FAQ = [
  {
    question: "We already pay for ChatGPT Teams. Why add Perpetual Core?",
    answer:
      "Keep ChatGPT for one-off prompts — many of our customers run both. PC is the persistent organizational layer: multi-model routing, shared org memory, industry advisors, and Gmail/Calendar integration. If your team uses AI for one-off questions, ChatGPT alone is fine. If you want one operating system that remembers your org and routes intelligently, that's PC.",
  },
  {
    question: "Can I migrate my custom GPTs from ChatGPT to Perpetual Core?",
    answer:
      "Yes. Export your custom GPT system prompts, paste them into PC's advisor builder, and re-upload your corpus. The advisor framework on PC supports the same patterns as custom GPTs but with multi-model routing and persistent memory across all users in your workspace.",
  },
  {
    question: "Won't we just end up with two AI tools and confused staff?",
    answer:
      "Honest answer: maybe. We recommend a 30-day pilot where one team uses PC and one keeps ChatGPT. Most customers find PC becomes the default organizational layer (where the docs, advisors, and shared memory live) and ChatGPT stays for individual chat. Some customers switch entirely. Either outcome is valid.",
  },
  {
    question: "What about GPT-4o specifically — Perpetual Core has it too?",
    answer:
      "Yes. PC routes to GPT-4o, GPT-4o Mini, Claude Sonnet 4.5, Gemini 2.5, and others — picking based on the task (reasoning, summarization, coding, vision). You get the same models you'd get on ChatGPT Teams, plus Claude and Gemini, plus the routing layer that picks the right one. You can also BYOK your OpenAI API key on Pro tier and route through your existing enterprise contract.",
  },
  {
    question: "How does pricing actually compare for a 10-person team?",
    answer:
      "ChatGPT Teams: 10 users × $25/mo = $250/mo. PC Teams pricing is custom (typically $150-$300/mo for 10 seats depending on usage). You're not always cheaper on PC — but you get multi-model routing, the advisor library, calendar/email connectors, and the install-engagement option that ChatGPT doesn't offer.",
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

export default function VsChatGPTTeamsPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
            { name: "vs ChatGPT Teams", path: "/compare/vs-chatgpt-teams" },
          ]),
          faqSchema(FAQ),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="vs ChatGPT Teams" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              ChatGPT is one model.<br />
              We route across all of them.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              ChatGPT Teams is $25/user/month for OpenAI&apos;s models + custom GPTs.
              Perpetual Core is $99/month for multi-model routing (Claude + GPT-4o +
              Gemini), shared organizational memory, 15 industry advisors, and the
              option to install AI workflows that move real metrics. Here&apos;s when
              each makes sense.
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
                      ChatGPT Teams
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
                  Stay on ChatGPT Teams if…
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  Your team uses AI primarily for individual one-off prompts, you&apos;re
                  happy with OpenAI&apos;s models specifically, you don&apos;t need
                  calendar/email integration, and your document corpus fits within
                  custom GPTs&apos; per-GPT file limits. It&apos;s a great single-model chat
                  product and we&apos;re not trying to talk you out of it.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Add or switch to Perpetual Core if…
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  You want one operating layer your whole team shares — with multi-model
                  routing (so Claude handles long-context, GPT-4o handles vision, Gemini
                  handles spreadsheet work), persistent org memory, the 15 pre-built
                  industry advisors, and Gmail/Calendar connectors. Or you want the
                  option to install AI workflows ($75K+ engagement) that move real
                  metrics — which ChatGPT doesn&apos;t offer.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Run both, honestly.
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  Many of our customers keep ChatGPT Teams for individual prompts and
                  add Perpetual Core as the persistent organizational layer. Pro tier
                  is $99/month with BYOK support — bring your existing OpenAI API key
                  and route through your enterprise contract. No migration tax.
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
                <Link href="/compare/vs-claude-for-teams" className="underline underline-offset-4">
                  Claude for Teams
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
