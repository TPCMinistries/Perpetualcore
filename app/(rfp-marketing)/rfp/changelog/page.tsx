/**
 * /rfp/changelog — Hand-curated release log.
 *
 * v1 is a static array. v2 will auto-generate from `feat(rfp-*):` and
 * `fix(rfp-*):` commit subjects in the next build step.
 *
 * Convention:
 *   - Newest first, grouped by week (Monday anchor)
 *   - Each entry: tag, headline, 1-3 sentence detail
 *   - Tags: feat (new capability), fix (bug repair), chore (infra/upkeep)
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "What we shipped on RFP Engine, when we shipped it. Hand-curated weekly release log of features, fixes, and infra changes.",
  alternates: {
    canonical: "https://rfp.perpetualcore.com/rfp/changelog",
  },
  openGraph: {
    url: "https://rfp.perpetualcore.com/rfp/changelog",
    title: "Changelog — RFP Engine | Perpetual Core",
    description:
      "Weekly release notes. What we shipped, when we shipped it.",
  },
};

type Tag = "feat" | "fix" | "chore";

interface ChangelogEntry {
  tag: Tag;
  title: string;
  body: string;
}

interface Week {
  label: string;            // human-readable week heading
  iso_anchor: string;       // Monday of the week (YYYY-MM-DD) for sorting
  entries: ChangelogEntry[];
}

const WEEKS: Week[] = [
  {
    label: "Week of May 18, 2026",
    iso_anchor: "2026-05-18",
    entries: [
      {
        tag: "feat",
        title: "PDF and DOCX vault upload",
        body: "The vault now accepts file uploads (PDF via pdf-parse, DOCX via mammoth) alongside the existing plaintext paste. Same chunk + embed pipeline; 20 MB ceiling per file.",
      },
      {
        tag: "feat",
        title: "Closing-soon deadline tracker",
        body: "Discovery dashboard surfaces opportunities closing in the next 7 days at the top of the feed, color-coded by urgency. Click-through deep-links into the opp detail.",
      },
      {
        tag: "feat",
        title: "Self-serve Stripe checkout for Pro and Agency",
        body: "Owners can subscribe self-serve from /org/[id]/settings/billing. 14-day free trial on both tiers. Stripe customer portal handles upgrades, downgrades, and cancellations.",
      },
      {
        tag: "feat",
        title: "Lead-capture and activation-reengagement email sequences",
        body: "New signups enroll in a 3-step lead-capture series. Orgs that go 7+ days without drafting get an activation nudge. Daily cron at 14:00 UTC. One-click unsubscribe.",
      },
      {
        tag: "feat",
        title: "Platform operator dashboard at /admin/rfp",
        body: "Internal-only metrics view: orgs, drafts/week, reviewer runs, vault chunks, AI cost, scraper health per source, recent cron runs, audit log. Env-allowlisted access.",
      },
      {
        tag: "feat",
        title: "Public roadmap, comparison page, and ROI calculator",
        body: "New /rfp/roadmap, /rfp/vs, /rfp/roi surfaces. Honest staging (Live / Beta / Next), honest comparison vs Instrumentl, Grants.gov, OpenGrants, Submittable, and a four-slider interactive ROI calculator.",
      },
      {
        tag: "fix",
        title: "Routed legacy /dashboard/* on rfp.* to /orgs",
        body: "Logging into rfp.perpetualcore.com was dropping users into the legacy Perpetual Core SaaS dashboard. Middleware now 307s any /dashboard* on the RFP host to /orgs.",
      },
      {
        tag: "feat",
        title: "Citation pills and per-section reviewer findings",
        body: "[CITE: vault-N] markers now render as numbered emerald popover pills that surface the source chunk on click. Reviewer findings split into per-section panels under each section.",
      },
      {
        tag: "feat",
        title: "First-run onboarding checklist",
        body: "New orgs see a five-step sticky card on Discovery: org → voice → vault → first draft → reviewer. Auto-derives progress from existence checks — no manual state writes.",
      },
      {
        tag: "chore",
        title: "Organization + SoftwareApplication JSON-LD",
        body: "All RFP marketing pages now emit structured data for Google rich results. Sitemap covers /rfp, /rfp/how-it-works, /rfp/pricing, /rfp/trust, /rfp/vs, /rfp/roadmap, /rfp/roi.",
      },
    ],
  },
  {
    label: "Week of May 11, 2026",
    iso_anchor: "2026-05-11",
    entries: [
      {
        tag: "feat",
        title: "Reviewer agent v1",
        body: "Single Opus pass against the funder brief. Severity-graded findings (blocker / high / medium / low), 0-100 calibrated score, per-section anchoring with cited excerpts and concrete suggestions.",
      },
      {
        tag: "feat",
        title: "Vault grounding v1",
        body: "Upload past documents, chunk them with OpenAI text-embedding-3-large, retrieve top-k per draft. Drafter cites chunks inline as [CITE: vault-N]. Live-verified end-to-end.",
      },
      {
        tag: "feat",
        title: "Voice fingerprint v1",
        body: "Train a stylometric profile (sentence rhythm, signature phrases, framing patterns) from 3-10 past proposals. Drafter prepends to system prompt — not fine-tuning, but stable in cost.",
      },
      {
        tag: "feat",
        title: "Per-section inline editing",
        body: "Every section in a proposal has an inline editor. Cmd+S saves. Version bump on each human edit, audit row separates writer edits from agent drafts.",
      },
    ],
  },
  {
    label: "Week of May 4, 2026",
    iso_anchor: "2026-05-04",
    entries: [
      {
        tag: "feat",
        title: "Discovery v1 with NY State + NYC PASSPort",
        body: "Scrapers across NY State Grants Gateway and NYC PASSPort flow to rfp_opportunities every six hours. Drift detector emails on schema changes. Federal sources (SAM.gov, Grants.gov, SBIR) pending API key reissue.",
      },
      {
        tag: "feat",
        title: "Multi-tenant orgs, invites, and dual mode",
        body: "Per-org RLS. Owner / writer / reviewer / viewer roles. Email invites with token. Dual-mode nonprofit/for-profit orgs for fiscal sponsors and capture consultants.",
      },
    ],
  },
];

const TAG_META: Record<Tag, { label: string; tone: string }> = {
  feat: { label: "feat", tone: "text-emerald-300 border-emerald-400/30 bg-emerald-400/[0.06]" },
  fix: { label: "fix", tone: "text-amber-200 border-amber-300/30 bg-amber-300/[0.05]" },
  chore: { label: "chore", tone: "text-zinc-300 border-white/15 bg-white/[0.04]" },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
      <span className="h-px w-8 bg-zinc-700" />
      {children}
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <main className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <Eyebrow>Changelog · updated weekly</Eyebrow>
        <h1
          className="text-4xl leading-tight tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <span className="italic">What we shipped.</span>{" "}
          <span className="text-zinc-500">When we shipped it.</span>
        </h1>
        <p className="mt-5 text-[15px] leading-relaxed text-zinc-400">
          Hand-curated for now. The autogenerated build-step variant lands
          when the volume justifies it.
        </p>

        <div className="mt-12 space-y-12">
          {WEEKS.map((week) => (
            <section key={week.iso_anchor}>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-300">
                {week.label}
              </h2>
              <ul className="mt-4 space-y-3">
                {week.entries.map((entry, idx) => {
                  const meta = TAG_META[entry.tag];
                  return (
                    <li
                      key={idx}
                      className="rounded-lg border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/10"
                    >
                      <div className="flex items-baseline gap-3">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] ${meta.tone}`}
                        >
                          {meta.label}
                        </span>
                        <h3 className="text-[14px] font-medium text-zinc-100">
                          {entry.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
                        {entry.body}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
            Want to influence what ships next?
          </p>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-zinc-300">
            Roadmap items are prioritized against named customers. Tell us
            what your funder requires and we'll move it up.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="h-10 rounded-md bg-emerald-400 px-5 text-[13px] font-medium text-zinc-950 hover:bg-emerald-300"
            >
              <Link href="/contact-sales/rfp-engine">
                Talk to sales <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="h-10 rounded-md border border-white/10 px-5 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white"
            >
              <Link href="/rfp/roadmap">See the roadmap</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
