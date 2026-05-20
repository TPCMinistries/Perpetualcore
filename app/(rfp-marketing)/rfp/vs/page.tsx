"use client";

/**
 * /rfp/vs — Honest comparison page.
 *
 * Compares RFP Engine vs the closest alternatives our buyers actually weigh:
 *   - Instrumentl  (foundation/grant database, no drafting)
 *   - Grants.gov   (free federal portal, no drafting, no scoring)
 *   - OpenGrants   (matching marketplace + consultant network)
 *   - Submittable  (grant management, built for grantmakers)
 *   - ChatGPT/Claude direct (no voice, no vault, no audit)
 *   - Capture consultants ($150-400/hr humans)
 *
 * Rule: ✅ only when the product actually does the thing today. "—" when it
 * doesn't. Honest gaps win trust faster than puffy claims.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X } from "lucide-react";

type Cell = "yes" | "partial" | "no" | string;

interface Row {
  label: string;
  detail?: string;
  cells: Cell[];
}

const COLUMNS = [
  "RFP Engine",
  "Instrumentl",
  "Grants.gov",
  "OpenGrants",
  "Submittable",
  "AI direct",
  "Capture consultants",
];

const ROWS: Row[] = [
  {
    label: "Federal + state + city + foundation discovery",
    detail: "Multi-source feed scored against your org profile.",
    cells: ["yes", "partial", "no", "partial", "no", "no", "yes"],
  },
  {
    label: "Voice-trained drafting in your org's voice",
    detail: "Stylometric profile applied to every draft.",
    cells: ["yes", "no", "no", "no", "no", "no", "yes"],
  },
  {
    label: "Vault-grounded claims with inline citations",
    detail: "Each claim cites a real document chunk in your vault.",
    cells: ["yes", "no", "no", "no", "no", "no", "partial"],
  },
  {
    label: "[VERIFY] markers for unverified facts",
    detail: "Drafter refuses to fabricate org-specific numbers.",
    cells: ["yes", "no", "no", "no", "no", "no", "partial"],
  },
  {
    label: "Reviewer agent with severity-graded findings",
    detail: "Opus pass against funder rubric. 0-100 score.",
    cells: ["yes", "no", "no", "no", "no", "no", "partial"],
  },
  {
    label: "Compliance gate (page limits, budget math, deadlines)",
    detail: "Deterministic checks before submit.",
    cells: ["partial", "no", "no", "no", "no", "no", "yes"],
  },
  {
    label: "Audit-grade activity log",
    detail: "Append-only record of every AI action — exportable for funders, OIG, FOIA.",
    cells: ["yes", "no", "no", "no", "partial", "no", "no"],
  },
  {
    label: "Multi-tenant orgs with RLS",
    detail: "Run one nonprofit, many clients, or dual nonprofit/for-profit.",
    cells: ["yes", "partial", "no", "yes", "yes", "no", "no"],
  },
  {
    label: "Win-fee pricing option",
    detail: "1–3% on awards over $250K, capped at $50K.",
    cells: ["yes", "no", "no", "no", "no", "no", "yes"],
  },
  {
    label: "Starting price",
    cells: [
      "$299/mo",
      "$179/mo",
      "Free",
      "Free + 10%",
      "$5K+/yr",
      "$20/mo",
      "$150–400/hr",
    ],
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

function renderCell(cell: Cell, colIndex: number) {
  if (cell === "yes") {
    return (
      <span
        className={
          colIndex === 0
            ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"
            : "inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800/40 text-zinc-400"
        }
        aria-label="Yes"
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (cell === "partial") {
    return (
      <span
        className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/[0.06] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-amber-200"
        aria-label="Partial"
      >
        partial
      </span>
    );
  }
  if (cell === "no") {
    return (
      <span className="text-zinc-700" aria-label="No">
        <X className="h-4 w-4" />
      </span>
    );
  }
  // string — like a price label
  return (
    <span className="font-mono text-[11px] text-zinc-300">{cell}</span>
  );
}

export default function VsPage() {
  return (
    <main className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <Eyebrow>RFP Engine vs alternatives</Eyebrow>
        <h1
          className="text-4xl leading-tight tracking-tight text-white sm:text-5xl"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <span className="italic">An honest comparison.</span>{" "}
          <span className="text-zinc-500">Including where we fall short.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-zinc-400">
          We get asked "how is this different from {"{tool}"}?" enough that
          here it is in one table. Green check means the product does the
          thing today — not on a roadmap, not behind a sales call. "Partial"
          and dash carry the same standard.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-12 overflow-x-auto rounded-xl border border-white/5 bg-white/[0.02]"
        >
          <table className="w-full min-w-[820px] text-[13px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="sticky left-0 z-10 bg-zinc-950 px-4 py-4 text-left font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                  Capability
                </th>
                {COLUMNS.map((col, i) => (
                  <th
                    key={col}
                    className={`px-3 py-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] ${
                      i === 0 ? "text-emerald-300" : "text-zinc-500"
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-white/5 last:border-0"
                >
                  <th className="sticky left-0 z-10 bg-zinc-950/95 px-4 py-4 text-left align-top font-normal">
                    <div className="text-[14px] text-zinc-100">{row.label}</div>
                    {row.detail ? (
                      <div className="mt-1 max-w-md text-[12px] text-zinc-500">
                        {row.detail}
                      </div>
                    ) : null}
                  </th>
                  {row.cells.map((cell, idx) => (
                    <td
                      key={idx}
                      className={`px-3 py-4 text-center align-middle ${
                        idx === 0
                          ? "bg-emerald-400/[0.03]"
                          : "bg-transparent"
                      }`}
                    >
                      {renderCell(cell, idx)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <div className="mt-10 rounded-xl border border-white/5 bg-white/[0.02] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Where we don't win
          </p>
          <ul className="mt-4 space-y-3 text-[13px] leading-relaxed text-zinc-300">
            <li>
              <span className="text-zinc-100">If you only need discovery</span>{" "}
              — Instrumentl's foundation database is broader than ours
              for private funders today. We catch up as our scraping coverage
              grows, but credit where it's due.
            </li>
            <li>
              <span className="text-zinc-100">If you need a human consultant on retainer</span>{" "}
              — RFP Engine plus a part-time grant writer is the right answer
              for some teams. We make that writer 5× faster, but we're not
              the writer.
            </li>
            <li>
              <span className="text-zinc-100">If you're a foundation accepting applications</span>{" "}
              — Submittable is what you want. We're for the applicant, not
              the grantmaker.
            </li>
          </ul>
        </div>

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
            <Link href="/rfp/pricing">See pricing</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
