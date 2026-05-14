"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight, Clock } from "lucide-react";

type FeatureStatus = "live" | "beta" | "next";

type PlanFeature = { text: string; status?: FeatureStatus };

type Plan = {
  name: string;
  price: string;
  period: string;
  tagline: string;
  cta: string;
  href: string;
  featured: boolean;
  features: PlanFeature[];
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$299",
    period: "/mo",
    tagline: "Solo founders, EDs, and one-writer shops chasing their first big win.",
    cta: "Start Free Trial",
    href: "/signup?next=/orgs/new&product=rfp-engine&plan=starter",
    featured: false,
    features: [
      { text: "1 user, 1 organization" },
      { text: "Discovery feed (federal + state + city)" },
      { text: "5 drafts per month", status: "beta" },
      { text: "Voice training on 10 vault docs", status: "beta" },
      { text: "Compliance checks", status: "next" },
      { text: "Email support" },
    ],
  },
  {
    name: "Pro",
    price: "$799",
    period: "/mo",
    tagline: "Organizations actively running capture and submitting every month.",
    cta: "Start Free Trial",
    href: "/signup?next=/orgs/new&product=rfp-engine&plan=pro",
    featured: true,
    features: [
      { text: "5 users, 1 organization" },
      { text: "Unlimited Discovery" },
      { text: "25 drafts per month", status: "beta" },
      { text: "Reviewer agent", status: "next" },
      { text: "Compliance agent", status: "next" },
      { text: "Full vault (unlimited artifacts)", status: "beta" },
      { text: "Slack & Teams notifications" },
      { text: "Priority email support" },
    ],
  },
  {
    name: "Agency",
    price: "$2,499",
    period: "/mo",
    tagline: "Consultants, fiscal sponsors, and capture firms running a portfolio.",
    cta: "Start Free Trial",
    href: "/signup?next=/orgs/new&product=rfp-engine&plan=agency",
    featured: false,
    features: [
      { text: "Unlimited users" },
      { text: "Up to 15 client organizations" },
      { text: "White-label exports", status: "next" },
      { text: "Client billing dashboard", status: "next" },
      { text: "Priority support (4-hr response)" },
      { text: "Capture strategist office hours" },
      { text: "All Pro features" },
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "Hospital systems, workforce boards, and federal contractors with procurement.",
    cta: "Talk to Sales",
    href: "/contact-sales?product=rfp-engine&plan=enterprise",
    featured: false,
    features: [
      { text: "Unlimited orgs and users" },
      { text: "Dedicated infrastructure" },
      { text: "SOC 2 documentation" },
      { text: "Named customer success manager" },
      { text: "Custom integrations" },
      { text: "SLA + 24/7 support" },
      { text: "Audit-grade activity logs" },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const faqs = [
  {
    q: "What ships today vs. later?",
    a: "Discovery, multi-tenant orgs and invites, audit logs, and Stripe billing are live. Voice fingerprinting and vault-grounded drafting are in private beta with Uplift Communities right now. Reviewer and compliance gate ship this quarter. We label every feature on the plans so you know what you&apos;re paying for.",
  },
  {
    q: "What&apos;s the free trial?",
    a: "14 days, no credit card. Full Pro features. Run Discovery for two weeks, get your voice fingerprint trained on 5–10 vault docs, and try a draft before you decide.",
  },
  {
    q: "Will my data be used to train models?",
    a: "No. Vault content is yours and never enters any training pipeline. Every prompt and response is logged for your audit, encrypted at rest with per-tenant keys.",
  },
  {
    q: "Does the engine submit on my behalf?",
    a: "By design, no. The last click is human. We get you to submit-ready, not past it.",
  },
  {
    q: "Do you replace our grant writer?",
    a: "No — we make them 3–5× more productive. Their job shifts from drafting from scratch to directing the agent and editing for excellence.",
  },
  {
    q: "Can I change plans?",
    a: "Yes. Upgrade or downgrade anytime. Prorated automatically.",
  },
  {
    q: "What happens if I cancel?",
    a: "You export everything. Vault, drafts, voice fingerprint, logs — your data, always. 30-day retention after cancellation, then permanent deletion.",
  },
  {
    q: "Nonprofit discount?",
    a: "Yes. 25% off all tiers for 501(c)(3) organizations under $5M annual budget. Email sales for verification.",
  },
];

const statusMeta: Record<FeatureStatus, { dot: string; label: string }> = {
  live: { dot: "bg-emerald-400", label: "" },
  beta: { dot: "bg-amber-300", label: "beta" },
  next: { dot: "bg-zinc-500", label: "next" },
};

function FeatureRow({ feature }: { feature: PlanFeature }) {
  const status = feature.status;
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-[1.55] text-zinc-300">
      <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
      <span className="flex-1">
        <span>{feature.text}</span>
        {status && (
          <span
            className={`ml-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400`}
          >
            <span className={`h-1 w-1 rounded-full ${statusMeta[status].dot}`} />
            {statusMeta[status].label || status}
          </span>
        )}
      </span>
    </li>
  );
}

export default function RfpPricingPage() {
  return (
    <main className="relative">
      {/* HEADER */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[460px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.12),transparent)] blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 pt-24 pb-20 lg:pt-32 lg:pb-24">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-7 flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              <span className="h-px w-8 bg-zinc-700" />
              Pricing
              <span className="h-px w-8 bg-zinc-700" />
            </div>
            <h1 className="text-[clamp(2.25rem,5.5vw,4.5rem)] font-semibold leading-[1.02] tracking-tight text-white">
              Pricing that grows
              <br />
              <span
                className="italic text-emerald-300"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                with your wins.
              </span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-[1.75] text-zinc-400 md:text-[16px]">
              Start at $299. Move to Pro the month after your first win. No long-term contracts at any tier. Features in <span className="text-amber-200">private beta</span> or <span className="text-zinc-300">shipping this quarter</span> are labeled — never sold as live.
            </p>
          </motion.div>
        </div>
      </section>

      {/* PRICING GRID */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="lg:col-span-3"
            >
              <PlanCardCompact plan={plans[0]} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6 lg:row-span-2"
            >
              <PlanCardHero plan={plans[1]} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="lg:col-span-3"
            >
              <PlanCardCompact plan={plans[2]} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <PlanCardCompact plan={plans[3]} variant="dark" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="lg:col-span-3"
            >
              <Card className="h-full border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent">
                <CardContent className="flex h-full flex-col justify-between p-6">
                  <div>
                    <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                      All plans include
                    </div>
                    <ul className="space-y-2 text-[12.5px] leading-snug text-zinc-300">
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                        14-day free trial, no card
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                        Vault export anytime
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                        Cancel any time
                      </li>
                    </ul>
                  </div>
                  <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                    25% off for 501(c)(3) under $5M
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Status legend */}
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live today
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Private beta with Uplift
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" /> Next this quarter
            </span>
          </div>
        </div>
      </section>

      {/* WIN FEE */}
      <section className="relative border-b border-white/5">
        <div className="container mx-auto px-4 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-5xl"
          >
            <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.06] via-zinc-900/40 to-zinc-950 p-8 md:p-14">
              <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
              <div className="grid gap-10 md:grid-cols-12 md:items-center">
                <div className="md:col-span-7">
                  <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                    Optional add-on
                  </div>
                  <h3 className="text-2xl font-semibold leading-tight tracking-tight text-white md:text-4xl">
                    Win Fee —
                    <br />
                    <span
                      className="italic text-zinc-400"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      we eat with you, not before.
                    </span>
                  </h3>
                </div>
                <div className="md:col-span-5">
                  <p className="text-[14.5px] leading-[1.75] text-zinc-300">
                    Toggle on at any tier.{" "}
                    <strong className="font-semibold text-white">
                      1–3% of awards over $250K, capped at $50K per award.
                    </strong>{" "}
                    In exchange: priority Reviewer time, a dedicated capture strategist on the bid, weekly check-ins through submission. We only collect when you win.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-6 h-10 rounded-md border-white/15 bg-white/5 px-5 text-[13px] text-white hover:bg-white/10"
                  >
                    <Link href="/contact-sales?product=rfp-engine&topic=win-fee">
                      Discuss Win Fee Terms
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative border-b border-white/5 bg-zinc-950">
        <div className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-14"
            >
              <div className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                <span className="h-px w-8 bg-zinc-700" />
                FAQ
              </div>
              <h2 className="text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-tight text-white">
                Common questions.
              </h2>
            </motion.div>

            <div className="grid gap-x-12 gap-y-2 md:grid-cols-2">
              {faqs.map((f, i) => (
                <motion.div
                  key={f.q}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="border-b border-white/5 py-7"
                >
                  <h3 className="mb-3 text-[16px] font-semibold tracking-tight text-white">
                    {f.q}
                  </h3>
                  <p className="text-[13.5px] leading-[1.75] text-zinc-400">{f.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.16),transparent)] blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl"
          >
            <h2 className="text-[clamp(1.85rem,5vw,3.5rem)] font-semibold leading-[1.04] tracking-tight text-white">
              Ready to stop missing{" "}
              <span
                className="italic text-zinc-500"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                the right RFPs?
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
                <Link href="/contact-sales?product=rfp-engine">Book a Demo</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

/* Plan card variants */

function PlanCardCompact({ plan, variant }: { plan: Plan; variant?: "dark" }) {
  const isDark = variant === "dark";
  return (
    <Card
      className={`group relative h-full overflow-hidden border-white/5 transition-all duration-500 hover:border-white/15 ${
        isDark
          ? "bg-gradient-to-br from-zinc-900 to-zinc-950"
          : "bg-gradient-to-br from-white/[0.04] to-transparent"
      }`}
    >
      <CardContent className="flex h-full flex-col p-6">
        <div className="mb-5">
          <h3 className="mb-1.5 text-[15px] font-semibold tracking-tight text-white">
            {plan.name}
          </h3>
          <p className="mb-5 min-h-[3rem] text-[12.5px] leading-[1.5] text-zinc-500">
            {plan.tagline}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold tracking-tight text-white">
              {plan.price}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              {plan.period}
            </span>
          </div>
        </div>
        <ul className="mb-6 flex-1 space-y-2 border-t border-white/5 pt-5">
          {plan.features.slice(0, 6).map((f) => (
            <FeatureRow key={f.text} feature={f} />
          ))}
        </ul>
        <Button
          asChild
          variant="outline"
          className="h-10 w-full rounded-md border-white/15 bg-white/5 text-[13px] font-medium text-white hover:bg-white/10"
        >
          <Link href={plan.href}>
            {plan.cta}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PlanCardHero({ plan }: { plan: Plan }) {
  return (
    <div className="relative h-full">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-400/40 via-teal-400/20 to-cyan-400/30 opacity-50 blur-md" />
      <Card className="relative h-full overflow-hidden border-emerald-400/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950">
        <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/5 bg-emerald-500/[0.05] px-6 py-3 md:px-8">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
            Most Popular
          </span>
          <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:flex">
            <Clock className="h-3 w-3" />
            14-day trial · no card
          </span>
        </div>

        <CardContent className="flex h-full flex-col p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-12 md:gap-8">
            <div className="md:col-span-7">
              <h3 className="mb-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                {plan.name}
              </h3>
              <p className="mb-8 max-w-xs text-[14px] leading-[1.7] text-zinc-400">
                {plan.tagline}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight text-white md:text-7xl">
                  {plan.price}
                </span>
                <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-zinc-500">
                  {plan.period}
                </span>
              </div>
              <Button
                asChild
                className="mt-10 h-12 w-full rounded-md bg-white text-[14px] font-medium text-zinc-950 hover:bg-zinc-100 sm:w-auto sm:px-8"
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="md:col-span-5">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                What&apos;s included
              </div>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-start gap-3 text-[13.5px] leading-[1.55] text-zinc-200"
                  >
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-emerald-400/15">
                      <Check className="h-2.5 w-2.5 text-emerald-300" />
                    </div>
                    <span className="flex-1">
                      <span>{f.text}</span>
                      {f.status && (
                        <span
                          className={`ml-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-300`}
                        >
                          <span className={`h-1 w-1 rounded-full ${statusMeta[f.status].dot}`} />
                          {statusMeta[f.status].label || f.status}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
