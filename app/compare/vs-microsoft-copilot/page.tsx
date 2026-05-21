/**
 * /compare/vs-microsoft-copilot — head-to-head with Microsoft 365 Copilot
 * ($30/user/month, requires M365 license). Long-tail SEO target for
 * "microsoft copilot alternative" and "ai outside microsoft 365" queries.
 * Visual register matches /compare. JSON-LD: BreadcrumbList + FAQPage.
 */

import Link from "next/link";
import { ArrowRight, Check, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/structured-data";

export const metadata = {
  title: "Perpetual Core vs Microsoft 365 Copilot — honest comparison",
  description:
    "Microsoft 365 Copilot is $30/user/month on top of an M365 license, locked to the Microsoft ecosystem. Perpetual Core is $99/month, portable, multi-model, with persistent org memory and 15 industry advisors. Here's when each makes sense.",
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
    note: "Copilot is locked to OpenAI via Microsoft. PC routes across providers based on task.",
  },
  {
    feature: "Persistent organizational memory across users",
    pc: "yes",
    competitor: "partial",
    note: "Copilot uses Microsoft Graph context within M365. PC has explicit org-wide memory across all sources.",
  },
  {
    feature: "15 industry-specific AI advisors pre-built",
    pc: "yes",
    competitor: "no",
    note: "Copilot has Copilot Studio for custom agents but no pre-built industry advisors.",
  },
  {
    feature: "Works without a Microsoft 365 license",
    pc: "yes",
    competitor: "no",
    note: "Copilot requires a paid M365 Business Standard or Enterprise license ($12.50-$57/user/mo) on top of the $30 Copilot license.",
  },
  {
    feature: "Native integration with Office (Word, Excel, PowerPoint, Outlook)",
    pc: "partial",
    competitor: "yes",
    note: "Copilot lives inside Office apps. PC integrates with Google Workspace; Office connectors are on roadmap.",
  },
  {
    feature: "Gmail + Google Calendar integration",
    pc: "yes",
    competitor: "no",
    note: "PC integrates with Google Workspace natively. Copilot is Outlook-only.",
  },
  {
    feature: "Document RAG on full corpus (pgvector)",
    pc: "yes",
    competitor: "partial",
    note: "Copilot pulls from Microsoft Graph (Office files, SharePoint). PC indexes any source via pgvector.",
  },
  {
    feature: "BYOK / bring your own API key",
    pc: "yes",
    competitor: "no",
    note: "Copilot uses Microsoft's hosted OpenAI deployment. PC supports BYOK on Pro tier.",
  },
  {
    feature: "Production engagement option ($75K+ install)",
    pc: "yes",
    competitor: "partial",
    note: "Microsoft offers FastTrack + partner network. PC offers Atlas Discovery → direct engagement.",
  },
  {
    feature: "10–15% of revenue funds nonprofit mission work",
    pc: "yes",
    competitor: "no",
    note: "PC partially funds the Institute for Human Advancement.",
  },
  {
    feature: "501(c)(3) nonprofit discount",
    pc: "yes",
    competitor: "yes",
    note: "Microsoft has nonprofit licensing programs. PC ships 30% off Vellum for verified 501(c)(3)s.",
  },
  {
    feature: "Portable — not locked to one productivity ecosystem",
    pc: "yes",
    competitor: "no",
    note: "PC works with Google Workspace, Notion, Slack, and on its own. Copilot only inside Microsoft.",
  },
];

const FAQ = [
  {
    question: "We're a Microsoft shop. Why add Perpetual Core?",
    answer:
      "If 100% of your team lives inside Word, Excel, Outlook, and PowerPoint — and that's where AI should meet them — stay on Copilot. PC is for orgs that have a mixed stack (Google Workspace, Notion, Slack, custom apps), want multi-model routing, or want one AI layer that isn't locked to one productivity ecosystem. Many enterprises run both: Copilot inside Office for document work, PC for the cross-tool org memory layer.",
  },
  {
    question: "What does Copilot actually cost us, total?",
    answer:
      "Microsoft 365 Copilot is $30/user/month — but only on top of a qualifying M365 license. For a 50-person team on M365 Business Standard ($12.50/user/mo), the all-in cost is $42.50/user × 50 = $2,125/mo. PC Teams pricing for 50 seats is typically $500-$1,000/mo. If you already pay for M365, Copilot is incremental. If you don't, switching ecosystems just for Copilot is expensive.",
  },
  {
    question: "Will Copilot replace our Outlook, Word, and Teams?",
    answer:
      "No, Copilot lives inside them. It's an AI assistant layered on the Microsoft apps you already use. If your team is happy in M365, that's a strength. If your team uses Google Workspace, Notion, Slack, and other tools too, Copilot only sees the Microsoft side — which is where PC's multi-source memory layer becomes useful.",
  },
  {
    question: "How does data residency work compared to Microsoft Copilot?",
    answer:
      "Copilot keeps data inside your M365 tenant in Microsoft Azure regions you select. PC stores data in Supabase (US-based by default; EU residency available on Teams tier) with row-level security per workspace. Both are SOC 2 — pick based on whether your security policy already approves Microsoft Azure vs Supabase/AWS.",
  },
  {
    question: "What about Copilot Studio — can we build custom agents like in PC?",
    answer:
      "Copilot Studio lets you build custom agents that live inside the Microsoft ecosystem. PC's advisor builder lets you build agents that live in PC and access your full document corpus across any source. Different scopes: Copilot Studio agents are great inside M365; PC agents are great across your whole stack. If you'd rather not be locked into one ecosystem, PC.",
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

export default function VsMicrosoftCopilotPage() {
  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
            { name: "vs Microsoft Copilot", path: "/compare/vs-microsoft-copilot" },
          ]),
          faqSchema(FAQ),
        ]}
      />
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-6 sm:px-8 pt-20 pb-12 sm:pt-28 sm:pb-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          <SectionRail index="00" label="vs Microsoft Copilot" />
          <div className="max-w-3xl">
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-[-0.025em] text-foreground">
              Copilot lives inside Microsoft.<br />
              We work everywhere else too.
            </h1>
            <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-[1.65] max-w-2xl">
              Microsoft 365 Copilot is $30/user/month on top of an M365 license,
              locked to Office. Perpetual Core is $99/month, portable across Google
              Workspace, Notion, Slack, and custom apps. Multi-model routing, persistent
              org memory, 15 industry advisors, and an install path. Here&apos;s when
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
                      M365 Copilot
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
                  Stay on Microsoft Copilot if…
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  Your team lives inside M365 — Word, Excel, PowerPoint, Outlook, Teams.
                  Most of your AI work is &ldquo;help me draft this email,&rdquo; &ldquo;summarize
                  this meeting,&rdquo; &ldquo;explain this Excel formula.&rdquo; You already pay
                  for M365 so the marginal cost is just the Copilot license. And you
                  prefer one vendor for both productivity + AI. That&apos;s a real
                  preference and Copilot is solid at it.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Add or switch to Perpetual Core if…
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  Your stack is mixed — Google Workspace, Notion, Slack, custom apps,
                  Office on the side. Or you want multi-model routing (not just OpenAI
                  via Microsoft). Or you don&apos;t want vendor lock-in. Or you want
                  the 15 industry advisors + the install-engagement path that Copilot
                  doesn&apos;t offer.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.015em] text-foreground mb-3">
                  Run both, honestly.
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-[1.7]">
                  Many enterprises run Copilot inside Office for document work and add
                  Perpetual Core as the cross-tool org memory layer (since Copilot
                  only sees Microsoft sources). Pro tier is $99/month with BYOK —
                  bring your existing OpenAI API key and route through your enterprise
                  contract.
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
                <Link href="/compare/vs-claude-for-teams" className="underline underline-offset-4">
                  Claude for Teams
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
