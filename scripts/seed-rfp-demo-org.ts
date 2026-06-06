#!/usr/bin/env tsx
/**
 * scripts/seed-rfp-demo-org.ts — Demo Org seeder for the RFP Engine.
 *
 * One-shot script that creates a fully-populated demo org so Lorenzo can show
 * prospects an instant working dashboard without manually clicking through
 * onboarding (org create → voice train → vault upload → opportunity discovery
 * → draft → review).
 *
 * What it writes (in dependency order):
 *   1. rfp_orgs row            — "Demo Org · <iso-timestamp>"
 *   2. rfp_user_orgs row       — owner membership for $RFP_DEMO_USER_ID
 *   3. rfp_orgs.voice_fingerprint update — realistic stylometric profile
 *   4. rfp_vault_artifacts x5  — annual report / founder letter / evaluation
 *                                excerpts. embedding=NULL on purpose; the
 *                                retriever skips rows without embeddings.
 *   5. rfp_opportunities x3    — federal-stub + NY State + NYC PASSPort
 *   6. rfp_opp_matches x3      — one fit-score row per opportunity for this org
 *   7. rfp_proposals x2        — a recent draft + an older 'won' proposal
 *      + rfp_proposal_sections — 5 dummy section rows for the won proposal
 *                                plus 1 reviewer_findings_v1 JSON row
 *      + rfp_proposals.vault_chunks_used (jsonb) on the draft so citation
 *                                pills render in the demo
 *   8. rfp_agent_sessions x6   — drafter_v1 + reviewer_v1 + voice_trainer_v1
 *                                runs spread across the past 14 days
 *
 * Run:
 *   npx tsx scripts/seed-rfp-demo-org.ts
 *
 * Env:
 *   RFP_DEMO_USER_EMAIL  — email of the auth.user who will own the demo org
 *   RFP_DEMO_USER_ID     — uuid of that auth.user; optional when
 *                          RFP_DEMO_USER_PASSWORD is provided
 *   RFP_DEMO_USER_PASSWORD — optional; when provided, the script creates or
 *                            resets the auth user and prints E2E env exports
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Safety: if any step after the org insert fails, we compensating-delete the
 * org row. rfp_user_orgs / vault / opp_matches / proposals / sections /
 * agent_sessions all FK -> rfp_orgs ON DELETE CASCADE, so the rollback is
 * a single statement that cleans up everything we wrote.
 *
 * This script uses createAdminClient() per CLAUDE.md mandate for
 * background/server operations.
 */

import * as dotenv from "dotenv";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

// Load env BEFORE importing anything that touches process.env at import time.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { createAdminClient } from "../lib/supabase/server";
import type { Database, Json } from "../lib/supabase/database.types";
import type { VoiceFingerprint } from "../lib/rfp/voice/extract";
import { VAULT_DOC_TYPES, type VaultDocType } from "../lib/rfp/vault/upload";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";

// ── env validation ─────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v || v.trim() === "") {
    throw new Error(
      `Missing required env var: ${key}. Set it in .env.local before running this script.`,
    );
  }
  return v;
}

const DEMO_USER_EMAIL = requireEnv("RFP_DEMO_USER_EMAIL");
const DEMO_USER_PASSWORD = process.env.RFP_DEMO_USER_PASSWORD?.trim() || null;
const DEMO_USER_ID_FROM_ENV = process.env.RFP_DEMO_USER_ID?.trim() || null;
if (!DEMO_USER_ID_FROM_ENV && !DEMO_USER_PASSWORD) {
  throw new Error(
    "Missing RFP_DEMO_USER_ID. Provide it for an existing user, or set RFP_DEMO_USER_PASSWORD so the seeder can create/reset the E2E auth user.",
  );
}
requireEnv("NEXT_PUBLIC_SUPABASE_URL");
requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const RFP_BASE_URL =
  process.env.RFP_DASHBOARD_BASE_URL ?? "https://rfp.perpetualcore.com";

// ── deterministic demo data ────────────────────────────────────────────────

const NOW = new Date();
const ISO = NOW.toISOString();
const ORG_NAME = `Demo Org · ${ISO}`;
const ORG_NAICS = ["624190", "611310"]; // Other Individual & Family Services; Educational Support Services

/** ISO timestamp N days ago (or in the future for a positive N value to deadline). */
function daysAgo(n: number): string {
  const d = new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000);
  return d.toISOString();
}
function daysFromNow(n: number): string {
  return daysAgo(-n);
}

// ── Voice fingerprint — realistic Uplift-Communities-style profile ─────────

const DEMO_VOICE_FINGERPRINT: VoiceFingerprint = {
  version: 1,
  extracted_at: ISO,
  source_doc_count: 5,
  sentence_length: { mean: 96, stdev: 38 },
  paragraph_length: { mean: 3.4, stdev: 1.6 },
  signature_phrases: [
    "block by block",
    "we answer the phone when somebody calls",
    "we count what we do",
    "we work with neighbors, not stakeholders",
    "the gap between wants-to-work and got-hired is paperwork",
    "named after the people they help, not the funders who paid for them",
    "a checking account at a bank that doesn't shame you",
  ],
  framing_patterns: [
    "Leads with a named beneficiary (first name + outcome) before stating the program or funding amount.",
    "Positions interventions as continuations of existing community work rather than new programs.",
    "Names a specific neighborhood, ZIP code, or partner institution before naming the program.",
    "Closes with a measurable counted outcome from the prior year, not a forward-looking promise.",
  ],
  avoided_terms: [
    "stakeholders",
    "leverage",
    "synergy",
    "innovative",
    "impactful",
    "robust ecosystem",
    "best practices",
  ],
  register: "neighborly",
  voice_summary:
    "Writes in plain second-person when describing community work, then shifts to evidentiary third-person for outcomes. Leads with a person, not a program. Names specific neighborhoods and partner institutions. Avoids policy abstractions and grant-speak — uses 'neighbors' rather than 'stakeholders' and counts what it does rather than describing it as 'impactful'.",
};

// ── Vault chunks — five realistic excerpts (no embeddings) ─────────────────

interface VaultSeed {
  title: string;
  type: VaultDocType;
  body: string;
}

const VAULT_SEEDS: VaultSeed[] = [
  {
    title: "FY2024 Annual Report — Excerpt: Healthcare Credential Pathway",
    type: "annual_report",
    body: `In 2024, our healthcare credential pathway enrolled 51 young adults aged 18–24 across East Flatbush, Brownsville, and Cypress Hills. Of those, 41 sat for the CNA exam and 36 passed on first attempt. 31 were hired into roles paying at or above $19/hour within 90 days of credentialing. Partner employers were Brookdale University Hospital, ArchCare at Carmel Richmond, and Atria Senior Living. We count what we do because the funder shouldn't have to take our word for it.`,
  },
  {
    title: "Founder Letter — Winter 2024",
    type: "founder_letter",
    body: `Dear neighbors,\n\nThis year you helped Aisha get her CNA license. You helped Marcus open a savings account for the first time in his life. You helped 47 families in East Flatbush keep the lights on through the winter.\n\nThe work is small on purpose. We work block by block. We answer the phone when somebody calls. We do not say "stakeholders" and we do not say "leverage." We say neighbors and we say "we work with Brookdale." We try to write the way Tasha talks on the phone.`,
  },
  {
    title: "External Evaluation Summary — KBCC Workforce Cohort 3",
    type: "case_study",
    body: `The Kingsborough Community College–Uplift Communities healthcare cohort (n=51) was evaluated against a matched comparison group (n=49) using Department of Labor wage records and NY State Department of Health credentialing data. At 12 months post-credential, treatment group median wages were $19.40/hour vs. $13.10/hour in the comparison group (p<0.001). Retention at 12 months was 71% (treatment) vs. 38% (comparison). The evaluation was conducted by Dr. Marcus Reynolds at the CUNY Institute for State and Local Governance.`,
  },
  {
    title: "Past Proposal — NYC DYCD Compass Concept Paper (Funded 2023)",
    type: "past_proposal",
    body: `Uplift Communities requests $385,000 over 12 months to expand the Healthcare Credential Pathway from 51 to 120 young adults in NYC Community Districts 17, 16, and 5. The gap between wants-to-work and got-hired is paperwork — birth certificates, high school transcripts, fingerprint cards, immunization records. We close that gap on-site at our Linden Boulevard center with a paid two-week pre-enrollment intensive. Partners: Brookdale University Hospital (clinical placements), Kingsborough Community College (credential instruction), Single Stop NYC (benefits navigation).`,
  },
  {
    title: "Board Memo — Theory of Change v3",
    type: "policy",
    body: `Theory of Change: poverty in our service area is not an information problem or a motivation problem. It is a paperwork and trust problem. We intervene at three points: (1) the gap between wants-to-work and got-hired (paperwork — birth certificates, transcripts, fingerprinting, immunizations), (2) the gap between got-hired and stayed-hired (childcare, transportation, the first two paychecks of float), and (3) the gap between stayed-hired and saved-money (a checking account at a bank that doesn't shame you). Each intervention is delivered by named staff at a fixed physical location, not by a referral.`,
  },
];

// ── Opportunities ──────────────────────────────────────────────────────────

interface OppSeed {
  source: "sam_gov" | "ny_state" | "nyc_dycd";
  source_id: string;
  title: string;
  agency: string;
  type: string;
  brief: string;
  keywords: string[];
  geo: string;
  url: string;
  amount_min: number;
  amount_max: number;
  posted_days_ago: number;
  deadline_days_ahead: number;
}

const OPP_SEEDS: OppSeed[] = [
  {
    source: "sam_gov",
    source_id: "HRSA-25-DEMO-001",
    title: "Health Workforce Training Grants — Direct Care Workforce Initiative",
    agency: "U.S. Health Resources and Services Administration (HRSA)",
    type: "Cooperative Agreement",
    brief:
      "Supports community-based organizations training young adults (18–24) for in-demand healthcare credentials in underserved urban areas. Priority on CNA, HHA, and CMA pathways with documented post-credential employment outcomes.",
    keywords: [
      "healthcare workforce",
      "direct care",
      "CNA",
      "HHA",
      "workforce development",
      "youth employment",
      "credentialing",
    ],
    geo: "US",
    url: "https://sam.gov/opp/HRSA-25-DEMO-001",
    amount_min: 200_000,
    amount_max: 750_000,
    posted_days_ago: 11,
    deadline_days_ahead: 38,
  },
  {
    source: "ny_state",
    source_id: "NYSED-WIOA-Y25-DEMO-014",
    title: "WIOA Youth Workforce Investment — Healthcare Sector Partnerships",
    agency: "New York State Department of Labor",
    type: "Grant",
    brief:
      "Funds sector-based workforce partnerships serving out-of-school youth (18–24) in NY State. Priority on partnerships with at least one accredited healthcare employer and one credentialing institution.",
    keywords: [
      "WIOA",
      "youth",
      "sector partnerships",
      "healthcare",
      "workforce",
      "out-of-school youth",
    ],
    geo: "NY",
    url: "https://grantsmanagement.ny.gov/opp/NYSED-WIOA-Y25-DEMO-014",
    amount_min: 150_000,
    amount_max: 400_000,
    posted_days_ago: 6,
    deadline_days_ahead: 22,
  },
  {
    source: "nyc_dycd",
    source_id: "DYCD-CDP-25-DEMO-003",
    title: "Compass NYC — Community Development Program — Workforce Track",
    agency: "NYC Department of Youth and Community Development (PASSPort)",
    type: "Concept Paper",
    brief:
      "Compass NYC's workforce track funds community-based organizations delivering credential-to-job pathways for NYC residents aged 16–24 in DYCD-priority neighborhoods. Concept Paper stage; full RFP issued to shortlisted applicants.",
    keywords: [
      "DYCD",
      "Compass",
      "concept paper",
      "PASSPort",
      "youth workforce",
      "credential to job",
      "community-based",
    ],
    geo: "NYC",
    url: "https://passport.cityofnewyork.us/page/opportunity/DYCD-CDP-25-DEMO-003",
    amount_min: 120_000,
    amount_max: 385_000,
    posted_days_ago: 3,
    deadline_days_ahead: 14,
  },
];

// ── Proposal section content (won proposal) ───────────────────────────────

const WON_PROPOSAL_SECTIONS: Array<{ section_type: string; content: string }> = [
  {
    section_type: "executive_summary",
    content: `Uplift Communities requests $385,000 over 12 months to expand the Healthcare Credential Pathway from 51 to 120 young adults (ages 18–24) across NYC Community Districts 17, 16, and 5. In 2024, 36 of 41 participants who sat for the CNA exam passed on first attempt; 31 were hired into roles at or above $19/hour within 90 days. This proposal scales that proven model by adding a second cohort site at Kingsborough Community College and deepening clinical partnerships with Brookdale University Hospital and ArchCare.`,
  },
  {
    section_type: "organizational_capacity",
    content: `Uplift Communities has operated continuously in central Brooklyn since 2017, with prior workforce awards from the Robin Hood Foundation ($240K, 2022), the Pinkerton Foundation ($175K, 2023), and NYC DYCD Compass ($310K, 2022–24). Our Linden Boulevard center is staffed by 11 full-time employees including two Department of Health–licensed CNA instructors and a Single Stop NYC–trained benefits navigator. Our 990s, audited financials, and external evaluations are public at upliftcommunities.org/transparency.\n\nIn 2024 we enrolled 51 young adults in the Healthcare Credential Pathway. Partners were Brookdale University Hospital (clinical placements), Kingsborough Community College (credential instruction), and Atria Senior Living (post-hire mentorship).`,
  },
  {
    section_type: "project_narrative",
    content: `The gap between wants-to-work and got-hired is paperwork — birth certificates, high school transcripts, fingerprint cards, immunization records. The gap between got-hired and stayed-hired is childcare, transportation, and float for the first two paychecks. We close those gaps on-site at our Linden Boulevard center.\n\nProject activities (12-month timeline):\nMonths 1–2 — Outreach + intake at three referral sites (NYC HRA Job Center 67, BMS Family Health Center, Brownsville Multi-Service Family Health Center). Target: 160 referrals, 120 enrollments.\nMonths 2–4 — Paid two-week pre-enrollment intensive (paperwork + on-ramp). 95% retention to Week 3 historically.\nMonths 3–10 — 14-week CNA curriculum delivered by KBCC-credentialed instructors at our Linden Boulevard center, 6 hours/day, 4 days/week. Stipend of $400/week paid by the program (drawn down via OTPS line 4.2).\nMonths 6–11 — Clinical rotations at Brookdale and ArchCare facilities (state-required 100 hours).\nMonths 10–12 — CNA exam (NY Department of Health). Job placement via partner employer pipeline. Target: 75% pass rate, 70% placement within 90 days at $19/hour or higher.\n\nWe count what we do because the funder shouldn't have to take our word for it.`,
  },
  {
    section_type: "evaluation_plan",
    content: `Indicators and data sources:\n1. Enrollment count (target: 120) — internal CRM, audited quarterly.\n2. CNA exam pass rate (target: ≥75%) — NY DOH credentialing records.\n3. 90-day placement rate at ≥$19/hour (target: ≥70%) — NY DOL wage records, supplemented by employer attestation.\n4. 12-month retention in healthcare employment (target: ≥65%) — NY DOL wage records + participant follow-up survey at month 12.\n5. Participant-reported financial well-being (target: 70% report improvement) — FINRA Financial Capability Survey, administered at intake and month 12.\n\nMeasurement schedule: baseline at intake; mid-program at exam date; outcomes at month 6, 9, and 12 post-credential. Evaluation oversight: Dr. Marcus Reynolds at the CUNY Institute for State and Local Governance, who led our 2024 third-party evaluation.`,
  },
  {
    section_type: "budget_narrative",
    content: `Personnel + fringe ($212,000, 55%): 1.0 FTE Program Director ($85K salary), 2.0 FTE CNA Instructors ($65K each), 0.5 FTE Benefits Navigator ($30K of $60K), 0.25 FTE Evaluator ($22.5K of $90K). Fringe at 28%.\n\nParticipant stipends ($96,000, 25%): 120 participants × $400/week × 2 weeks pre-enrollment = $96,000 (OTPS line 4.2). Stipends are taxable income, reported on 1099-MISC.\n\nClinical placement fees ($24,000, 6%): $200/participant × 120 paid to Brookdale and ArchCare per the established clinical partnership agreements (executed 2022).\n\nEvaluation ($18,000, 5%): subcontract to CUNY Institute for State and Local Governance for 12-month outcome study.\n\nOTPS ($24,000, 6%): supplies (uniforms, textbooks, exam fees at $115/participant), occupancy (allocated portion of Linden Boulevard lease).\n\nIndirect ($11,000, 3%): NICRA-approved rate of 14.6% applied only to direct salaries (not stipends or subcontracts).\n\nTotal: $385,000. No double-counting with our DYCD Compass award ($310K, separate cohort).`,
  },
];

// ── Reviewer findings (persisted as a JSON-stringified row) ────────────────

import { REVIEWER_FINDINGS_SECTION_TYPE } from "../lib/rfp/review/rubric";

const DEMO_REVIEWER_FINDINGS = {
  findings: [
    {
      category: "outcomes_clarity",
      severity: "medium",
      section_type: "evaluation_plan",
      excerpt: "Participant-reported financial well-being (target: 70% report improvement)",
      finding:
        "The 70% improvement target lacks a definition of 'improvement' on the FINRA scale. Reviewers will read this as soft.",
      suggestion:
        "Specify the threshold (e.g., ≥1 point improvement on the FINRA Financial Capability Index, or movement out of the bottom quartile).",
    },
    {
      category: "specificity",
      severity: "low",
      section_type: "organizational_capacity",
      excerpt: "Robin Hood Foundation ($240K, 2022)",
      finding:
        "Prior award amounts are listed but not tied to specific project outcomes — capacity narrative reads as a list of money rather than a record of delivery.",
      suggestion:
        "Add one sentence per prior award naming the outcome delivered (e.g., '$240K, 2022 — funded the first cohort of 32 participants, of whom 24 placed in healthcare roles').",
    },
    {
      category: "compliance",
      severity: "high",
      section_type: "budget_narrative",
      excerpt: "Indirect ($11,000, 3%): NICRA-approved rate of 14.6%",
      finding:
        "Indirect at 14.6% is below the 10% de minimis rate most federal funders allow without a NICRA. If you do have a NICRA, the proposal should reference the cognizant agency and date.",
      suggestion:
        "Add NICRA cognizant agency + effective date in the budget narrative or include the NICRA letter as an attachment.",
    },
    {
      category: "evidence",
      severity: "medium",
      section_type: "project_narrative",
      excerpt: "95% retention to Week 3 historically",
      finding:
        "The 95% retention figure is presented without a source or cohort size. A federal reviewer will flag this as an unverifiable claim.",
      suggestion:
        "Cite the cohort (e.g., '2024 cohort, n=51, 49 retained to Week 3') or pull the figure into the evaluation table.",
    },
    {
      category: "alignment_with_rubric",
      severity: "medium",
      section_type: "global",
      excerpt: null,
      finding:
        "The funder's brief emphasizes 'sector partnerships' but the proposal frames itself as a single-org delivery model. The partnership structure is present in the activities but not foregrounded.",
      suggestion:
        "Add a one-paragraph 'Sector Partnership Structure' subsection naming each partner's MOU status, role, and contribution.",
    },
  ],
  overall_score: 76,
  summary:
    "Competitive draft with strong outcome data and a credible budget. Two compliance issues (NICRA documentation, evaluation target definition) need cleanup before submission. Partnership structure should be foregrounded to align with the funder's stated rubric.",
  tokens_in: 12_540,
  tokens_out: 1_820,
  cost_usd: 0.0856,
  model: "claude-3-5-sonnet-20241022",
  session_id: `reviewer_demo_${randomUUID().slice(0, 8)}`,
};

// ── helpers ────────────────────────────────────────────────────────────────

type RfpOrgInsert = Database["public"]["Tables"]["rfp_orgs"]["Insert"];
type RfpUserOrgInsert = Database["public"]["Tables"]["rfp_user_orgs"]["Insert"];
type RfpVaultInsert =
  Database["public"]["Tables"]["rfp_vault_artifacts"]["Insert"];
type RfpOppInsert = Database["public"]["Tables"]["rfp_opportunities"]["Insert"];
type RfpOppMatchInsert =
  Database["public"]["Tables"]["rfp_opp_matches"]["Insert"];
type RfpProposalInsert =
  Database["public"]["Tables"]["rfp_proposals"]["Insert"];
type RfpProposalSectionInsert =
  Database["public"]["Tables"]["rfp_proposal_sections"]["Insert"];
type RfpAgentSessionInsert =
  Database["public"]["Tables"]["rfp_agent_sessions"]["Insert"];
type RfpComplianceCheckInsert =
  Database["public"]["Tables"]["rfp_compliance_checks"]["Insert"];
type RfpPackageDocumentInsert =
  Database["public"]["Tables"]["rfp_package_documents"]["Insert"];
type RfpSubmissionTaskInsert =
  Database["public"]["Tables"]["rfp_submission_tasks"]["Insert"];
/** Round-trip-to-JSON to satisfy the supabase Json type (uses index signature). */
function toJsonb(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
): Promise<SupabaseAuthUser | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (error) {
      throw new Error(`auth_user_list_failed: ${error.message}`);
    }
    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
    if (found) return found;
    if (data.users.length < 100) return null;
  }
  throw new Error("auth_user_lookup_exceeded_2000_users");
}

async function ensureDemoAuthUser(
  admin: ReturnType<typeof createAdminClient>,
): Promise<string> {
  if (DEMO_USER_ID_FROM_ENV) {
    if (DEMO_USER_PASSWORD) {
      const { error } = await admin.auth.admin.updateUserById(DEMO_USER_ID_FROM_ENV, {
        password: DEMO_USER_PASSWORD,
        email_confirm: true,
      });
      if (error) throw new Error(`auth_user_password_reset_failed: ${error.message}`);
      console.log("[seed] ✓ auth user password reset from RFP_DEMO_USER_ID");
    }
    return DEMO_USER_ID_FROM_ENV;
  }

  if (!DEMO_USER_PASSWORD) {
    throw new Error("RFP_DEMO_USER_PASSWORD is required when RFP_DEMO_USER_ID is omitted");
  }

  const existing = await findAuthUserByEmail(admin, DEMO_USER_EMAIL);
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password: DEMO_USER_PASSWORD,
      email_confirm: true,
    });
    if (error) throw new Error(`auth_user_password_reset_failed: ${error.message}`);
    console.log(`[seed] ✓ existing auth user reset: ${existing.id}`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`auth_user_create_failed: ${error?.message ?? "no user returned"}`);
  }
  console.log(`[seed] ✓ auth user created: ${data.user.id}`);
  return data.user.id;
}

// ── main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const admin = createAdminClient();
  const demoUserId = await ensureDemoAuthUser(admin);

  console.log("=== RFP Engine — Demo Org seeder ===");
  console.log(`[seed] owner email: ${DEMO_USER_EMAIL}`);
  console.log(`[seed] owner user_id: ${demoUserId}`);

  // 1) Org row
  const orgInsert: RfpOrgInsert = {
    name: ORG_NAME,
    type: "nonprofit",
    naics: ORG_NAICS,
    capacity_summary:
      "Uplift Communities — central Brooklyn workforce development nonprofit. Healthcare credential pathway (CNA/HHA/CMA) with documented post-credential employment outcomes since 2017. 11 FTEs, $1.4M annual operating budget, partnerships with Brookdale University Hospital, Kingsborough Community College, and Single Stop NYC.",
    voice_fingerprint: toJsonb(DEMO_VOICE_FINGERPRINT),
    // onboarding_state defaults to '{}' — leave as-is so the dashboard treats
    // this org as fully onboarded based on existence checks (voice present,
    // vault present, proposal present).
  };

  const { data: org, error: orgErr } = await admin
    .from("rfp_orgs")
    .insert(orgInsert)
    .select("id, name")
    .single();
  if (orgErr || !org) {
    throw new Error(`org_create_failed: ${orgErr?.message ?? "no row returned"}`);
  }
  const orgId: string = org.id;
  console.log(`[seed] ✓ org created: ${orgId}`);

  // Wrap everything else in try/catch so we can compensating-delete the org
  // on any failure. ON DELETE CASCADE on every child FK means a single delete
  // cleans up rfp_user_orgs / vault / opp_matches / proposals / sections /
  // agent_sessions in one go.
  try {
    // 2) Owner membership
    const memInsert: RfpUserOrgInsert = {
      user_id: demoUserId,
      org_id: orgId,
      role: "owner",
    };
    const { error: memErr } = await admin
      .from("rfp_user_orgs")
      .insert(memInsert);
    if (memErr) {
      throw new Error(`membership_failed: ${memErr.message}`);
    }
    console.log(`[seed] ✓ owner membership inserted`);

    // 3) Vault chunks — embedding intentionally null (retriever skips
    // rows without embeddings; we still want the list view to show them).
    const vaultDocId = randomUUID();
    const vaultRows: RfpVaultInsert[] = VAULT_SEEDS.map((seed, i) => {
      if (!VAULT_DOC_TYPES.includes(seed.type)) {
        throw new Error(`vault_bad_doc_type: ${seed.type}`);
      }
      return {
        org_id: orgId,
        type: seed.type,
        title: seed.title,
        body: seed.body,
        embedding: null,
        source_metadata: toJsonb({
          doc_id: vaultDocId,
          chunk_index: i,
          total_chunks: VAULT_SEEDS.length,
          doc_title: seed.title,
          doc_type: seed.type,
          char_start: 0,
          char_end: seed.body.length,
          embed_model: null,
          uploaded_at: daysAgo(9),
          demo_seed: true,
        }),
      };
    });
    const { data: vaultInserted, error: vaultErr } = await admin
      .from("rfp_vault_artifacts")
      .insert(vaultRows)
      .select("id, title");
    if (vaultErr) {
      throw new Error(`vault_insert_failed: ${vaultErr.message}`);
    }
    console.log(
      `[seed] ✓ ${vaultInserted?.length ?? 0} vault chunks inserted (embedding=null)`,
    );

    // 4) Opportunities + match scoring rows
    const oppInserts: RfpOppInsert[] = OPP_SEEDS.map((o) => ({
      source: o.source,
      source_id: o.source_id,
      title: o.title,
      agency: o.agency,
      type: o.type,
      brief: o.brief,
      keywords: o.keywords,
      geo: o.geo,
      url: o.url,
      amount_min: o.amount_min,
      amount_max: o.amount_max,
      posted_at: daysAgo(o.posted_days_ago),
      deadline: daysFromNow(o.deadline_days_ahead),
      last_seen_at: daysAgo(0),
      needs_review: false,
      raw_json: toJsonb({ demo_seed: true, source_id: o.source_id }),
    }));

    // Upsert against the (source, source_id) unique constraint so re-running
    // the seeder doesn't blow up on the second pass.
    const { data: oppRows, error: oppErr } = await admin
      .from("rfp_opportunities")
      .upsert(oppInserts, { onConflict: "source,source_id" })
      .select("id, source, source_id, title");
    if (oppErr || !oppRows) {
      throw new Error(`opp_insert_failed: ${oppErr?.message ?? "no rows"}`);
    }
    console.log(`[seed] ✓ ${oppRows.length} opportunities upserted`);

    // Map each seed's source_id back to its row.id for the match insert.
    const oppIdBySourceId = new Map<string, string>(
      oppRows.map((r) => [r.source_id ?? "", r.id]),
    );

    const matchInserts: RfpOppMatchInsert[] = OPP_SEEDS.map((o, idx) => {
      const oppId = oppIdBySourceId.get(o.source_id);
      if (!oppId) {
        throw new Error(`opp_missing_after_upsert: ${o.source_id}`);
      }
      // Three demo fit-scores: high (DYCD, our backyard), medium (NY State),
      // medium-low (federal HRSA). Stable so the demo dashboard order is
      // predictable across reruns.
      const tiers: Array<{
        score: number;
        win: number;
        rec: string;
        chips: string[];
        summary: string;
      }> = [
        {
          score: 71,
          win: 0.32,
          rec: "pursue",
          chips: [
            "NAICS match",
            "Federal scope",
            "Workforce sector",
            "Healthcare credentialing",
          ],
          summary:
            "Strong sector + NAICS alignment with HRSA's direct-care workforce priority. Federal scope is broader than your typical NYC focus — partner with another applicant if needed to meet geographic coverage.",
        },
        {
          score: 82,
          win: 0.46,
          rec: "pursue",
          chips: [
            "NY State scope",
            "Youth workforce",
            "Healthcare priority",
            "WIOA partnership",
          ],
          summary:
            "Tight fit. WIOA youth workforce + healthcare sector partnerships match your KBCC + Brookdale model exactly. Award range fits your typical state grant size.",
        },
        {
          score: 91,
          win: 0.58,
          rec: "pursue",
          chips: [
            "NYC scope",
            "DYCD priority district",
            "Compass workforce",
            "Concept paper stage",
          ],
          summary:
            "Highest-fit opportunity. You have a 2022 Compass award you can reference, the priority districts match your service area, and the concept paper format favors organizations with existing track records.",
        },
      ];
      const tier = tiers[idx] ?? tiers[0];
      return {
        opp_id: oppId,
        org_id: orgId,
        fit_score: tier.score,
        win_prob: tier.win,
        recommendation: tier.rec,
        chips: tier.chips,
        summary: tier.summary,
        score_breakdown: toJsonb({
          naics_match: idx === 2 ? 30 : idx === 1 ? 28 : 22,
          geo_match: idx === 2 ? 25 : idx === 1 ? 22 : 15,
          sector_alignment: 20,
          keyword_alignment: idx === 2 ? 14 : idx === 1 ? 12 : 10,
          award_size_fit: idx === 2 ? 2 : 0,
          demo_seed: true,
        }),
        scored_version: 1,
        scored_at: daysAgo(2),
        triage_status: "pursuing",
        triage_note:
          idx === 0
            ? "E2E seed: pursue this as the no-draft command-file scenario."
            : idx === 1
              ? "E2E seed: proposal-backed pursuit with prior win evidence."
              : "E2E seed: active draft pursuit with submission bundle artifacts.",
        triaged_at: daysAgo(idx + 1),
        triaged_by: demoUserId,
        pursuit_owner_label: idx === 0 ? "Proposal lead" : idx === 1 ? "Program director" : "Lorenzo",
        pursuit_stage: idx === 0 ? "evaluating" : idx === 1 ? "submitted" : "reviewing",
        pursuit_priority: idx === 2 ? "critical" : idx === 1 ? "high" : "medium",
      };
    });

    const { error: matchErr } = await admin
      .from("rfp_opp_matches")
      .upsert(matchInserts, { onConflict: "opp_id,org_id" });
    if (matchErr) {
      throw new Error(`opp_match_insert_failed: ${matchErr.message}`);
    }
    console.log(`[seed] ✓ ${matchInserts.length} opp_matches upserted`);

    // 5) Proposals — one draft (recent, references the top-fit DYCD opp),
    // one won (older, with reviewer findings + 5 dummy section rows).
    const draftOppId = oppIdBySourceId.get("DYCD-CDP-25-DEMO-003");
    const wonOppId = oppIdBySourceId.get("NYSED-WIOA-Y25-DEMO-014");

    // vault_chunks_used: a fake citation set tied to the first 3 vault chunks
    // so the citation pills render. We reference the chunks we just inserted.
    const draftVaultChunksUsed = (vaultInserted ?? []).slice(0, 3).map(
      (row, i) => ({
        id: row.id,
        doc_id: vaultDocId,
        doc_title: row.title,
        doc_type: VAULT_SEEDS[i]?.type ?? "other",
        chunk_index: i,
        text_preview: VAULT_SEEDS[i]?.body.slice(0, 400) ?? "",
        similarity_score: 0.78 - i * 0.06,
      }),
    );

    const draftProposalInsert = {
      org_id: orgId,
      opp_id: draftOppId,
      title: "DYCD Compass Concept Paper — Healthcare Credential Pathway (Draft)",
      status: "draft",
      owner_user_id: demoUserId,
      due_date: daysFromNow(14),
      created_at: daysAgo(3),
      updated_at: daysAgo(1),
      vault_chunks_used: toJsonb(draftVaultChunksUsed),
    } satisfies RfpProposalInsert;

    const wonProposalInsert: RfpProposalInsert = {
      org_id: orgId,
      opp_id: wonOppId,
      title: "WIOA Youth Workforce — Healthcare Sector Partnership (Won)",
      status: "won",
      owner_user_id: demoUserId,
      due_date: daysAgo(60),
      created_at: daysAgo(95),
      updated_at: daysAgo(45),
      vault_chunks_used: toJsonb([]),
    };

    const { data: proposals, error: propErr } = await admin
      .from("rfp_proposals")
      .insert([draftProposalInsert, wonProposalInsert])
      .select("id, title, status");
    if (propErr || !proposals || proposals.length !== 2) {
      throw new Error(
        `proposal_insert_failed: ${propErr?.message ?? "unexpected row count"}`,
      );
    }
    const draftProposal = proposals.find((p) => p.status === "draft");
    const wonProposal = proposals.find((p) => p.status === "won");
    if (!draftProposal || !wonProposal) {
      throw new Error("proposal_split_failed: could not identify draft vs won");
    }
    console.log(
      `[seed] ✓ 2 proposals inserted (draft=${draftProposal.id}, won=${wonProposal.id})`,
    );

    // 6) Won proposal — 5 canonical section rows + 1 reviewer_findings row
    const sectionInserts: RfpProposalSectionInsert[] = WON_PROPOSAL_SECTIONS.map(
      (s) => ({
        proposal_id: wonProposal.id,
        section_type: s.section_type,
        content: s.content,
        version: 1,
        last_drafted_by_agent_at: daysAgo(70),
      }),
    );
    // Reviewer findings persisted as a JSON-stringified content row in
    // rfp_proposal_sections under section_type=reviewer_findings_v1 — matches
    // app/api/rfp/proposals/[proposalId]/review/route.ts persistence shape.
    sectionInserts.push({
      proposal_id: wonProposal.id,
      section_type: REVIEWER_FINDINGS_SECTION_TYPE,
      content: JSON.stringify(DEMO_REVIEWER_FINDINGS),
      version: 1,
      last_drafted_by_agent_at: daysAgo(68),
    });

    const { error: sectErr } = await admin
      .from("rfp_proposal_sections")
      .insert(sectionInserts);
    if (sectErr) {
      throw new Error(`section_insert_failed: ${sectErr.message}`);
    }
    console.log(
      `[seed] ✓ ${sectionInserts.length} proposal sections inserted (incl. reviewer findings)`,
    );

    const packageExtraction = {
      kind: "package_requirements_v1",
      title: "DYCD Compass Concept Paper Instructions",
      source_type: "paste",
      source_url: null,
      extracted_at: ISO,
      extracted_chars: 1850,
      quality_score: 86,
      deadline_timezone: "Eastern Time",
      submission_method: "Submit the concept paper and attachments through PASSPort before 5:00 PM Eastern Time.",
      submission_portal: "PASSPort",
      submission_url: "https://passport.cityofnewyork.us/",
      forms: ["Concept paper form", "Budget summary", "MWBE utilization plan"],
      attachments: [
        "501(c)(3) determination letter",
        "Audited financial statements",
        "Letters of commitment",
      ],
      matching_funds: ["No match required"],
      award_limits: ["Maximum request $385,000"],
      question_deadlines: ["Questions due 7 days before submission deadline"],
      eligibility: [
        "Applicant must be a NYC-serving nonprofit organization.",
        "Applicant must document experience with youth workforce programming.",
      ],
      required_documents: [
        "Project narrative",
        "Budget and budget justification",
        "501(c)(3) determination letter",
        "Audited financial statements",
        "Letters of commitment",
      ],
      page_limits: ["Concept paper narrative may not exceed 8 pages."],
      budget_rules: [
        "Administrative costs must be reasonable and allocable.",
        "Participant stipends are allowable with documentation.",
      ],
      scoring_criteria: [
        "Program experience and organizational capacity",
        "Strength of employer partnerships",
        "Outcome measurement plan",
      ],
      deadlines: [daysFromNow(14)],
      submission_instructions: [
        "Upload all required forms as PDFs in PASSPort.",
        "Retain confirmation receipt after submission.",
      ],
      contacts: ["DYCD procurement helpdesk"],
      risks: [
        "Short concept paper timeline.",
        "Attachment completeness required before portal submission.",
      ],
      requirements: [
        {
          id: "pkg-eligibility-nonprofit",
          category: "eligibility",
          requirement: "Confirm NYC nonprofit eligibility and service area.",
          source: "Demo package",
          source_excerpt: "Applicant must be a NYC-serving nonprofit organization.",
          owner_hint: "Proposal lead",
          phase: "eligibility",
          priority: "critical",
        },
        {
          id: "pkg-attachment-financials",
          category: "attachment",
          requirement: "Attach audited financial statements.",
          source: "Demo package",
          source_excerpt: "Required attachments include audited financial statements.",
          owner_hint: "Finance / Operations",
          phase: "attachments",
          priority: "high",
        },
        {
          id: "pkg-submission-passport",
          category: "submission",
          requirement: "Submit packet through PASSPort and save confirmation receipt.",
          source: "Demo package",
          source_excerpt: "Submit through PASSPort before 5:00 PM Eastern Time.",
          owner_hint: "Submission lead",
          phase: "submission",
          priority: "critical",
        },
      ],
    };

    const packageDocInsert: RfpPackageDocumentInsert = {
      proposal_id: draftProposal.id,
      org_id: orgId,
      opp_id: draftOppId,
      title: "DYCD Compass Concept Paper Instructions",
      source_type: "paste",
      source_url: null,
      extracted_text:
        "Concept papers are due in PASSPort by 5:00 PM Eastern Time. Applicants must include a project narrative, budget and budget justification, 501(c)(3) determination letter, audited financial statements, and letters of commitment. The narrative may not exceed 8 pages. Save the PASSPort confirmation receipt after submission.",
      extracted_chars: 1850,
      extracted_json: toJsonb(packageExtraction),
      uploaded_by: demoUserId,
    };
    const { error: packageDocErr } = await admin
      .from("rfp_package_documents")
      .insert(packageDocInsert);
    if (packageDocErr) {
      throw new Error(`package_doc_insert_failed: ${packageDocErr.message}`);
    }
    console.log("[seed] ✓ package document inserted for draft proposal");

    const bidNoBid = {
      kind: "bid_no_bid_v1",
      recommendation: "pursue",
      score: 84,
      drivers: [
        "NYC youth workforce scope matches Uplift's healthcare credential pathway.",
        "Prior DYCD Compass award creates credible past-performance evidence.",
        "Award ceiling matches the existing cohort expansion budget.",
      ],
      risks: [
        "Short submission window.",
        "Attachment completeness must be verified before portal upload.",
      ],
      next_actions: [
        "Confirm PASSPort attachment list.",
        "Resolve financial statement attachment.",
        "Run final reviewer pass before submission.",
      ],
    };
    const complianceMatrix = {
      kind: "compliance_matrix_v1",
      overall_status: "warn",
      missing_count: 1,
      needs_review_count: 1,
      critical_count: 1,
      submission_summary: {
        deadline_timezone: "Eastern Time",
        submission_method: packageExtraction.submission_method,
        submission_portal: "PASSPort",
        submission_url: "https://passport.cityofnewyork.us/",
        forms: packageExtraction.forms,
        question_deadlines: packageExtraction.question_deadlines,
      },
      items: [
        {
          id: "compliance-eligibility",
          category: "eligibility",
          requirement: "Applicant is a NYC-serving nonprofit.",
          source: "Demo package",
          response_status: "met",
          owner_section: "organizational_capacity",
          evidence: "Uplift Communities operates from Linden Boulevard and serves central Brooklyn.",
          priority: "critical",
          owner_label: "Proposal lead",
          phase: "eligibility",
        },
        {
          id: "compliance-financials",
          category: "attachment",
          requirement: "Attach audited financial statements.",
          source: "Demo package",
          response_status: "missing",
          owner_section: "attachments",
          evidence: "",
          priority: "critical",
          owner_label: "Finance / Operations",
          phase: "attachments",
        },
        {
          id: "compliance-budget",
          category: "budget",
          requirement: "Validate stipend and admin cost assumptions.",
          source: "Demo package",
          response_status: "needs_review",
          owner_section: "budget_narrative",
          evidence: "Budget draft includes participant stipends and indirect assumptions.",
          priority: "high",
          owner_label: "Finance / Operations",
          phase: "budget",
        },
      ],
    };
    const packetChecklist = {
      kind: "packet_checklist_v1",
      overall_status: "warn",
      due_date: daysFromNow(14),
      submission_url: "https://passport.cityofnewyork.us/",
      deadline_timezone: "Eastern Time",
      submission_method: packageExtraction.submission_method,
      submission_portal: "PASSPort",
      forms: packageExtraction.forms,
      question_deadlines: packageExtraction.question_deadlines,
      items: [
        {
          id: "packet-narrative",
          label: "Project narrative",
          status: "partial",
          notes: "Draft exists; final reviewer pass still needed.",
        },
        {
          id: "packet-budget",
          label: "Budget and budget justification",
          status: "needs_review",
          notes: "Finance must confirm stipend and indirect assumptions.",
        },
        {
          id: "packet-financials",
          label: "Audited financial statements",
          status: "missing",
          notes: "Upload current audited statements before submission.",
        },
      ],
    };

    const complianceInserts: RfpComplianceCheckInsert[] = [
      {
        proposal_id: draftProposal.id,
        check_type: "bid_no_bid_v1",
        status: "warn",
        details_json: toJsonb(bidNoBid),
      },
      {
        proposal_id: draftProposal.id,
        check_type: "compliance_matrix_v1",
        status: "warn",
        details_json: toJsonb(complianceMatrix),
      },
      {
        proposal_id: draftProposal.id,
        check_type: "packet_checklist_v1",
        status: "warn",
        details_json: toJsonb(packetChecklist),
      },
    ];
    const { error: complianceErr } = await admin
      .from("rfp_compliance_checks")
      .insert(complianceInserts);
    if (complianceErr) {
      throw new Error(`compliance_insert_failed: ${complianceErr.message}`);
    }
    console.log("[seed] ✓ capture readiness artifacts inserted for draft proposal");

    const taskInserts: RfpSubmissionTaskInsert[] = [
      {
        proposal_id: draftProposal.id,
        source_type: "packet",
        source_id: "packet-financials",
        title: "Upload audited financial statements",
        detail: "Required PASSPort attachment is missing from the packet checklist.",
        owner_label: "Finance / Operations",
        priority: "critical",
        status: "blocked",
        due_date: daysFromNow(10),
        evidence: "",
        created_by: demoUserId,
      },
      {
        proposal_id: draftProposal.id,
        source_type: "compliance",
        source_id: "compliance-budget",
        title: "Review budget justification assumptions",
        detail: "Validate stipend and indirect assumptions against the concept paper instructions.",
        owner_label: "Finance / Operations",
        priority: "high",
        status: "in_progress",
        due_date: daysFromNow(7),
        evidence: "Budget draft includes participant stipends and indirect assumptions.",
        created_by: demoUserId,
      },
      {
        proposal_id: draftProposal.id,
        source_type: "reviewer",
        source_id: "reviewer-final-pass",
        title: "Run final reviewer pass",
        detail: "Run reviewer after attachments and budget assumptions are resolved.",
        owner_label: "Reviewer",
        priority: "medium",
        status: "open",
        due_date: daysFromNow(11),
        evidence: "",
        created_by: demoUserId,
      },
    ];
    const { error: taskErr } = await admin
      .from("rfp_submission_tasks")
      .insert(taskInserts);
    if (taskErr) {
      throw new Error(`submission_task_insert_failed: ${taskErr.message}`);
    }
    console.log(`[seed] ✓ ${taskInserts.length} submission tasks inserted`);

    // 7) Agent sessions — drafter_v1 + reviewer_v1 + voice_trainer_v1 spread
    // across the past 14 days with realistic cost figures.
    const sessionInserts: RfpAgentSessionInsert[] = [
      // Voice trainer — 12 days ago, owner first set up the org
      {
        proposal_id: null,
        org_id: orgId,
        agent: "voice_fingerprint_extractor_v1",
        session_id: `voice_${randomUUID().slice(0, 8)}`,
        model: "gpt-4o",
        tokens_in: 18_400,
        tokens_out: 1_240,
        cost_usd: 0.058,
        created_at: daysAgo(12),
      },
      // Drafter — won proposal, ~90 days ago (kept inside the 14-day window
      // via a second, more recent session)
      {
        proposal_id: wonProposal.id,
        org_id: orgId,
        agent: "drafter_v1",
        session_id: `draft_${randomUUID().slice(0, 8)}__voice=true__vault=4`,
        model: "claude-3-5-sonnet-20241022",
        tokens_in: 14_200,
        tokens_out: 3_840,
        cost_usd: 0.118,
        created_at: daysAgo(11),
      },
      // Reviewer — ran on won proposal once after drafting
      {
        proposal_id: wonProposal.id,
        org_id: orgId,
        agent: "reviewer_v1",
        session_id: DEMO_REVIEWER_FINDINGS.session_id,
        model: "claude-3-5-sonnet-20241022",
        tokens_in: 12_540,
        tokens_out: 1_820,
        cost_usd: 0.086,
        created_at: daysAgo(9),
      },
      // Drafter — recent draft proposal (3 days ago)
      {
        proposal_id: draftProposal.id,
        org_id: orgId,
        agent: "drafter_v1",
        session_id: `draft_${randomUUID().slice(0, 8)}__voice=true__vault=3`,
        model: "claude-3-5-sonnet-20241022",
        tokens_in: 15_600,
        tokens_out: 4_120,
        cost_usd: 0.129,
        created_at: daysAgo(3),
      },
      // Reviewer — recent run on the draft (yesterday)
      {
        proposal_id: draftProposal.id,
        org_id: orgId,
        agent: "reviewer_v1",
        session_id: `reviewer_${randomUUID().slice(0, 8)}`,
        model: "claude-3-5-sonnet-20241022",
        tokens_in: 13_100,
        tokens_out: 1_960,
        cost_usd: 0.091,
        created_at: daysAgo(1),
      },
      // Voice trainer — re-run today to show recent activity
      {
        proposal_id: null,
        org_id: orgId,
        agent: "voice_fingerprint_extractor_v1",
        session_id: `voice_${randomUUID().slice(0, 8)}`,
        model: "gpt-4o",
        tokens_in: 19_800,
        tokens_out: 1_300,
        cost_usd: 0.063,
        created_at: daysAgo(0),
      },
    ];

    const { error: agentErr } = await admin
      .from("rfp_agent_sessions")
      .insert(sessionInserts);
    if (agentErr) {
      throw new Error(`agent_session_insert_failed: ${agentErr.message}`);
    }
    console.log(
      `[seed] ✓ ${sessionInserts.length} agent_sessions inserted across past 14 days`,
    );

    // 8) Print final summary + dashboard URL
    console.log("\n=== SEED COMPLETE ===");
    console.log(`org_id:        ${orgId}`);
    console.log(`org_name:      ${ORG_NAME}`);
    console.log(`owner_email:   ${DEMO_USER_EMAIL}`);
    console.log(`owner_user_id: ${demoUserId}`);
    console.log(`dashboard:     ${RFP_BASE_URL}/org/${orgId}`);
    if (DEMO_USER_PASSWORD) {
      console.log("\nE2E env:");
      console.log(`  RFP_E2E_EMAIL=${DEMO_USER_EMAIL}`);
      console.log("  RFP_E2E_PASSWORD=<same value as RFP_DEMO_USER_PASSWORD>");
      console.log(`  RFP_E2E_ORG_ID=${orgId}`);
    }
    console.log("\nProposals:");
    console.log(`  draft: ${RFP_BASE_URL}/org/${orgId}/proposals/${draftProposal.id}`);
    console.log(`  won:   ${RFP_BASE_URL}/org/${orgId}/proposals/${wonProposal.id}`);
  } catch (err) {
    // Compensating delete — single statement cleans up everything via
    // ON DELETE CASCADE chained off rfp_orgs.id.
    console.error(
      `\n[seed] FAILED mid-flow — compensating delete on rfp_orgs.id=${orgId}`,
    );
    const { error: rollbackErr } = await admin
      .from("rfp_orgs")
      .delete()
      .eq("id", orgId);
    if (rollbackErr) {
      console.error(
        `[seed] ROLLBACK ALSO FAILED — manual cleanup required for org ${orgId}: ${rollbackErr.message}`,
      );
    } else {
      console.error(`[seed] rollback complete — org ${orgId} deleted.`);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error("[FATAL]", err instanceof Error ? err.message : err);
  process.exit(1);
});
