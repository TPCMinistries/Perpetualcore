#!/usr/bin/env tsx
/**
 * Live test of the OpenAI-swapped drafter. Runs one real generateDraft call
 * with a small fixture and prints the output + measured cost. Disposable.
 *
 * Usage: pnpm exec tsx scripts/test-openai-drafter.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { generateDraft } from "@/lib/rfp/draft/generate";

async function main() {
  const t0 = Date.now();
  const out = await generateDraft({
    opportunity: {
      title: "NYC DYCD Bridge to Health Careers Program",
      agency: "NYC Department of Youth and Community Development",
      brief:
        "Three-year contract for community-based organizations to deliver workforce training for opportunity youth (ages 16-24) toward entry-level healthcare careers (CNA, medical assistant, phlebotomy). Target: 200 youth annually, 70% completion, 60% employment within 90 days of completion at $18+/hr.",
      amount_min: 500_000,
      amount_max: 700_000,
      deadline: "2026-07-31",
      url: "https://passport.cityofnewyork.us/example",
    },
    org: {
      name: "Test Org",
      type: "nonprofit",
      capacity_summary:
        "Community-based workforce dev org serving NYC since 2018. Served ~400 opportunity youth across 6 years; 65% completion across legacy programs.",
    },
  });

  console.log(`\n=== generated in ${(Date.now() - t0) / 1000}s ===`);
  console.log("model:", out.model);
  console.log("tokens in/out:", out.tokens_in, "/", out.tokens_out);
  console.log("cost: $", out.cost_usd.toFixed(4));
  console.log("sections produced:", out.sections.length);
  console.log("\n--- executive_summary preview ---");
  const exec = out.sections.find((s) => s.type === "executive_summary");
  console.log(exec?.content.slice(0, 500) ?? "(missing)");
  console.log("\n--- section type list ---");
  out.sections.forEach((s) => console.log(`  ${s.type}: ${s.content.length} chars`));
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
