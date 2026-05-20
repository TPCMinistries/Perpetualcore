"use client";

/**
 * /rfp/roadmap — Public roadmap.
 *
 * Three honest columns: Live now / In private beta / Next this quarter.
 * Same StageBadge tones used on /rfp landing — no breathless promises.
 *
 * Updated by hand when state changes. Source of truth for the items below:
 *   - .planning/research/rfp-engine/BEST-SITE-PLAN-2026-05-19.md
 *   - rfp-engine memory entry
 *
 * If you change feature state in code, also update this list so the
 * roadmap doesn't lie. (The /rfp/changelog page — Wave 6 — will pull
 * from git commits and remove that maintenance burden later.)
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Beaker, Compass } from "lucide-react";

type Stage = "live" | "beta" | "next";

const STAGE_META: Record<
  Stage,
  { label: string; tone: string; icon: typeof CheckCircle2 }
> = {
  live: {
    label: "Live now",
    tone: "text-emerald-300 border-emerald-400/30 bg-emerald-400/[0.06]",
    icon: CheckCircle2,
  },
  beta: {
    label: "In private beta",
    tone: "text-amber-200 border-amber-300/30 bg-amber-300/[0.05]",
    icon: Beaker,
  },
  next: {
    label: "Next this quarter",
    tone: "text-zinc-300 border-white/15 bg-white/[0.04]",
    icon: Compass,
  },
};

interface Item {
  title: string;
  desc: string;
}

const items: Record<Stage, Item[]> = {
  live: [
    {
      title: "Discovery every six hours",
      desc: "NY State Grants Gateway and NYC PASSPort flowing today. Federal sources (SAM.gov, Grants.gov, SBIR) restore the week SAM reissues our API key.",
    },
    {
      title: "Multi-tenant orgs and invites",
      desc: "Nonprofit, for-profit, or dual-mode orgs. Per-org row-level security. Owner / writer / reviewer / viewer roles. Email invites.",
    },
    {
      title: "Voice-trained drafting",
      desc: "Train your voice fingerprint from 3–10 past proposals. Drafts read like you, not like a vendor. Single Opus extraction; structured profile, not fine-tuning.",
    },
    {
      title: "Vault-grounded drafts with inline citations",
      desc: "Upload past docs to your vault. Drafts ground claims in real artifacts and emit numbered [CITE] markers. Click any pill to see the source chunk.",
    },
    {
      title: "Reviewer agent",
      desc: "An Opus pass against the funder's brief — 0-100 score, severity-graded findings, per-section notes. Surfaces what a federal reviewer would dock you for.",
    },
    {
      title: "Per-section editing with version tracking",
      desc: "Edit any section inline. Cmd/Ctrl+S saves. Every edit bumps a version and lands in the audit log alongside the original drafter run.",
    },
    {
      title: "Audit-grade activity log",
      desc: "Every prompt, retrieval, edit, and reviewer pass writes to rfp_agent_sessions. Exportable. The disclosure trail federal buyers are starting to require.",
    },
    {
      title: "First-run onboarding checklist",
      desc: "Five steps from new org to voice-trained, vault-grounded, reviewer-checked draft. Auto-derives progress — no extra clicks.",
    },
  ],
  beta: [
    {
      title: "Compliance gate v1",
      desc: "Page-limit checker, budget math validation, deadline-TZ normalizer, required-doc checklist parsed from NOFO brief. Runs before you mark a proposal ready-to-submit.",
    },
    {
      title: "PDF and Docx vault upload",
      desc: "Today the vault accepts plaintext paste. We're adding pdf-parse and mammoth so you can drop real source documents in without an extract-then-paste detour.",
    },
    {
      title: "PASSPort full pagination",
      desc: "NYC PASSPort serves page 1 today (5 active rows). Page 2+ needs a Playwright pass for __VIEWSTATE postbacks. Unblocks ~50 more active NYC opps.",
    },
  ],
  next: [
    {
      title: "Federal discovery restored",
      desc: "SAM.gov reissues our API key end of May. The federal cron is built and dormant — it flips live the day the key lands. Simpler.Grants and Grants.gov follow.",
    },
    {
      title: "Self-serve checkout (Pro and Agency)",
      desc: "Pro $799 and Agency $2,499 as self-serve Stripe checkouts with a 14-day trial. Enterprise stays sales-led. Reuses Perpetual Core LLC billing.",
    },
    {
      title: "Admin operator dashboard",
      desc: "Platform metrics, scraper health, per-org AI token cost, gross margin, quota meters, audit-log viewer. For the Perpetual Core team running the platform.",
    },
    {
      title: "Nurture sequences",
      desc: "Lead-capture Day 0/3/7, trial sequence Day 1/3/7/12, activation re-engagement, win/loss survey, monthly per-org digest. Reuses existing send-sequence-emails cron.",
    },
    {
      title: "Per-section assignment + status",
      desc: "Owner assigns sections to writers. Draft / reviewing / final badges. Deadline tracker with 7/3/1-day-out emails via the existing alert dispatcher.",
    },
    {
      title: "Inline reviewer-finding annotation",
      desc: "Today the reviewer's findings render in collapsible per-section panels. Next step: anchor cited excerpts inline against the section text with severity-colored underlines.",
    },
  ],
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
      <span className="h-px w-8 bg-zinc-700" />
      {children}
    </div>
  );
}

function Column({ stage }: { stage: Stage }) {
  const meta = STAGE_META[stage];
  const Icon = meta.icon;
  const stageItems = items[stage];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex flex-col"
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${meta.tone}`}
        >
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        <span className="font-mono text-[10px] text-zinc-600">
          {stageItems.length}
        </span>
      </div>
      <ul className="space-y-3">
        {stageItems.map((item) => (
          <li
            key={item.title}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/10"
          >
            <div className="text-[14px] font-medium text-zinc-100">
              {item.title}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
              {item.desc}
            </p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function RoadmapPage() {
  return (
    <main className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>Roadmap · updated weekly</Eyebrow>
        <h1
          className="text-4xl leading-tight tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <span className="italic">What we ship.</span>{" "}
          <span className="text-zinc-500">What we don't.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
          We publish the roadmap because federal buyers ask. If you need a
          capability we list under "next this quarter," ask sales — most of
          these timelines accelerate when there's a named customer attached.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          <Column stage="live" />
          <Column stage="beta" />
          <Column stage="next" />
        </div>

        <div className="mt-20 rounded-xl border border-white/5 bg-white/[0.02] p-8">
          <p className="text-[13px] font-mono uppercase tracking-[0.22em] text-emerald-300">
            See something missing?
          </p>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-300">
            Tell us what your funder requires that this roadmap doesn't cover.
            We prioritize against named customers, not abstract personas.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
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
              <Link href="/rfp/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
