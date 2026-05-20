/**
 * /compare — feature-by-feature comparison against ChatGPT Teams, Claude
 * for Teams, and a generic "AI tool stack." Buyer-intent SEO target.
 * Visual register matches homepage v6.
 *
 * Linked from Navbar, /pricing FAQ, and as a follow-up CTA in nurture
 * email day 2. JSON-LD: BreadcrumbList + Article (compare = analysis content).
 */

import Link from "next/link";
import { ArrowRight, Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";

export const metadata = {
  title: "Perpetual Core vs ChatGPT Teams vs Claude for Teams",
  description:
    "Honest feature-by-feature comparison. Perpetual Core is a multi-model operating system with persistent organizational memory and 15 industry advisors. ChatGPT and Claude give you one model and a chat window. Here's what's actually different.",
};

type Row = {
  feature: string;
  pc: "yes" | "no" | "partial";
  chatgpt: "yes" | "no" | "partial";
  claude: "yes" | "no" | "partial";
  stack: "yes" | "no" | "partial";
  note?: string;
};

const ROWS: Row[] = [
  {
    feature: "Multi-model routing (Claude + GPT-4o + Gemini)",
    pc: "yes",
    chatgpt: "no",
    claude: "no",
    stack: "partial",
    note: "Routes each query to the best model for the task automatically.",
  },
  {
    feature: "Persistent organizational memory across sessions",
    pc: "yes",
    chatgpt: "no",
    claude: "partial",
    stack: "no",
  },
  {
    feature: "15 industry-specific AI advisors",
    pc: "yes",
    chatgpt: "no",
    claude: "no",
    stack: "no",
  },
  {
    feature: "Document RAG + pgvector embeddings on your corpus",
    pc: "yes",
    chatgpt: "partial",
    claude: "partial",
    stack: "yes",
    note: "ChatGPT custom GPTs and Claude Projects do shallower variants.",
  },
  {
    feature: "Email + calendar integration (Gmail, Google Cal)",
    pc: "yes",
    chatgpt: "no",
    claude: "no",
    stack: "yes",
  },
  {
    feature: "API access on Pro tier",
    pc: "yes",
    chatgpt: "yes",
    claude: "yes",
    stack: "yes",
  },
  {
    feature: "SSO / SAML / RBAC",
    pc: "yes",
    chatgpt: "yes",
    claude: "yes",
    stack: "partial",
  },
  {
    feature: "Production AI engagement option (install + outcomes)",
    pc: "yes",
    chatgpt: "no",
    claude: "no",
    stack: "no",
    note: "Engagements from $75K install AI workflows that move metrics.",
  },
  {
    feature: "10–15% of revenue funds the Institute for Human Advancement",
    pc: "yes",
    chatgpt: "no",
    claude: "no",
    stack: "no",
  },
  {
    feature: "Mission-driven discount for 501(c)(3) nonprofits",
    pc: "yes",
    chatgpt: "partial",
    claude: "no",
    stack: "no",
    note: "30% off Vellum for verified 501(c)(3)s.",
  },
  {
    feature: "Self-serve pricing under $100/month",
    pc: "yes",
    chatgpt: "yes",
    claude: "yes",
    stack: "yes",
  },
  {
    feature: "HIPAA-aware infrastructure + BAA",
    pc: "yes",
    chatgpt: "partial",
    claude: "partial",
    stack: "no",
    note: "Healthcare-tier BAA included; consult your covered entity.",
  },
];

const COMPARE_FAQ = [
  {
    question: "Why not just use ChatGPT Teams or Claude for Teams?",
    answer:
      "If you only need a chat window with one model, those are fine. Perpetual Core is for organizations that want one persistent operating layer — routed across the right model for each task, with shared organizational memory, industry advisors, and the option to ship engagement-grade AI workflows that move real metrics.",
  },
  {
    question: "Can I bring my own ChatGPT or Claude API key?",
    answer:
      "Yes. Pro tier supports BYOK — bring your existing OpenAI, Anthropic, or Google AI key and we route through it. Useful for teams with existing enterprise contracts or specific data residency requirements.",
  },
  {
    question: "How does Perpetual Core handle data privacy versus the alternatives?",
    answer:
      "We don't train models on your data. Conversations and documents are stored in your isolated workspace with row-level security (Supabase RLS), and we expose a complete audit log. Healthcare-tier plans include a signed BAA. ChatGPT and Claude have similar policies but lack the audit-log + per-organization isolation of an installed operating system.",
  },
  {
    question: "What if I'm already paying for ChatGPT Teams?",
    answer:
      "Keep it. Perpetual Core complements rather than replaces — many of our customers run both. The Pro tier is $99/month, designed to be additive: ChatGPT for one-off prompts, Perpetual Core for the persistent organizational layer (calendar, email, RAG, multi-model routing, industry advisors).",
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

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
          faqSchema(COMPARE_FAQ),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="Compare" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              We're not a chat window.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              Honest feature-by-feature against ChatGPT Teams, Claude for Teams,
              and the stitched-together AI tool stack. Pick what fits — Pro tier
              is $99/month, no contract, no migration tax.
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
                    <th className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground py-4 px-3 text-center">
                      Claude for Teams
                    </th>
                    <th className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground py-4 px-3 text-center">
                      DIY tool stack
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
                        <CellIcon v={row.chatgpt} />
                      </td>
                      <td className="py-4 px-3 text-center">
                        <CellIcon v={row.claude} />
                      </td>
                      <td className="py-4 px-3 text-center">
                        <CellIcon v={row.stack} />
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

      {/* Honest framing */}
      <section className="border-t border-border py-20 sm:py-24">
        <div className="container mx-auto px-6 sm:px-8">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
            <SectionRail index="02" label="When to use what" />
            <div className="max-w-3xl space-y-8">
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Use ChatGPT Teams or Claude for Teams if…
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  You want a chat window with one strong model, your team uses
                  AI for one-off prompts more than persistent workflows, you
                  don't need calendar/email integration, and you have no
                  appetite for a third tool. They're great at what they are.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Use Perpetual Core if…
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  You want one operating layer your whole organization shares,
                  with persistent context, multi-model routing, industry-specific
                  advisors, and the option to ship engagement-grade AI workflows
                  ($75K install) that move real metrics. You care that 10–15%
                  of every dollar funds mission work.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Run both, honestly.
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  Many of our customers keep ChatGPT Teams or Claude for Teams
                  for one-off prompts, and add Perpetual Core for the persistent
                  organizational layer. The Pro tier is $99/month and you can
                  bring your existing API keys. No contract, no migration tax.
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
                {COMPARE_FAQ.map((item) => (
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
                Compare is easy. Trying is easier.
              </h3>
              <p className="text-base text-muted-foreground leading-[1.7] mb-10">
                Free tier is permanent — 1 user, basic chat, 100 sources. No
                card. Upgrade to Pro at $99/month any time. Cancel any month.
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
