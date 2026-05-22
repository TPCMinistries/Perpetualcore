"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Search,
  Mic,
  Database,
  PenLine,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Clock,
  Upload,
  Building2,
  Plug,
  Radar,
} from "lucide-react";

type Stage = "live" | "beta" | "next";

const stageMeta: Record<Stage, { label: string; tone: string }> = {
  live: { label: "Live", tone: "text-emerald-300 border-emerald-400/30 bg-emerald-400/[0.06]" },
  beta: { label: "Private beta", tone: "text-amber-200 border-amber-300/30 bg-amber-300/[0.05]" },
  next: { label: "Next this quarter", tone: "text-zinc-300 border-white/15 bg-white/[0.04]" },
};

function StageBadge({ stage }: { stage: Stage }) {
  const meta = stageMeta[stage];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.18em] ${meta.tone}`}
    >
      {meta.label}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
      <span className="h-px w-8 bg-zinc-700" />
      {children}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const stages: {
  num: string;
  name: string;
  icon: typeof Search;
  agent: string;
  you: string;
  time: string;
  stage: Stage;
}[] = [
  {
    num: "01",
    name: "Discovery",
    icon: Search,
    agent:
      "Scans SAM.gov, Grants.gov, Simpler Grants, NY State, NYC DYCD, Candid, and SBIR.gov on a 6-hour cron. Fit score per opportunity: NAICS, keywords, geo, dollar band, prior funder history. ≥80 fit becomes a brief.",
    you: "Open the morning brief. Three to five ranked opportunities. Click the fit, dismiss the rest.",
    time: "Runs 24/7. ~3 min of your time per morning.",
    stage: "live",
  },
  {
    num: "02",
    name: "Vault",
    icon: Database,
    agent:
      "Retrieves the artifacts that ground this proposal — past wins with the same funder, capacity statements, partner letters, logic models, 990s. Top-k chunks via pgvector, scoped to your tenant.",
    you: "Confirm the retrieval. Add anything missing. Uploads stay in your tenant.",
    time: "30 seconds to scan. Most users skip — it&apos;s right.",
    stage: "beta",
  },
  {
    num: "03",
    name: "Draft",
    icon: PenLine,
    agent:
      "Writes section by section in your voice fingerprint. Sonnet 4 by default; Opus 4.7 for evaluation-critical sections. Every claim is grounded in a vault artifact. Ungrounded claims get a [VERIFY] flag — never silently invented.",
    you: "Read the draft. Resolve [VERIFY] flags by pointing to a vault doc or rewriting.",
    time: "10–25 min per section vs. 2–4 hours from scratch.",
    stage: "beta",
  },
  {
    num: "04",
    name: "Reviewer",
    icon: Sparkles,
    agent:
      "Opus 4.7 reads your draft against the funder&apos;s rubric. Scores 0–100. Emits specific revision requests with the rubric language cited. Brutal, not polite.",
    you: "Accept what you agree with. Push back on what doesn&apos;t fit your strategy.",
    time: "5–10 min per pass. Usually 1–2 passes.",
    stage: "next",
  },
  {
    num: "05",
    name: "Compliance",
    icon: ShieldCheck,
    agent:
      "Deterministic checks: page count, font, line spacing, margins, required attachments (W-9, audit, SF-424 family), budget arithmetic, indirect rate caps, eligibility, deadline timezone, 24-hour buffer.",
    you: "Read the pass/fail report. Fix what&apos;s red. Re-run until clean.",
    time: "Under a minute to run.",
    stage: "next",
  },
  {
    num: "06",
    name: "Submit",
    icon: CheckCircle2,
    agent:
      "Assembles the final PDF/docx package, exports a clean submission bundle, writes the full agent activity log to your audit trail.",
    you: "You submit. Always. The platform never auto-submits, never signs anything, never wires money.",
    time: "Whenever you&apos;re ready.",
    stage: "live",
  },
];

const scenario = [
  {
    stamp: "TUE 09:14",
    label: "Discovery",
    body: "DYCD posts a $650K Workforce Learning Grant for community-based orgs serving 18–24 in NYC. Scraper picks it up at the next 6-hour tick.",
  },
  {
    stamp: "TUE 09:22",
    label: "Match",
    body: "Fit score: 94. NAICS aligns (624310). Geo aligns. Prior win with NYC HRA carries funder history weight.",
  },
  {
    stamp: "TUE 09:28",
    label: "Notify",
    body: "Slack ping in #capture: 'New 94-fit. DYCD-WLG-2026. $650K. Due 5/29 17:00 ET.'",
  },
  {
    stamp: "TUE 11:40",
    label: "First drafts",
    body: "Draft agent returns Need, Approach, Org Capacity, Logic Model in voice. Six [VERIFY] flags. Three resolved from vault, three flagged for staff to confirm.",
  },
  {
    stamp: "WED 10:15",
    label: "Reviewer pass",
    body: "Opus 4.7 scores 78/100. Flags weak theory of change on Approach → Outcomes; missing evaluation timeline.",
  },
  {
    stamp: "WED 14:30",
    label: "Revisions",
    body: "Writer accepts 7 of 9 revisions. Reviewer rescores 91/100.",
  },
  {
    stamp: "THU 11:00",
    label: "Compliance",
    body: "Page count clean. Budget sums. Indirect at 10% — under the 12% cap. Three required attachments pulled from vault.",
  },
  {
    stamp: "THU 16:20",
    label: "Submit-ready",
    body: "Final PDF assembled. Audit log exported. ED reviews, signs cover letter, submits via DYCD portal.",
  },
  {
    stamp: "FRI 09:00",
    label: "Filed",
    body: "Confirmation logged against the proposal record. Eight days early. ~6 hours of staff time instead of 40+.",
  },
];

const agents: {
  icon: typeof Search;
  name: string;
  role: string;
  touches: string;
  doesnt: string;
  stage: Stage;
}[] = [
  {
    icon: Search,
    name: "Discovery agent",
    role: "Always-on opportunity scanner across federal, state, city, and foundation sources.",
    touches: "SAM.gov, Grants.gov, Simpler Grants, NY State, NYC DYCD/HRA/DOE, Candid, SBIR.gov.",
    doesnt: "Submit on your behalf. Pay subscriptions. Reach out to program officers.",
    stage: "live",
  },
  {
    icon: Mic,
    name: "Voice agent",
    role: "Builds and refreshes your voice fingerprint from past wins, reports, founder letters.",
    touches: "Documents in your vault. JSON fingerprint on your org row.",
    doesnt: "Train any model outside your tenant. Share your voice with other customers.",
    stage: "beta",
  },
  {
    icon: Database,
    name: "Vault agent",
    role: "Retrieves the right artifacts from your tenant for grounding every section.",
    touches: "Past proposals, partner letters, logic models, 990s, capacity statements, bios.",
    doesnt: "Read other tenants' vaults. Persist content outside your encrypted storage.",
    stage: "beta",
  },
  {
    icon: PenLine,
    name: "Drafting agent",
    role: "Generates section-level drafts in your voice, grounded in your vault.",
    touches: "Section drafts, citations, [VERIFY] markers. Sonnet 4 default, Opus 4.7 for critical.",
    doesnt: "Invent partners, fabricate outcomes, cite outside your vault.",
    stage: "beta",
  },
  {
    icon: Sparkles,
    name: "Reviewer agent",
    role: "Scores drafts against the funder&apos;s evaluation rubric and requests specific revisions.",
    touches: "Solicitation excerpts, extracted rubrics, your draft. Opus 4.7.",
    doesnt: "Override your judgment. Edit your draft directly without approval.",
    stage: "next",
  },
  {
    icon: ShieldCheck,
    name: "Compliance agent",
    role: "Deterministic pre-submit gate for page rules, budgets, attachments, eligibility, timing.",
    touches: "Final assembled package, solicitation requirements, SF-424 family.",
    doesnt: "Submit. Sign anything. Make legal or eligibility judgments — it flags, you decide.",
    stage: "next",
  },
];

const humanOnly = [
  { label: "Final submission", body: "The last click is always yours. We assemble. You file." },
  { label: "Signing", body: "No autopen, no signature stamp, no e-sign on your behalf." },
  { label: "Budget approval", body: "We do the math. You approve the numbers." },
  { label: "Partner outreach", body: "We surface partners. We don&apos;t email them." },
  { label: "Eligibility calls", body: "We flag risks. We never say 'you qualify' to a federal officer." },
  { label: "Anything irreversible", body: "If undoing it requires a phone call or a lawyer — you do it." },
];

const onboarding = [
  {
    icon: Building2,
    title: "Create your org",
    body: "Pick nonprofit, for-profit, or dual. Add NAICS codes, geo, funding categories you pursue.",
    time: "60 seconds",
  },
  {
    icon: Upload,
    title: "Upload 5–10 vault docs",
    body: "Past wins, annual reports, founder letters, capacity statements, partner letters.",
    time: "90 seconds",
  },
  {
    icon: Plug,
    title: "Connect funding sources",
    body: "Toggle SAM.gov, Grants.gov, DYCD, NY State, Candid, SBIR. We turn on the scrapers you need.",
    time: "30 seconds",
  },
  {
    icon: Radar,
    title: "Run first Discovery",
    body: "First scan kicks off. Real fit-scored brief in your inbox by tomorrow morning.",
    time: "60 seconds + the wait",
  },
];

export function HowItWorksContent() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.08),transparent)] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-24 pb-24 lg:pt-32 lg:pb-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-5xl"
          >
            <Eyebrow>How it works</Eyebrow>
            <h1 className="font-semibold tracking-tight text-white">
              <span className="block text-[clamp(2rem,6vw,4.75rem)] leading-[1.05]">
                From solicitation drop
              </span>
              <span
                className="block bg-gradient-to-br from-emerald-200 via-teal-300 to-cyan-300 bg-clip-text pb-2 text-[clamp(2rem,6vw,4.75rem)] italic leading-[1.06] text-transparent"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                to submission-ready PDF.
              </span>
            </h1>
            <p className="mt-10 max-w-2xl text-lg leading-[1.7] text-zinc-300">
              Six agents. One workspace. Three live today, three in private beta. Below: what each one does, what it touches, what it doesn&apos;t, and what stays in your hands.
            </p>
          </motion.div>
        </div>
      </section>

      {/* LIFECYCLE TIMELINE */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container relative mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-20 max-w-3xl"
          >
            <Eyebrow>The lifecycle, end-to-end</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Six stages.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                One file, worked end-to-end.
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
              Each row is a stage with a status tag. We won&apos;t pretend something is shipping when it isn&apos;t.
            </p>
          </motion.div>

          <div className="mx-auto max-w-5xl">
            <div className="relative">
              <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-400/40 via-white/10 to-transparent md:left-[35px]" />

              {stages.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.num}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.55, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="relative pb-12 last:pb-0"
                  >
                    <div className="flex gap-5 md:gap-8">
                      <div className="relative z-10 flex-shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-zinc-950 md:h-[72px] md:w-[72px]">
                          <Icon className="h-5 w-5 text-emerald-300 md:h-6 md:w-6" />
                        </div>
                      </div>

                      <div className="flex-1 pt-1.5 md:pt-3">
                        <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-300/80">
                            {s.num} / 06
                          </span>
                          <h3 className="text-[1.5rem] font-semibold tracking-tight text-white md:text-[1.75rem]">
                            {s.name}
                          </h3>
                          <StageBadge stage={s.stage} />
                        </div>

                        <div className="grid gap-5 rounded-xl border border-white/5 bg-white/[0.02] p-5 md:grid-cols-2 md:gap-6 md:p-7">
                          <div>
                            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                              The agent
                            </p>
                            <p className="text-[14px] leading-[1.75] text-zinc-300">{s.agent}</p>
                          </div>
                          <div>
                            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                              You
                            </p>
                            <p className="text-[14px] leading-[1.75] text-zinc-300">{s.you}</p>
                          </div>
                          <div className="md:col-span-2 md:flex md:items-center md:gap-3 md:border-t md:border-white/5 md:pt-5">
                            <Clock className="hidden h-3.5 w-3.5 text-zinc-500 md:inline" />
                            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                              {s.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW NARRATIVE */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-3xl"
          >
            <Eyebrow>An illustrative workflow</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Tuesday 9:14 AM.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                A $650K DYCD workforce solicitation drops.
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
              Here&apos;s what happens by Friday — once all six agents are live. This is the target experience, not a shipped customer testimonial.
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                    proposal.log — DYCD-WLG-2026
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  Illustrative
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {scenario.map((row, i) => (
                  <motion.div
                    key={row.stamp + row.label}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.4, delay: i * 0.03 }}
                    className="grid grid-cols-12 gap-4 px-5 py-4 md:px-7 md:py-5"
                  >
                    <div className="col-span-12 md:col-span-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-300/80">
                        {row.stamp}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                        {row.label}
                      </p>
                    </div>
                    <p className="col-span-12 text-[14px] leading-[1.75] text-zinc-300 md:col-span-9">
                      {row.body}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-white/5 bg-emerald-500/[0.04] px-5 py-4 md:px-7">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-300">
                  Total wall time → 4 days · Staff time → ~6 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIX AGENTS */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-16 max-w-3xl"
          >
            <Eyebrow>The six agents</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Each one has a job.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                And a lane.
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
              Six narrow agents beats one wide agent that quietly drifts. Each card names the job, what it touches, and where it is on the path to live.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group relative flex flex-col bg-zinc-950 p-8"
                >
                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] transition-colors group-hover:border-emerald-400/40 group-hover:bg-emerald-400/10">
                      <Icon className="h-5 w-5 text-emerald-300" />
                    </div>
                    <StageBadge stage={a.stage} />
                  </div>
                  <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-white">{a.name}</h3>
                  <p className="mb-5 text-[13.5px] leading-[1.7] text-zinc-400">{a.role}</p>

                  <div className="mt-auto space-y-3 border-t border-white/5 pt-5">
                    <div>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">
                        Touches
                      </p>
                      <p className="text-[12.5px] leading-[1.65] text-zinc-300">{a.touches}</p>
                    </div>
                    <div>
                      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        Never touches
                      </p>
                      <p className="text-[12.5px] leading-[1.65] text-zinc-400">{a.doesnt}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHAT STAYS HUMAN */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-4xl"
          >
            <Eyebrow>What stays human</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              We get you to submit-ready.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                You decide what ships.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-zinc-400">
              Some things should never be automated for federal capture. The line — and where we don&apos;t cross it.
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl space-y-2">
            {humanOnly.map((h, i) => (
              <motion.div
                key={h.label}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="group flex items-start gap-5 border-b border-white/5 py-5"
              >
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900">
                  <XCircle className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                </div>
                <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                  <div className="sm:min-w-[200px]">
                    <p className="text-[15px] font-medium text-white">{h.label}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      Human only
                    </p>
                  </div>
                  <p className="flex-1 text-[14px] leading-[1.7] text-zinc-400">{h.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* DATA POSTURE — condensed */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl"
          >
            <Eyebrow>Where your data lives</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Your vault is{" "}
              <span
                className="italic text-emerald-300"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                yours.
              </span>
            </h2>

            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: "Tenant isolation",
                  body: "Postgres RLS scopes every row to your org. Verified by automated tests on every deploy.",
                },
                {
                  icon: Database,
                  title: "Voice fingerprint stays put",
                  body: "Voice JSON lives on your org row. Never used to train shared models, never pooled with other tenants.",
                },
                {
                  icon: ShieldCheck,
                  title: "No training pipelines",
                  body: "We don&apos;t fine-tune on customer data. Inference happens against your retrieved context at runtime.",
                },
              ].map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.title} className="bg-zinc-950 p-7">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                      <Icon className="h-4 w-4 text-emerald-300" />
                    </div>
                    <h3 className="mb-2 text-[15px] font-semibold tracking-tight text-white">
                      {d.title}
                    </h3>
                    <p className="text-[13px] leading-[1.7] text-zinc-400">{d.body}</p>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 max-w-2xl text-[14px] leading-[1.75] text-zinc-500">
              Full security architecture, sub-processors, and compliance posture on the{" "}
              <Link href="/rfp/trust" className="text-emerald-300 underline-offset-4 hover:underline">
                trust page
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </section>

      {/* ONBOARDING */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-3xl"
          >
            <Eyebrow>Onboarding in four moves</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Tenant ready in{" "}
              <span
                className="italic text-emerald-300"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                four minutes.
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
              Not a sales call. Not a sandbox. Sign up, do these four things, run.
            </p>
          </motion.div>

          <ol className="mx-auto max-w-5xl space-y-3">
            {onboarding.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group relative grid grid-cols-12 items-start gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 md:p-7"
                >
                  <div className="col-span-12 flex items-center gap-4 md:col-span-3">
                    <span className="font-mono text-[28px] font-light leading-none text-zinc-500 md:text-[40px]" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                      <Icon className="h-4 w-4 text-emerald-300" />
                    </div>
                  </div>
                  <div className="col-span-12 md:col-span-7">
                    <h3 className="mb-1.5 text-[16px] font-semibold tracking-tight text-white">
                      {step.title}
                    </h3>
                    <p className="text-[13.5px] leading-[1.7] text-zinc-400">{step.body}</p>
                  </div>
                  <div className="col-span-12 md:col-span-2 md:text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">
                      {step.time}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.16),transparent)] blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.04] tracking-tight text-white">
              Now you know how it works.
              <br />
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                See it on your own pipeline.
              </span>
            </h2>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-md bg-white px-7 text-[14px] font-medium text-zinc-950 hover:bg-zinc-100"
              >
                <Link href="/signup?next=/orgs/new&product=rfp-engine">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-md border-white/15 bg-white/5 px-7 text-[14px] font-medium text-white hover:bg-white/10"
              >
                <Link href="/contact-sales/rfp-engine">Book a Demo</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
