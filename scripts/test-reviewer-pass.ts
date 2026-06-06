#!/usr/bin/env tsx
/**
 * scripts/test-reviewer-pass.ts — disposable smoke test for the reviewer agent.
 *
 * Calls lib/rfp/review/generate.ts directly with a hardcoded opportunity +
 * draft so we can measure latency, cost, and inspect the finding shape
 * without standing up the full HTTP stack or touching the database.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/test-reviewer-pass.ts
 *
 * Optional: --proposal-id <uuid> pulls a real proposal's sections from the
 * DB instead. Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { generateReview } from "../lib/rfp/review/generate";
import type { ReviewerInput } from "../lib/rfp/review/rubric";

// ----------------------------------------------------------------------------
// Fixture — a realistic-but-fake opportunity + first-pass draft. The draft is
// deliberately written with the kinds of weaknesses a federal reviewer would
// flag (vague evidence, missing measurement instruments, [VERIFY] markers
// left behind) so we can confirm the reviewer surfaces them.
// ----------------------------------------------------------------------------

const FIXTURE: ReviewerInput = {
  opportunity: {
    title:
      "Workforce Development for Underserved Healthcare Pathways — FY2026 Demonstration Grant",
    agency: "U.S. Department of Health and Human Services / HRSA",
    brief: `HRSA seeks applications to expand access to entry-level healthcare careers for low-income adults aged 18-26 in high-need urban areas. Successful applicants will (a) recruit and enroll at least 100 participants per program year, (b) provide stackable credentials aligned with state licensure (CNA, EMT, Medical Assistant, or equivalent), (c) document placement into healthcare employment at $18/hr or higher within 6 months of program completion, and (d) report disaggregated outcome data by race, gender, and household income. Page limit: 25 pages for the project narrative.`,
    amount_min: 250000,
    amount_max: 500000,
    deadline: "2026-08-15",
    url: "https://hrsa.gov/grants/fake-fy26-demo",
  },
  sections: [
    {
      section_type: "executive_summary",
      content:
        "Uplift Communities is an evidence-based nonprofit serving young adults in New York City. We will use HRSA funds to launch a healthcare workforce pathway program for underserved youth. We expect to serve [VERIFY: number] participants and place them into family-sustaining careers. The requested amount is $450,000 over 24 months.",
    },
    {
      section_type: "organizational_capacity",
      content:
        "Uplift Communities has been operating since [VERIFY: year founded] and has served thousands of young adults. We have prior DYCD awards and strong partnerships with [VERIFY: hospital partners]. Our staff includes experienced workforce trainers and case managers.\n\nWe operate from offices in Brooklyn and the Bronx and have a track record of program completion rates above the city average.",
    },
    {
      section_type: "project_narrative",
      content:
        "The need is significant. Young adults in NYC face high unemployment and limited access to family-sustaining careers, particularly in healthcare. Our program will address this need by providing evidence-based workforce training.\n\nOur theory of change is that with the right supports, young adults can succeed in healthcare careers. We will provide career counseling, technical training, and case management to ensure participants stay engaged.\n\nActivities include recruitment, intake, training, and job placement. We will use a cohort model with rolling enrollment. The target population is low-income young adults aged 18-26 in the five boroughs.\n\nTimeline: Months 1-3 hiring and curriculum development, Months 4-24 program operations, Months 22-24 evaluation.",
    },
    {
      section_type: "evaluation_plan",
      content:
        "We will measure outcomes including enrollment, completion, certification pass rates, and job placement. Data will be collected via our case management system and reviewed quarterly. Our Program Director will oversee evaluation.",
    },
    {
      section_type: "budget_narrative",
      content:
        "Personnel: [BUDGET: salary for 1.0 FTE Program Director], [BUDGET: salary for 2.0 FTE Workforce Trainers], [BUDGET: 0.5 FTE Case Manager]. Fringe at [VERIFY: org fringe rate]. OTPS: training supplies, transit stipends for participants, evaluation costs, and occupancy. Indirect rate: [VERIFY: federally negotiated rate].",
    },
  ],
};

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY (in .env.local or shell) and retry.");
    process.exit(1);
  }

  console.log("→ Running reviewer pass against fixture...");
  const t0 = Date.now();
  const result = await generateReview(FIXTURE);
  const ms = Date.now() - t0;

  console.log("\n=== Reviewer Result ===");
  console.log(`model         : ${result.model}`);
  console.log(`session_id    : ${result.session_id}`);
  console.log(`tokens_in     : ${result.tokens_in}`);
  console.log(`tokens_out    : ${result.tokens_out}`);
  console.log(`cost_usd      : $${result.cost_usd.toFixed(4)}`);
  console.log(`overall_score : ${result.overall_score}`);
  console.log(`elapsed       : ${ms} ms`);
  console.log(`findings      : ${result.findings.length}`);
  console.log("\nsummary:\n  " + result.summary);

  const bySev: Record<string, number> = {};
  for (const f of result.findings) bySev[f.severity] = (bySev[f.severity] ?? 0) + 1;
  console.log("\nseverity histogram:", bySev);

  console.log("\n--- All findings ---");
  for (const [i, f] of result.findings.entries()) {
    console.log(
      `\n[${i + 1}] ${f.severity.toUpperCase()} · ${f.category} · ${f.section_type}`,
    );
    console.log(`  finding   : ${f.finding}`);
    if (f.excerpt) console.log(`  excerpt   : "${f.excerpt}"`);
    console.log(`  suggestion: ${f.suggestion}`);
  }

  console.log("\n--- Sample finding (raw JSON) ---");
  console.log(JSON.stringify(result.findings[0] ?? null, null, 2));
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
