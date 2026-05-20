"use client";

/**
 * /rfp/roi — Interactive ROI calculator.
 *
 * Three sticky inputs:
 *   - proposals per year
 *   - hours per proposal today
 *   - blended hourly rate of whoever currently writes them
 *
 * Output:
 *   - Hours saved per year (assumes 60% time reduction; calibrated to Uplift
 *     dogfood + customer-development conversations, not a guess. Slider lets
 *     the buyer set their own assumption.)
 *   - Dollar value of saved hours
 *   - Net annual ROI vs Pro tier ($9,588 = $799 × 12)
 *
 * v1 has no email gate — Karpathy #2 simplicity. The result shows
 * immediately. CTA below sends qualified leads to /contact-sales/rfp-engine
 * which already feeds the enterprise_demo_requests pipeline.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const PRO_ANNUAL_USD = 9588; // $799/mo × 12 — keep aligned with /rfp/pricing
const DEFAULT_TIME_REDUCTION_PCT = 60;

function formatCurrency(n: number): string {
  if (!Number.isFinite(n)) return "$0";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
      <span className="h-px w-8 bg-zinc-700" />
      {children}
    </div>
  );
}

function FieldNumber({
  label,
  detail,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  detail?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-zinc-100">
        {label}
      </label>
      {detail ? (
        <div className="mt-1 text-[12px] text-zinc-500">{detail}</div>
      ) : null}
      <div className="mt-3 flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clampNumber(Number(e.target.value), min, max))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-400"
        />
        <div className="flex items-baseline gap-1.5 rounded-md border border-white/5 bg-zinc-950/60 px-3 py-1.5">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(clampNumber(Number(e.target.value), min, max))}
            className="w-20 bg-transparent text-right font-mono text-[14px] tabular-nums text-zinc-100 outline-none"
          />
          {suffix ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {suffix}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function RoiPage() {
  const [proposals, setProposals] = useState<number>(12);
  const [hoursEach, setHoursEach] = useState<number>(40);
  const [hourlyRate, setHourlyRate] = useState<number>(75);
  const [reductionPct, setReductionPct] = useState<number>(
    DEFAULT_TIME_REDUCTION_PCT,
  );

  const calc = useMemo(() => {
    const annualHoursToday = proposals * hoursEach;
    const hoursSaved = annualHoursToday * (reductionPct / 100);
    const dollarsSaved = hoursSaved * hourlyRate;
    const netRoi = dollarsSaved - PRO_ANNUAL_USD;
    const roiMultiple = PRO_ANNUAL_USD > 0 ? dollarsSaved / PRO_ANNUAL_USD : 0;
    return {
      annualHoursToday,
      hoursSaved,
      dollarsSaved,
      netRoi,
      roiMultiple,
    };
  }, [proposals, hoursEach, hourlyRate, reductionPct]);

  return (
    <main className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <Eyebrow>ROI calculator</Eyebrow>
        <h1
          className="text-4xl leading-tight tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <span className="italic">What's a 60% time cut</span>{" "}
          <span className="text-zinc-500">worth to your team?</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
          Move the sliders. The result is yours to keep — no email required.
          We base the default 60% reduction on internal dogfood with Uplift
          Communities. Yours will vary; set it to whatever number you'd defend
          in a board meeting.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35 }}
            className="space-y-7 rounded-xl border border-white/5 bg-white/[0.02] p-6 lg:col-span-3"
          >
            <FieldNumber
              label="Proposals per year"
              detail="Federal, foundation, state, city, and renewal applications combined."
              value={proposals}
              onChange={setProposals}
              min={1}
              max={120}
              suffix="proposals"
            />
            <FieldNumber
              label="Hours per proposal today"
              detail="Discovery + drafting + review + compliance, end-to-end."
              value={hoursEach}
              onChange={setHoursEach}
              min={4}
              max={200}
              suffix="hours"
            />
            <FieldNumber
              label="Blended hourly rate of whoever writes them"
              detail="ED time, grant writer time, capture consultant time — your honest weighted rate."
              value={hourlyRate}
              onChange={setHourlyRate}
              min={20}
              max={400}
              step={5}
              suffix="$/hour"
            />
            <FieldNumber
              label="Expected time reduction"
              detail="Our buyers see 50-70%. Pick what you'd defend internally."
              value={reductionPct}
              onChange={setReductionPct}
              min={20}
              max={85}
              step={5}
              suffix="%"
            />
          </motion.div>

          {/* Result */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.04] p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Estimated annual impact
            </div>

            <div className="mt-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                Hours saved
              </div>
              <div className="mt-1 text-3xl font-semibold tabular-nums text-white">
                {Math.round(calc.hoursSaved).toLocaleString()}
              </div>
              <div className="mt-0.5 text-[12px] text-zinc-500">
                of {Math.round(calc.annualHoursToday).toLocaleString()} hours
                spent today
              </div>
            </div>

            <div className="mt-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400">
                Time value saved
              </div>
              <div className="mt-1 text-3xl font-semibold tabular-nums text-white">
                {formatCurrency(calc.dollarsSaved)}
              </div>
            </div>

            <div className="mt-6 border-t border-emerald-400/20 pt-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                Net of Pro tier ($9,588/yr)
              </div>
              <div
                className={`mt-1 text-3xl font-semibold tabular-nums ${
                  calc.netRoi > 0 ? "text-emerald-200" : "text-amber-200"
                }`}
              >
                {calc.netRoi > 0
                  ? `+${formatCurrency(calc.netRoi)}`
                  : formatCurrency(calc.netRoi)}
              </div>
              <div className="mt-1 text-[12px] text-zinc-400">
                {calc.roiMultiple >= 1
                  ? `${calc.roiMultiple.toFixed(1)}× the Pro subscription`
                  : "Below break-even on these inputs — talk to us about Starter or Agency tier."}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Methodology */}
        <div className="mt-12 rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            How we get to 60%
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-300">
            Discovery is the biggest single line item we automate — most teams
            burn 8-15 hours per proposal qualifying opportunities. Voice-trained
            drafting + vault grounding cuts first-draft time roughly in half;
            the reviewer agent absorbs another chunk of the back-and-forth
            review cycle. Compliance and editing time barely move; the writer
            still writes. We don't claim 90% — that math doesn't hold up under
            scrutiny.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-center">
          <Button
            asChild
            className="h-10 rounded-md bg-emerald-400 px-5 text-[13px] font-medium text-zinc-950 hover:bg-emerald-300"
          >
            <Link href="/signup?next=/orgs/new&product=rfp-engine">
              Start free trial <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="h-10 rounded-md border border-white/10 px-5 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.04] hover:text-white"
          >
            <Link href="/contact-sales/rfp-engine">
              Talk to sales
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
