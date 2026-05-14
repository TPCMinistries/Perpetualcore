#!/usr/bin/env tsx
/**
 * Sanity test for Voice Fingerprint v1.
 *
 * Reads 3 fake-but-realistic past-proposal-style documents, runs extraction
 * through `extractVoiceFingerprint`, prints the resulting fingerprint, then
 * runs ONE call to `generateDraft` against a fake opportunity twice — once
 * WITHOUT the fingerprint and once WITH it — and prints the executive_summary
 * sections side-by-side.
 *
 * This is a sanity check, NOT a unit test. Deletable after Lorenzo reviews.
 *
 * Usage:
 *   npx tsx scripts/test-voice-fingerprint.ts
 *
 * Requires ANTHROPIC_API_KEY in .env.local.
 *
 * Cost: ~$0.20-0.50 (one Opus extraction + two Sonnet drafts).
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Import after dotenv.
import { extractVoiceFingerprint } from "../lib/rfp/voice/extract";
import { generateDraft, type DraftInput } from "../lib/rfp/draft/generate";

// ── Fake documents ──────────────────────────────────────────────────────────
//
// Voice profile we're trying to elicit: short sentences, neighborly register,
// names people before programs, avoids "stakeholders" and "leverage".

const DOC_A = `2024 Annual Letter — Uplift Communities

Dear neighbors,

This year you helped Aisha get her CNA license. You helped Marcus open a savings account for the first time in his life. You helped 47 families in East Flatbush keep the lights on through the winter.

The work is small on purpose. We work block by block. We answer the phone when somebody calls.

Three things we learned this year. First, the gap between "wants to work" and "got hired" is paperwork. Second, the gap between "got hired" and "stayed hired" is childcare. Third, the gap between "stayed hired" and "saved money" is a checking account at a bank that doesn't shame you.

We took those three findings and we built three programs around them. We named them after the people they help, not the funders who paid for them.

If you want to know what we're doing in 2025, call Tasha at the office. She picks up.

— The Uplift team
`;

const DOC_B = `Concept Paper — DYCD Workforce 2024

The applicant is Uplift Communities. We are based on Linden Boulevard in East Flatbush.

We propose to enroll 120 young adults aged 18-24 in a 12-week healthcare credential pathway. Of those 120, we expect 96 to finish the course and 78 to be hired into roles paying at or above $19/hour within 90 days of completion.

We have done this exact program three times. Cohort 1 enrolled 32 and placed 24. Cohort 2 enrolled 45 and placed 36. Cohort 3 enrolled 51 and placed 41. We know what we are doing. We also know what we are not doing — we are not running a job fair, we are not handing out resume binders, and we are not "leveraging community partnerships."

What we do is sit with one person for one hour and figure out what is in their way. Then we move it.

The pathway has three components. CNA prep with Kingsborough Community College. Childcare voucher coordination with ACS. Wraparound case management from a staff member who lives in the same zip code as the participant.

We name our case managers in the appendix. They are real people and you can call them.
`;

const DOC_C = `Founder Memo — Why We Don't Use the Word "Stakeholder"

A donor asked us last week why our materials never say "stakeholder." Fair question. Here's the answer.

A stakeholder is somebody who owns a piece of a thing. The people we work with don't own a piece of our programs. They ARE the programs. Calling them stakeholders puts them on the same conceptual footing as the board, the funders, and the city contracting officers. They are not on the same footing.

We also don't say "leverage." If we have a partnership with a local clinic, we say "we work with Brookdale." We don't say "we leverage our Brookdale partnership." It sounds like we're squeezing them for something.

We try to write the way Tasha talks on the phone. Tasha is our intake coordinator. She has been at Uplift for nine years. She does not say "synergy." She says "let me see if Marcus is free."

That's the test for any sentence in our materials. Would Tasha say it on the phone? If no, we cut it.
`;

const FAKE_OPP = {
  title: "Workforce Innovation Fund — Healthcare Career Pathways for Disconnected Youth",
  agency: "NYC Department of Youth and Community Development",
  brief:
    "Seeks proposals from community-based organizations to deliver 12-week healthcare credential training and job placement services for 18-24 year olds not currently in school or employment. Expected outcomes: at least 75 percent course completion and 60 percent placement at or above $18/hr.",
  amount_min: 250_000,
  amount_max: 500_000,
  deadline: "2026-08-15",
  url: "https://example.com/dycd-rfp",
};

const FAKE_ORG: DraftInput["org"] = {
  name: "Uplift Communities",
  type: "nonprofit",
  capacity_summary:
    "10-staff, East Flatbush-based workforce nonprofit. 3 prior healthcare pathway cohorts (32/45/51 enrolled, 75-80% placement). Founder-led 2019-present.",
};

// ── Run ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY missing. Add it to .env.local and retry.");
    process.exit(2);
  }

  console.log("=== Voice Fingerprint Sanity Test ===\n");
  console.log(`Extracting fingerprint from ${3} documents…`);

  const t0 = Date.now();
  const extraction = await extractVoiceFingerprint([DOC_A, DOC_B, DOC_C]);
  const tExtract = Date.now() - t0;

  console.log(`\nExtraction complete in ${(tExtract / 1000).toFixed(1)}s`);
  console.log(
    `  tokens: ${extraction.tokens_in.toLocaleString()} in · ${extraction.tokens_out.toLocaleString()} out`,
  );
  console.log(`  cost:   $${extraction.cost_usd.toFixed(4)}`);
  console.log(`  model:  ${extraction.model}\n`);

  console.log("Fingerprint:");
  console.log(JSON.stringify(extraction.fingerprint, null, 2));
  console.log();

  console.log("=== Generating draft WITHOUT voice ===\n");
  const t1 = Date.now();
  const draftNoVoice = await generateDraft({
    opportunity: FAKE_OPP,
    org: FAKE_ORG,
  });
  console.log(
    `  done in ${((Date.now() - t1) / 1000).toFixed(1)}s · $${draftNoVoice.cost_usd.toFixed(4)} · voice_applied=${draftNoVoice.voice_applied}`,
  );

  console.log("\n=== Generating draft WITH voice ===\n");
  const t2 = Date.now();
  const draftWithVoice = await generateDraft({
    opportunity: FAKE_OPP,
    org: FAKE_ORG,
    voiceFingerprint: extraction.fingerprint,
  });
  console.log(
    `  done in ${((Date.now() - t2) / 1000).toFixed(1)}s · $${draftWithVoice.cost_usd.toFixed(4)} · voice_applied=${draftWithVoice.voice_applied}`,
  );

  const exNo = draftNoVoice.sections.find((s) => s.type === "executive_summary");
  const exYes = draftWithVoice.sections.find((s) => s.type === "executive_summary");

  console.log("\n--- Executive summary WITHOUT voice ---\n");
  console.log(exNo?.content ?? "(no executive_summary parsed)");

  console.log("\n\n--- Executive summary WITH voice ---\n");
  console.log(exYes?.content ?? "(no executive_summary parsed)");

  console.log("\n\n=== Totals ===");
  console.log(
    `  extraction:  $${extraction.cost_usd.toFixed(4)} (${extraction.model})`,
  );
  console.log(`  draft (no):  $${draftNoVoice.cost_usd.toFixed(4)} (${draftNoVoice.model})`);
  console.log(`  draft (yes): $${draftWithVoice.cost_usd.toFixed(4)} (${draftWithVoice.model})`);
  const total =
    extraction.cost_usd + draftNoVoice.cost_usd + draftWithVoice.cost_usd;
  console.log(`  TOTAL:       $${total.toFixed(4)}`);
}

main().catch((err) => {
  console.error("FAILED:", err instanceof Error ? err.message : err);
  process.exit(1);
});
