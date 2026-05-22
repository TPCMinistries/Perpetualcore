"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Search,
  FileText,
  ShieldCheck,
  Sparkles,
  Mic,
  CheckCircle2,
  XCircle,
  Building2,
  Lock,
} from "lucide-react";

// Status tags surface what ships today vs. what's in beta.
// Lorenzo cares about honesty over breathless promises.
type Stage = "live" | "beta" | "next";

const stageMeta: Record<Stage, { label: string; tone: string }> = {
  live: { label: "Live", tone: "text-emerald-300 border-emerald-400/30 bg-emerald-400/[0.06]" },
  beta: { label: "In private beta", tone: "text-amber-200 border-amber-300/30 bg-amber-300/[0.05]" },
  next: { label: "Next this quarter", tone: "text-zinc-300 border-white/15 bg-white/[0.04]" },
};

const features: { icon: typeof Search; title: string; desc: string; stage: Stage }[] = [
  {
    icon: Search,
    title: "Discovery, every six hours",
    desc: "Scrapers across SAM.gov, Grants.gov, NY State, NYC DYCD, foundation directories, and SBIR.gov. Each opportunity is scored against your org profile. You see the fits — not the noise.",
    stage: "live",
  },
  {
    icon: Building2,
    title: "Multi-tenant orgs and invites",
    desc: "Run one nonprofit, a portfolio of clients, or a dual nonprofit/for-profit stack from one console. Per-org RLS. Invite teammates by email.",
    stage: "live",
  },
  {
    icon: Lock,
    title: "Audit-grade activity log",
    desc: "Every prompt, retrieval, and edit lands in an append-only table. Exportable for FOIA, OIG, and funder audits — the disclosure trail federal buyers are starting to require.",
    stage: "live",
  },
  {
    icon: Mic,
    title: "Voice fingerprint",
    desc: "Trained on your past wins, annual reports, and founder letters so drafts read like you, not like a vendor. In private beta now.",
    stage: "beta",
  },
  {
    icon: FileText,
    title: "Vault-grounded drafting",
    desc: "Every claim cites a real artifact in your vault. Anything we can't ground gets a [VERIFY] flag. Hallucinated partners and fabricated outcomes do not ship. Private beta this month.",
    stage: "beta",
  },
  {
    icon: Sparkles,
    title: "Reviewer + compliance gate",
    desc: "An Opus reviewer scores your draft against the funder's rubric. A deterministic compliance gate checks page rules, attachments, budget math, and deadlines before submit. Ships after the first paid customer files.",
    stage: "next",
  },
];

const competitors = [
  { name: "Instrumentl", role: "Grant database", gap: "Discovery only. You still write everything." },
  { name: "GovWin / Bloomberg", role: "Federal contract intel", gap: "$15K+/yr, no drafting, for-profits only." },
  { name: "Submittable / Bonterra", role: "Grant management", gap: "Built for grantmakers, not the people chasing the money." },
  { name: "ChatGPT / Claude direct", role: "Generic AI", gap: "No voice training, no vault grounding, no audit trail." },
  { name: "Capture consultants", role: "Human capture-as-a-service", gap: "$150–$400/hr. Doesn't scale. Misses opportunities while waiting on humans." },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
      <span className="h-px w-8 bg-zinc-700" />
      {children}
    </div>
  );
}

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

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function RfpEnginePage() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.10),transparent)] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-24 pb-24 lg:pt-32 lg:pb-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-5xl"
          >
            <div className="mb-8 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                Capture operations for nonprofits and small for-profits
              </span>
            </div>

            <h1 className="font-semibold tracking-tight text-white">
              <span className="block text-[clamp(2.25rem,6.5vw,5.25rem)] leading-[1.04]">
                Win the grants
              </span>
              <span className="block text-[clamp(2.25rem,6.5vw,5.25rem)] leading-[1.04] text-zinc-500">
                and contracts
              </span>
              <span
                className="block bg-gradient-to-br from-emerald-200 via-teal-300 to-cyan-300 bg-clip-text pb-2 text-[clamp(2.25rem,6.5vw,5.25rem)] italic leading-[1.05] text-transparent"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                you keep missing.
              </span>
            </h1>

            <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-7">
                <p className="text-lg leading-[1.7] text-zinc-300 md:text-xl">
                  The capture team most nonprofits and small mission-driven companies can&apos;t afford to hire. Discovery now. Voice-trained drafting in private beta. Compliance gate next this quarter.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
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
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-400">
                  14-day trial · No credit card · Discovery feed in your inbox tomorrow
                </p>
              </div>

              {/* Hero metrics tile */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="md:col-span-5"
              >
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-xl">
                  <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                      Discovery feed
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Sample
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { src: "SAM.gov", code: "DOL-ETA-25-014", fit: 94 },
                      { src: "Foundation", code: "RWJF-HE-7821", fit: 88 },
                      { src: "City of NY", code: "DYCD-WLG-2026", fit: 91 },
                    ].map((row) => (
                      <div
                        key={row.code}
                        className="flex items-center justify-between rounded-md border border-white/5 bg-zinc-900/40 px-3 py-2.5"
                      >
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            {row.src}
                          </div>
                          <div className="font-mono text-[12px] text-zinc-200">{row.code}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                            Fit
                          </div>
                          <div className="font-mono text-[14px] font-semibold text-emerald-300">
                            {row.fit}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-zinc-400">
                    Illustrative · Live data resumes once SAM.gov reissues our API key
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* THE WEDGE — pull quote */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl"
          >
            <Eyebrow>The wedge</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Capture is a $90K–$180K human role.{" "}
              <span className="text-zinc-500">
                Most organizations under $5M can&apos;t hire one — so capture gets stolen from delivery.
              </span>
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-12">
              <p className="text-[15px] leading-[1.8] text-zinc-400 md:col-span-7">
                Below that line, capture happens in the hours an ED steals from their program staff. Deadlines get missed. Funders get the same recycled past performance. Fits go unwritten. We&apos;re closing that gap — discovery now, drafting in private beta, the rest this quarter.
              </p>
              <div className="md:col-span-5">
                <div className="border-l-2 border-emerald-400/60 pl-6">
                  <p
                    className="text-[1.5rem] font-light italic leading-snug text-white md:text-[1.75rem]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Find it. Draft it. Ship it.
                  </p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    The three jobs that decide whether you get funded
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WHAT SHIPS — features with stage tags */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-3xl"
          >
            <Eyebrow>What ships today, what&apos;s next</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              The product, honestly labeled.
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-zinc-400">
              Three pieces are live for paying users today. Three more are in private beta. Nothing on this page is marketing wishful thinking.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group relative flex flex-col bg-zinc-950 p-8 transition-colors duration-500 hover:bg-zinc-900/60"
                >
                  <div className="mb-6 flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] transition-colors group-hover:border-emerald-400/40 group-hover:bg-emerald-400/10">
                      <Icon className="h-5 w-5 text-emerald-300" />
                    </div>
                    <StageBadge stage={f.stage} />
                  </div>
                  <h3 className="mb-3 text-[17px] font-semibold tracking-tight text-white">
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] leading-[1.7] text-zinc-400">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <p className="mx-auto mt-10 max-w-3xl text-center font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            We&apos;ll never tell you a feature is live when it isn&apos;t.
          </p>
        </div>
      </section>

      {/* COMPETITIVE */}
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
            <Eyebrow>Why nothing else does this end-to-end</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Half-tools, all{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                around you.
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
              Discovery without drafting is half a tool. Drafting without grounding is a federal liability. Capture without an audit log is a problem waiting to happen.
            </p>
          </motion.div>

          <div className="mx-auto max-w-4xl space-y-2">
            {competitors.map((c, i) => (
              <motion.div
                key={c.name}
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
                  <div className="sm:min-w-[180px]">
                    <p className="text-[15px] font-medium text-white">{c.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {c.role}
                    </p>
                  </div>
                  <p className="flex-1 text-[14px] leading-[1.7] text-zinc-400">{c.gap}</p>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative mt-6 flex items-start gap-5 overflow-hidden rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-transparent p-6"
            >
              <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                <div className="sm:min-w-[180px]">
                  <p className="text-[15px] font-semibold text-white">RFP Engine</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300/80">
                    capture operations, end-to-end
                  </p>
                </div>
                <p className="flex-1 text-[14px] leading-[1.7] text-zinc-300">
                  Discovery, voice-trained drafting, reviewer, compliance, and audit log in one workspace. Multi-entity from day one. Built by operators chasing real federal grants — not by a vendor watching from outside.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRICING TEASE */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <Eyebrow>
              <span className="mx-auto">Pricing</span>
            </Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
              $299 to start. $799 once capture is active.{" "}
              <span
                className="italic text-emerald-300"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Pay more when you win more.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[15px] leading-[1.75] text-zinc-400">
              No long-term contracts at any tier. 25% off for 501(c)(3) under $5M.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-md bg-white px-7 text-[14px] font-medium text-zinc-950 hover:bg-zinc-100"
              >
                <Link href="/rfp/pricing">
                  See Pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
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
              Stop missing the funding
              <br />
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                you should be winning.
              </span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-[15px] leading-[1.75] text-zinc-400">
              14 days free. Tenant set up in four minutes. First Discovery feed in your inbox tomorrow morning.
            </p>
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
                <Link href="/contact-sales/rfp-engine">Talk to Sales</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
