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
  Award,
  Lock,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Discovery, every six hours",
    desc: "We scan SAM.gov, Grants.gov, state portals, NYC DYCD, foundation directories, and SBIR.gov around the clock — and only surface the opportunities that actually fit your org. Kill the 47 funder newsletters.",
  },
  {
    icon: Mic,
    title: "Voice fingerprint",
    desc: "We train on your past wins, annual reports, and founder letters. Drafts come back sounding like you — not like ChatGPT, not like a vendor, not like a template.",
  },
  {
    icon: FileText,
    title: "Vault-grounded drafting",
    desc: "Every claim cites a real artifact in your vault. Anything we can't ground gets a [VERIFY] flag. Hallucinated partners and fabricated outcomes do not ship from this system.",
  },
  {
    icon: ShieldCheck,
    title: "Compliance gate",
    desc: "Page limits, font rules, attachments, budget math, eligibility, deadlines with timezones — checked automatically before submit. You ship clean on the first pass.",
  },
  {
    icon: Sparkles,
    title: "Reviewer agent",
    desc: "An Opus-powered reviewer reads your draft against the funder's rubric and flags weak theory of change, missing logic models, and evaluation gaps before a human reviewer ever sees it.",
  },
  {
    icon: Lock,
    title: "Audit-grade activity log",
    desc: "Every prompt, every retrieval, every edit — logged. The disclosure trail federal funders, FOIA requests, and OIG audits are starting to ask for. You get it by default.",
  },
];

const competitors = [
  { name: "Instrumentl", role: "Grant database", gap: "Discovery only. You still write everything." },
  { name: "GovWin / Bloomberg", role: "Federal contract intel", gap: "$15K+/yr, no drafting, for-profits only." },
  { name: "Submittable", role: "Grant management", gap: "Built for grantmakers, not the people chasing the money." },
  { name: "ChatGPT / Claude direct", role: "Generic AI", gap: "No voice training, no vault, no compliance, no audit trail." },
  { name: "Capture consultants", role: "Human capture-as-a-service", gap: "$150–$400/hr. Doesn't scale. Misses opportunities while waiting on humans." },
];

const moves = [
  {
    icon: Mic,
    title: "Voice fingerprinting",
    sub: "Trained on your wins",
    desc: "The single hardest thing in this category to replicate — and the reason reviewers stop being able to tell who wrote it.",
  },
  {
    icon: FileText,
    title: "Vault-grounded drafting",
    sub: "Every claim cites a source",
    desc: "Every claim cites a real artifact you uploaded. Everything else gets a [VERIFY] marker. Non-negotiable for federal compliance.",
  },
  {
    icon: Building2,
    title: "Multi-entity native",
    sub: "Built for portfolios, day one",
    desc: "Most tools assume one nonprofit. We serve consultants, fiscal sponsors, and dual-mode operators — multiple orgs, multiple voices, one console.",
  },
  {
    icon: Award,
    title: "Built from inside the work",
    sub: "Operator-built, not vendor-built",
    desc: "Every feature is shaped by the people writing real proposals — the staff who lose nights to bad templates, the EDs choosing between delivery and capture. Built for the desk, by the desk.",
  },
  {
    icon: ShieldCheck,
    title: "Audit-grade by default",
    sub: "FOIA-ready logs",
    desc: "Full agent activity logs ready for FOIA, OIG, and funder audits. Federal buyers are starting to require it. You already have it.",
  },
  {
    icon: TrendingUp,
    title: "Pricing that grows with you",
    sub: "$299 → $799 → $2,499",
    desc: "Start at $299. Move to $799 the month after your first win. Scale into Agency or Enterprise once capture becomes a team.",
  },
];

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

export default function RfpEnginePage() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,rgba(16,185,129,0.12),rgba(56,189,248,0.05),rgba(244,114,182,0.08),rgba(16,185,129,0.12))] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-20 pb-24 lg:pt-28 lg:pb-28">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-5xl"
          >
            <div className="mb-8 flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                The grant + contract + proposal engine
              </span>
            </div>

            <h1 className="font-semibold tracking-tight text-white">
              <span className="block text-[clamp(2.5rem,7vw,5.75rem)] leading-[1.02]">
                Win the grants
              </span>
              <span className="block text-[clamp(2.5rem,7vw,5.75rem)] leading-[1.02] text-zinc-400">
                and contracts
              </span>
              <span
                className="block bg-gradient-to-br from-emerald-200 via-teal-300 to-cyan-300 bg-clip-text pb-2 text-[clamp(2.5rem,7vw,5.75rem)] italic leading-[1.05] text-transparent"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                you keep missing.
              </span>
            </h1>

            <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-7">
                <p className="text-lg leading-relaxed text-zinc-300 md:text-xl">
                  Discovery in the morning. Voice-trained draft by lunch. Compliance check before you submit.
                  <span className="block mt-3 text-zinc-400">
                    Three jobs no other product does end-to-end. RFP Engine works the file from the moment a solicitation drops to the moment your PDF is submission-ready.
                  </span>
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    size="lg"
                    asChild
                    className="h-12 rounded-md bg-white px-7 text-[14px] font-medium text-zinc-950 shadow-[0_8px_40px_-8px_rgba(255,255,255,0.4)] hover:bg-zinc-100"
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
                    className="h-12 rounded-md border-white/15 bg-white/5 px-7 text-[14px] font-medium text-white backdrop-blur hover:bg-white/10"
                  >
                    <Link href="/contact-sales?product=rfp-engine">Book a Demo</Link>
                  </Button>
                </div>
                <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                  14-day free trial · No credit card · Live opportunities matched to your org in 60 seconds
                </p>
              </div>

              {/* Hero metrics tile */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="md:col-span-5"
              >
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 backdrop-blur-xl">
                  <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                      Live Capture Feed
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Streaming
                    </span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { src: "SAM.gov", code: "DOL-ETA-25-014", fit: 94 },
                      { src: "Foundation", code: "RWJF-HE-7821", fit: 88 },
                      { src: "City of NY", code: "DYCD-WLG-2026", fit: 91 },
                    ].map((row, i) => (
                      <div
                        key={row.code}
                        className="flex items-center justify-between rounded-md border border-white/5 bg-zinc-900/40 px-3 py-2.5"
                        style={{ animation: `pulse 2.4s ${i * 0.4}s ease-in-out infinite` }}
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
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORY POSITIONING */}
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
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
              Best-in-class for the three jobs{" "}
              <span className="text-zinc-500">that decide whether you get funded.</span>
            </h2>
            <div className="mt-10 grid gap-10 md:grid-cols-12">
              <p className="text-[15px] leading-[1.75] text-zinc-300 md:col-span-8">
                <strong className="font-semibold text-white">Find the right RFP. Draft it in your voice. Ship it clean.</strong> Grant databases stop at discovery. Generic AI hallucinates partners and outcomes. Capture consultants bill $300/hour and still miss deadlines. RFP Engine does all three jobs end-to-end — for federal contracts, foundation grants, state solicitations, and everything in between.
              </p>
              <div className="md:col-span-4">
                <div className="border-l-2 border-emerald-400/60 pl-5">
                  <p
                    className="text-2xl font-light italic leading-snug text-white md:text-3xl"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    One engine. Discovery, drafting, and submission-ready output.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AUDIENCE-AGNOSTIC */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Eyebrow>
              <span className="mx-auto">Who it&apos;s for</span>
            </Eyebrow>
            <h2 className="text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-white">
              If you respond to RFPs,{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                this is for you.
              </span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-[1.8] text-zinc-400 md:text-[16px]">
              Nonprofits chasing federal grants. Mission-driven companies bidding on contracts. Consultants running capture for a dozen clients. The job to be done is the same:{" "}
              <strong className="font-medium text-zinc-200">find it, draft it, ship it.</strong>{" "}
              RFP Engine is built for the job — not the job title.
            </p>
            <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
              <span>Find</span>
              <span className="h-px flex-1 bg-zinc-800" />
              <span>Draft</span>
              <span className="h-px flex-1 bg-zinc-800" />
              <span>Ship</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES — TIMELINE */}
      <section className="relative border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/20 via-transparent to-zinc-950" />
        <div className="container relative mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-3xl"
          >
            <Eyebrow>The lifecycle</Eyebrow>
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
              The whole capture lifecycle.
              <br />
              <span className="text-zinc-500">One workspace.</span>
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-zinc-400">
              From the moment a solicitation drops to the moment your PDF is submission-ready — six agents work the file with you.
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
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="group relative bg-zinc-950 p-8 transition-colors duration-500 hover:bg-zinc-900/60"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-zinc-950 shadow-[0_0_30px_-10px_rgba(16,185,129,0.6)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                      {String(i + 1).padStart(2, "0")} / 06
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold tracking-tight text-white">
                    {f.title}
                  </h3>
                  <p className="text-[13.5px] leading-[1.7] text-zinc-400">{f.desc}</p>
                  <div className="absolute inset-x-8 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-emerald-400/60 via-teal-400/40 to-transparent transition-transform duration-700 group-hover:scale-x-100" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPETITIVE */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-3xl"
          >
            <Eyebrow>Why nothing else does this</Eyebrow>
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
              Half-tools, all{" "}
              <span className="italic text-zinc-500">around you.</span>
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-zinc-400">
              Discovery without drafting is half a tool. Drafting without grounding is a liability. Capture without an audit log is a federal compliance problem waiting to happen.
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
                className="group flex items-start gap-5 border-b border-white/5 py-5 transition-colors hover:bg-white/[0.02]"
              >
                <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-900">
                  <XCircle className="h-3.5 w-3.5 text-zinc-600" />
                </div>
                <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                  <div className="min-w-[180px]">
                    <p className="text-[15px] font-medium text-white">{c.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {c.role}
                    </p>
                  </div>
                  <p className="flex-1 text-[14px] leading-relaxed text-zinc-400">{c.gap}</p>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="relative mt-6 flex items-start gap-5 overflow-hidden rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/[0.08] via-teal-500/[0.04] to-transparent p-6"
            >
              <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                <div className="min-w-[180px]">
                  <p className="text-[15px] font-semibold text-white">RFP Engine</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-300/80">
                    grant + contract + proposal engine
                  </p>
                </div>
                <p className="flex-1 text-[14px] leading-relaxed text-zinc-300">
                  Discovery, voice-trained drafting, reviewer agent, compliance gate, and audit-grade logs in one workspace. Multi-entity from day one. Built by operators chasing real federal grants — not by a vendor watching from the outside.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DEFENSIBILITY — BENTO */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-16 max-w-3xl"
          >
            <Eyebrow>The moat</Eyebrow>
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
              Six moves competitors{" "}
              <span className="italic text-zinc-500">can&apos;t copy.</span>
            </h2>
          </motion.div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-6 md:grid-rows-[auto_auto] lg:grid-cols-12">
            {moves.map((m, i) => {
              const spans = [
                "lg:col-span-5 md:col-span-4",
                "lg:col-span-4 md:col-span-2",
                "lg:col-span-3 md:col-span-3",
                "lg:col-span-3 md:col-span-3",
                "lg:col-span-4 md:col-span-3",
                "lg:col-span-5 md:col-span-3",
              ];
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={`group relative ${spans[i]}`}
                >
                  <Card className="h-full overflow-hidden border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent transition-all duration-500 hover:border-emerald-400/30 hover:from-emerald-500/[0.06]">
                    <CardContent className="flex h-full flex-col p-7">
                      <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] transition-colors group-hover:border-emerald-400/40 group-hover:bg-emerald-400/10">
                          <Icon className="h-4 w-4 text-emerald-300" />
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                          0{i + 1}
                        </span>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold tracking-tight text-white">
                        {m.title}
                      </h3>
                      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.15em] text-emerald-300/80">
                        {m.sub}
                      </p>
                      <p className="mt-auto text-[13.5px] leading-[1.7] text-zinc-400">
                        {m.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING TEASE */}
      <section className="relative border-b border-white/5 bg-zinc-950">
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
            <h2 className="text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.05] tracking-tight text-white">
              Pricing that grows{" "}
              <span
                className="italic text-emerald-300"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                with your wins.
              </span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
              $299 to start. $799 once capture is active. $2,499 for agencies running multiple clients. Custom for federal contractors and hospital systems.
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
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.20),transparent)] blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="mx-auto max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)] font-semibold leading-[1.02] tracking-tight text-white">
              Stop missing the funding
              <br />
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                you should be winning.
              </span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-[15px] leading-relaxed text-zinc-400">
              14-day free trial. Tenant set up in four minutes. First Discovery feed in your inbox tomorrow morning.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-md bg-white px-7 text-[14px] font-medium text-zinc-950 shadow-[0_8px_40px_-8px_rgba(255,255,255,0.4)] hover:bg-zinc-100"
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
                className="h-12 rounded-md border-white/15 bg-white/5 px-7 text-[14px] font-medium text-white backdrop-blur hover:bg-white/10"
              >
                <Link href="/contact-sales?product=rfp-engine">Talk to Sales</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
