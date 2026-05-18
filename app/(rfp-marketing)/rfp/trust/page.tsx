"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  KeyRound,
  Database,
  FileSearch,
  AlertTriangle,
  Bug,
  Users,
  Server,
  Mail,
  Eye,
  CheckCircle2,
  Clock,
} from "lucide-react";

const compliance = [
  {
    standard: "SOC 2 Type II",
    status: "In audit window",
    detail:
      "Type I report available on request to qualified buyers. Type II observation period in progress with an AICPA-affiliated auditor.",
    tone: "progress" as const,
  },
  {
    standard: "GDPR / CCPA",
    status: "Supported",
    detail:
      "DPA available. Customer-controlled data export and deletion. EU sub-processor list maintained on this page.",
    tone: "supported" as const,
  },
  {
    standard: "HIPAA",
    status: "Available on Enterprise",
    detail:
      "BAA executed at Enterprise. PHI features gated behind tenant flag.",
    tone: "supported" as const,
  },
  {
    standard: "FedRAMP",
    status: "On roadmap",
    detail:
      "Targeting FedRAMP Moderate through a 3PAO once federal pipeline justifies the investment. Not authorized today — say so on procurement forms.",
    tone: "roadmap" as const,
  },
  {
    standard: "ISO 27001",
    status: "Aligned, not certified",
    detail:
      "Internal controls mapped to Annex A. We do not hold the certification. We will not claim otherwise.",
    tone: "progress" as const,
  },
  {
    standard: "PCI DSS",
    status: "Out of scope",
    detail:
      "We do not store cardholder data. Stripe is the PCI-certified processor. SAQ A applies.",
    tone: "supported" as const,
  },
];

const subprocessors = [
  { name: "Anthropic", role: "LLM inference (Claude — drafting, reviewer)", region: "US" },
  { name: "OpenAI", role: "Embeddings + auxiliary inference", region: "US" },
  { name: "Supabase", role: "Postgres, auth, storage, row-level security", region: "US (East)" },
  { name: "Vercel", role: "Hosting and edge runtime", region: "US / Global edge" },
  { name: "Resend", role: "Transactional email", region: "US" },
  { name: "Stripe", role: "Payments and subscription billing", region: "US" },
];

const ownership = [
  {
    icon: Database,
    title: "Your vault is yours",
    desc: "Every artifact you upload stays in your tenant. We don&apos;t reuse it across customers, aggregate it for benchmarks, or sell it.",
  },
  {
    icon: Lock,
    title: "Never in training pipelines",
    desc: "Vault content never enters any model training pipeline — ours, Anthropic&apos;s, or OpenAI&apos;s. Zero-retention headers on every inference call where the provider supports it.",
  },
  {
    icon: KeyRound,
    title: "Encrypted, per-tenant keys",
    desc: "AES-256 at rest. TLS 1.2+ in transit. Per-tenant encryption keys mean your vault decrypts under a key no other tenant can derive.",
  },
  {
    icon: ArrowRight,
    title: "Exportable, any time",
    desc: "One-click export of every artifact, draft, revision, and log line. JSON or PDF. No retention lock-in.",
  },
];

const log = [
  {
    ts: "2026-05-09 14:22:08Z",
    actor: "user:liana@example.org",
    action: "RETRIEVE",
    target: "vault://past-perf/dycd-2024-final.pdf",
    note: "rag.k=8 score=0.91",
  },
  {
    ts: "2026-05-09 14:22:11Z",
    actor: "agent:drafter",
    action: "DRAFT.section",
    target: "rfp://DOL-ETA-25-014/need-statement",
    note: "model=claude-sonnet tokens_in=4218",
  },
  {
    ts: "2026-05-09 14:22:47Z",
    actor: "agent:reviewer",
    action: "FLAG",
    target: "draft://need-statement#p3",
    note: "ungrounded_claim → [VERIFY] inserted",
  },
  {
    ts: "2026-05-09 14:24:02Z",
    actor: "user:liana@example.org",
    action: "EDIT.accept",
    target: "draft://need-statement#p3",
    note: "manual_citation_added",
  },
  {
    ts: "2026-05-09 14:31:55Z",
    actor: "user:liana@example.org",
    action: "EXPORT.pdf",
    target: "rfp://DOL-ETA-25-014/submission-v3.pdf",
    note: "compliance_gate=passed sha256=9a3f…b201",
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

const toneStyles: Record<
  "supported" | "progress" | "roadmap",
  { dot: string; label: string; ring: string }
> = {
  supported: { dot: "bg-emerald-400", label: "text-emerald-300", ring: "ring-emerald-400/30" },
  progress: { dot: "bg-amber-300", label: "text-amber-200", ring: "ring-amber-300/30" },
  roadmap: { dot: "bg-zinc-500", label: "text-zinc-400", ring: "ring-zinc-500/30" },
};

export default function RfpTrustPage() {
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
            <div className="mb-8 flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                Trust &amp; Security
              </span>
            </div>

            <h1 className="font-semibold tracking-tight text-white">
              <span className="block text-[clamp(2.25rem,6vw,4.75rem)] leading-[1.04]">
                Built for federal scrutiny.
              </span>
              <span
                className="block bg-gradient-to-br from-emerald-200 via-teal-300 to-cyan-300 bg-clip-text pb-2 text-[clamp(2.25rem,6vw,4.75rem)] italic leading-[1.05] text-transparent"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Open to your auditors.
              </span>
            </h1>

            <div className="mt-10 grid gap-10 md:grid-cols-12 md:gap-8">
              <div className="md:col-span-8">
                <p className="text-lg leading-[1.7] text-zinc-300">
                  Federal program officers, foundation auditors, hospital procurement, and nonprofit boards land here before they sign. So we wrote it for them.
                </p>
                <p className="mt-4 text-[15px] leading-[1.75] text-zinc-500">
                  What follows is what is true today, what is in progress, and what is not yet ours to claim. We will not gloss any of it.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  <Link
                    href="/contact-sales/rfp-engine?intent=security-packet"
                    className="inline-flex items-center gap-2 text-emerald-300 transition-colors hover:text-emerald-200"
                  >
                    <span className="h-px w-6 bg-emerald-400/60" />
                    Request our security packet
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="hidden h-3 w-px bg-zinc-800 sm:inline" />
                  <Link
                    href="mailto:security@perpetualcore.com"
                    className="text-zinc-400 transition-colors hover:text-white"
                  >
                    security@perpetualcore.com
                  </Link>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="md:col-span-4"
              >
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-xl">
                  <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                      Posture
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                      v1.0
                    </span>
                  </div>
                  <dl className="space-y-3 font-mono text-[11px]">
                    {[
                      ["Encryption", "AES-256 / TLS 1.2+"],
                      ["Tenancy", "RLS + per-tenant keys"],
                      ["Training data", "Zero retention"],
                      ["Audit log", "Immutable, exportable"],
                      ["Incident SLA", "24h notification"],
                    ].map((row) => (
                      <div
                        key={row[0]}
                        className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0"
                      >
                        <dt className="uppercase tracking-[0.16em] text-zinc-500">{row[0]}</dt>
                        <dd className="text-zinc-200">{row[1]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DATA OWNERSHIP */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-16 max-w-4xl"
          >
            <Eyebrow>Data ownership</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Your vault is yours.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Forever.
              </span>
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
              Capture documents are sensitive. Past performance, partner letters, salary ranges, theory of change. We treat them like the contracts they are.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-2">
            {ownership.map((o, i) => {
              const Icon = o.icon;
              return (
                <motion.div
                  key={o.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="group relative bg-zinc-950 p-8"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                      <Icon className="h-5 w-5 text-emerald-300" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                      {String(i + 1).padStart(2, "0")} / 04
                    </span>
                  </div>
                  <h3 className="mb-3 text-[17px] font-semibold tracking-tight text-white">
                    {o.title}
                  </h3>
                  <p className="text-[13.5px] leading-[1.7] text-zinc-400">{o.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AUDIT LOG — the remarkable moment */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-4xl"
          >
            <Eyebrow>Audit-grade activity log · Live today</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Every prompt. Every retrieval.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Every edit.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-zinc-400">
              When a federal funder, FOIA request, or OIG investigator asks how AI was used in your submission, you hand them this. Timestamp. User. Agent. Artifact. Outcome.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <ul className="space-y-5 text-[14px] text-zinc-300">
                {[
                  {
                    icon: FileSearch,
                    title: "Retrieval-level granularity",
                    desc: "Not just &lsquo;AI was used.&rsquo; Every vault chunk pulled, every embedding match, every re-rank score.",
                  },
                  {
                    icon: Eye,
                    title: "FOIA-ready, OIG-ready",
                    desc: "JSON or CSV export with a cryptographic hash of the final submission. Drop into a disclosure response.",
                  },
                  {
                    icon: Lock,
                    title: "Append-only by design",
                    desc: "Entries write to an append-only table. Customers cannot delete history. Neither can we.",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                        <Icon className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p
                          className="mt-1 text-[13.5px] leading-[1.7] text-zinc-400"
                          dangerouslySetInnerHTML={{ __html: item.desc }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7"
            >
              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 backdrop-blur-xl">
                <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                    activity_log.tail
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Append-only
                  </span>
                </div>
                <div className="space-y-2">
                  {log.map((row) => (
                    <div
                      key={row.ts + row.action}
                      className="rounded-md border border-white/5 bg-zinc-900/40 px-4 py-3 font-mono text-[11.5px] leading-[1.6]"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-zinc-500">{row.ts}</span>
                        <span className="text-emerald-300">{row.action}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-400">
                        <span className="text-zinc-300">{row.actor}</span>
                        <span className="text-zinc-700">→</span>
                        <span className="break-all text-zinc-200">{row.target}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">{row.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* COMPLIANCE POSTURE */}
      <section className="relative border-b border-white/5">
        <div className="container relative mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-16 max-w-4xl"
          >
            <Eyebrow>Compliance posture</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-white">
              What we hold today.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                What we don&apos;t.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-zinc-400">
              We will never tell you we have a certification we don&apos;t. If a row says &ldquo;in audit window&rdquo; or &ldquo;on roadmap,&rdquo; that is exactly what it means.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {compliance.map((c, i) => {
              const tone = toneStyles[c.tone];
              return (
                <motion.div
                  key={c.standard}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Card className="h-full border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent">
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-[15px] font-semibold tracking-tight text-white">
                          {c.standard}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] ring-1 ${tone.label} ${tone.ring}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                          {c.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-[1.7] text-zinc-400">{c.detail}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TENANCY & ISOLATION */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-4xl"
          >
            <Eyebrow>Tenancy &amp; isolation</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-white">
              No cross-tenant{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                anything.
              </span>
            </h2>
          </motion.div>

          <div className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-3">
            {[
              {
                icon: Database,
                title: "RLS-enforced Postgres",
                desc: "Every vault, draft, and log row carries an organization_id. Postgres RLS policies block any query that doesn&apos;t match the requesting user&apos;s tenant. Verified by automated policy tests.",
              },
              {
                icon: KeyRound,
                title: "Per-org encryption keys",
                desc: "Each org has a dedicated DEK wrapped by a KEK in Supabase Vault. Compromise of one tenant&apos;s key cannot decrypt another&apos;s data.",
              },
              {
                icon: Server,
                title: "No shared model state",
                desc: "We don&apos;t fine-tune shared models on customer data. Voice fingerprints are per-tenant prompt context, never weights.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="group relative bg-zinc-950 p-7"
                >
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
                    <Icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <h3 className="mb-3 text-[17px] font-semibold tracking-tight text-white">
                    {item.title}
                  </h3>
                  <p
                    className="text-[13.5px] leading-[1.7] text-zinc-400"
                    dangerouslySetInnerHTML={{ __html: item.desc }}
                  />
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-10 max-w-6xl"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-6 font-mono text-[11.5px] leading-[1.8] text-zinc-400 md:p-8">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                request lifecycle
              </div>
              <div className="grid gap-1 md:grid-cols-[auto_1fr] md:gap-x-6">
                <span className="text-emerald-300">[1]</span>
                <span>
                  user request <span className="text-zinc-600">→</span> JWT with{" "}
                  <span className="text-zinc-200">org_id</span> claim
                </span>
                <span className="text-emerald-300">[2]</span>
                <span>
                  Postgres session <span className="text-zinc-600">→</span>{" "}
                  <span className="text-zinc-200">SET app.current_org = org_id</span>
                </span>
                <span className="text-emerald-300">[3]</span>
                <span>
                  RLS policy <span className="text-zinc-600">→</span> rows where{" "}
                  <span className="text-zinc-200">organization_id = current_org</span>
                </span>
                <span className="text-emerald-300">[4]</span>
                <span>
                  vault decrypt <span className="text-zinc-600">→</span> per-tenant DEK
                </span>
                <span className="text-emerald-300">[5]</span>
                <span>
                  inference call <span className="text-zinc-600">→</span> zero-retention header,
                  scoped context only
                </span>
                <span className="text-emerald-300">[6]</span>
                <span>
                  log line <span className="text-zinc-600">→</span> append-only audit_events
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI SAFETY */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-16 max-w-4xl"
          >
            <Eyebrow>AI safety</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-white">
              The agent drafts.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                The human submits.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-zinc-400">
              Federal funders are watching for hallucinated partners, fabricated outcomes, autonomous submissions. We engineer the product to make those failure modes impossible.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Vault-grounded drafting",
                desc: "Every claim is generated against retrieved chunks of your vault. The model is constrained to cite (with [CITE: vault-N] markers) or flag (with [VERIFY: …] markers) — never invent. Preview.",
              },
              {
                icon: AlertTriangle,
                title: "[VERIFY] markers",
                desc: "Anything the model can&apos;t ground in your vault is wrapped in a [VERIFY] marker before it lands in the editor. The reviewer re-flags any [VERIFY] that survives editing.",
              },
              {
                icon: Eye,
                title: "Reviewer flags. It does not submit.",
                desc: "The Opus reviewer reads against the funder&apos;s rubric and writes margin notes. It has no submit permission. It will never click Submit on your behalf. Shipping next this quarter.",
              },
              {
                icon: Users,
                title: "Human-in-loop, by architecture",
                desc: "There is no autonomous submission path. The export-to-PDF action requires a logged-in human user with the right scope on that organization. The system refuses otherwise.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Card className="h-full border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent transition-all duration-500 hover:border-emerald-400/30 hover:from-emerald-500/[0.06]">
                    <CardContent className="flex h-full gap-5 p-6 md:p-7">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
                        <Icon className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-[17px] font-semibold tracking-tight text-white">
                          {item.title}
                        </h3>
                        <p className="text-[13.5px] leading-[1.7] text-zinc-400">{item.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SUBPROCESSORS */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto mb-14 max-w-4xl"
          >
            <Eyebrow>Subprocessors</Eyebrow>
            <h2 className="text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-tight text-white">
              Every vendor that touches your data,{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                listed.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-zinc-400">
              We notify customers 30 days before adding a new subprocessor.
            </p>
          </motion.div>

          {/* Mobile-first: cards on small, table on larger */}
          <div className="mx-auto max-w-5xl">
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
              <div className="grid grid-cols-12 gap-4 border-b border-white/10 bg-white/[0.02] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                <div className="col-span-3">Vendor</div>
                <div className="col-span-7">Role</div>
                <div className="col-span-2 text-right">Region</div>
              </div>
              {subprocessors.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-5 last:border-0"
                >
                  <div className="col-span-3 text-[14px] font-medium text-white">{s.name}</div>
                  <div className="col-span-7 text-[13.5px] leading-[1.7] text-zinc-400">
                    {s.role}
                  </div>
                  <div className="col-span-2 text-right font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                    {s.region}
                  </div>
                </motion.div>
              ))}
            </div>

            <ul className="space-y-2 md:hidden">
              {subprocessors.map((s) => (
                <li
                  key={s.name}
                  className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <p className="text-[14px] font-medium text-white">{s.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {s.region}
                    </p>
                  </div>
                  <p className="text-[13px] leading-[1.65] text-zinc-400">{s.role}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* INCIDENT RESPONSE */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-5xl"
          >
            <Eyebrow>Incident response</Eyebrow>
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-6">
                <h2 className="text-[clamp(1.85rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-tight text-white">
                  When something breaks,{" "}
                  <span
                    className="italic text-zinc-500"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    you hear from us first.
                  </span>
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
                  Incident commitments are written into the DPA, not buried in a status page. The clock starts when we know — not when we&apos;re ready to talk about it.
                </p>
              </div>
              <div className="md:col-span-6">
                <ul className="space-y-4">
                  {[
                    {
                      icon: Clock,
                      kpi: "24h",
                      title: "Initial customer notification",
                      desc: "On suspected security incidents affecting customer data. Phone, email, in-product banner.",
                    },
                    {
                      icon: AlertTriangle,
                      kpi: "72h",
                      title: "GDPR Article 33 notification",
                      desc: "Where the incident qualifies as a personal-data breach.",
                    },
                    {
                      icon: FileSearch,
                      kpi: "7d",
                      title: "Public postmortem",
                      desc: "Root cause, blast radius, remediation, changes shipped — published within seven days of resolution.",
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.title}
                        className="flex items-start gap-5 rounded-xl border border-white/5 bg-white/[0.02] p-5"
                      >
                        <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
                          {item.kpi}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-zinc-500" />
                            <p className="text-[14px] font-medium text-white">{item.title}</p>
                          </div>
                          <p className="mt-1.5 text-[13px] leading-[1.7] text-zinc-400">
                            {item.desc}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* VULNERABILITY DISCLOSURE */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-5xl"
          >
            <Eyebrow>Vulnerability disclosure</Eyebrow>
            <div className="grid gap-12 md:grid-cols-12">
              <div className="md:col-span-7">
                <h2 className="text-[clamp(1.85rem,4vw,2.5rem)] font-semibold leading-[1.1] tracking-tight text-white">
                  Found something?{" "}
                  <span
                    className="italic text-zinc-500"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Tell us.
                  </span>
                </h2>
                <p className="mt-5 text-[15px] leading-[1.75] text-zinc-400">
                  Coordinated disclosure. Email{" "}
                  <Link
                    href="mailto:security@perpetualcore.com"
                    className="text-emerald-300 underline-offset-4 hover:underline"
                  >
                    security@perpetualcore.com
                  </Link>{" "}
                  with the issue, repro steps, and any constraints. Acknowledgment within 48 hours.
                </p>
                <p className="mt-4 text-[15px] leading-[1.75] text-zinc-400">
                  Standard window is 90 days from acknowledgment to public disclosure, extendable when remediation requires it. Out of scope: denial of service, social engineering, physical attacks, and findings against third-party subprocessors.
                </p>
                <p className="mt-4 text-[15px] leading-[1.75] text-zinc-400">
                  No paid bounty at launch. We credit researchers by name and link in the relevant postmortem and the in-product changelog.
                </p>
              </div>
              <div className="md:col-span-5">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent p-6 font-mono text-[12px] leading-[1.9] text-zinc-300">
                  <div className="mb-4 flex items-center gap-2 text-zinc-500">
                    <Bug className="h-3.5 w-3.5" />
                    <span className="text-[10px] uppercase tracking-[0.22em]">
                      coordinated disclosure
                    </span>
                  </div>
                  <ul className="space-y-2">
                    <li>
                      <span className="text-emerald-300">→</span> security@perpetualcore.com
                    </li>
                    <li>
                      <span className="text-emerald-300">→</span> 48h acknowledgment
                    </li>
                    <li>
                      <span className="text-emerald-300">→</span> 90d disclosure window
                    </li>
                    <li>
                      <span className="text-emerald-300">→</span> credit on resolution
                    </li>
                    <li>
                      <span className="text-emerald-300">→</span> safe harbor for good-faith research
                    </li>
                  </ul>
                </div>
              </div>
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
            <Eyebrow>
              <span className="mx-auto">Procurement-ready</span>
            </Eyebrow>
            <h2 className="mx-auto max-w-3xl text-[clamp(1.85rem,5vw,3.5rem)] font-semibold leading-[1.04] tracking-tight text-white">
              Send your security questionnaire.{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                We answer fast.
              </span>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-[15px] leading-[1.75] text-zinc-400">
              Security packet, DPA, subprocessor list, architecture diagram, and a 30-minute review with our security lead. Most packets go out within one business day.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-md bg-white px-7 text-[14px] font-medium text-zinc-950 hover:bg-zinc-100"
              >
                <Link href="/contact-sales/rfp-engine?intent=security-packet">
                  Request our security packet
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-md border-white/15 bg-white/5 px-7 text-[14px] font-medium text-white hover:bg-white/10"
              >
                <Link href="/contact-sales/rfp-engine?intent=security-call">
                  <Mail className="mr-2 h-4 w-4" />
                  Talk to our security lead
                </Link>
              </Button>
            </div>
            <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-600">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />
              <span>NDA available · Mutual or one-way · Same day</span>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
