/**
 * lib/rfp/onboarding.ts — derives the first-run checklist state from DB.
 *
 * Step completion is auto-derived from existence checks, not user-written
 * state. That keeps it correct without a sync job: train your voice and the
 * checklist updates next paint, no extra writes anywhere.
 *
 * Five steps, in order:
 *   1. org_created       — entering /org/[orgId] proves this is true
 *   2. voice_trained     — rfp_orgs.voice_fingerprint has a non-empty payload
 *   3. vault_seeded      — org has >= 3 chunks in rfp_vault_artifacts
 *   4. first_draft       — org has >= 1 proposal in rfp_proposals
 *   5. first_review      — org has >= 1 reviewer findings section row
 *
 * Background/server operation: this is intentionally an admin-client read.
 * The caller is the dashboard page, which has already enforced membership
 * via the layout (`getOrgForUser` 404s non-members). We need the admin
 * client because COUNT queries on rfp_vault_artifacts / rfp_proposal_sections
 * may otherwise be blocked by RLS depending on the caller's role.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { SECTION_TYPES } from "@/lib/rfp/draft/sections";
import { REVIEWER_FINDINGS_SECTION_TYPE } from "@/lib/rfp/review/rubric";
import { VAULT_SEEDED_TARGET, type OnboardingState } from "./onboarding-shared";

export type { OnboardingState } from "./onboarding-shared";
export { VAULT_SEEDED_TARGET } from "./onboarding-shared";

const VAULT_SEEDED_THRESHOLD = VAULT_SEEDED_TARGET;

/**
 * Whether the org's voice_fingerprint jsonb has any non-empty payload.
 * The default value is `{}` and an org without training keeps that default,
 * so an empty object means "not trained". A trained fingerprint has at least
 * one populated key (rhythm_summary, signature_phrases, etc.).
 */
function isVoiceTrained(fingerprint: unknown): boolean {
  if (!fingerprint || typeof fingerprint !== "object") return false;
  return Object.keys(fingerprint as Record<string, unknown>).length > 0;
}

export async function getOnboardingState(
  orgId: string,
): Promise<OnboardingState> {
  const admin = createAdminClient();

  const [
    orgRes,
    vaultRes,
    matchesRes,
    proposalsRes,
    reviewerSectionsRes,
    complianceChecksRes,
    submissionTasksRes,
  ] =
    await Promise.all([
      admin
        .from("rfp_orgs")
        .select("voice_fingerprint")
        .eq("id", orgId)
        .maybeSingle<{ voice_fingerprint: unknown }>(),
      admin
        .from("rfp_vault_artifacts")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId),
      admin
        .from("rfp_opp_matches")
        .select("opp_id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .in("triage_status", ["watch", "pursuing"]),
      admin
        .from("rfp_proposals")
        .select("id")
        .eq("org_id", orgId)
        .returns<{ id: string }[]>(),
      admin
        .from("rfp_proposal_sections")
        .select("id, proposal_id!inner(org_id)", {
          count: "exact",
          head: true,
        })
        .eq("section_type", REVIEWER_FINDINGS_SECTION_TYPE)
        // The PostgREST inner-join filter is the cleanest way to scope this
        // count to the org without a SECURITY DEFINER helper.
        .eq("proposal_id.org_id", orgId),
      admin
        .from("rfp_compliance_checks")
        .select("id, check_type, proposal_id!inner(org_id)", { count: "exact" })
        .eq("proposal_id.org_id", orgId)
        .in("check_type", [
          "bid_no_bid_v1",
          "compliance_matrix_v1",
          "packet_checklist_v1",
        ])
        .returns<{ id: string; check_type: string }[]>(),
      admin
        .from("rfp_submission_tasks")
        .select("id, proposal_id!inner(org_id)", { count: "exact", head: true })
        .eq("proposal_id.org_id", orgId),
    ]);

  const voice_trained = isVoiceTrained(orgRes.data?.voice_fingerprint);
  const vault_chunk_count = vaultRes.count ?? 0;
  const match_count = matchesRes.count ?? 0;
  const proposalRows = proposalsRes.data ?? [];
  const proposalIds = proposalRows.map((proposal) => proposal.id);
  const proposal_count = proposalRows.length;
  const reviewer_count = reviewerSectionsRes.count ?? 0;
  const complianceChecks = complianceChecksRes.data ?? [];
  const complianceTypes = new Set(complianceChecks.map((row) => row.check_type));
  const first_capture_readiness =
    complianceTypes.has("bid_no_bid_v1") &&
    complianceTypes.has("compliance_matrix_v1") &&
    complianceTypes.has("packet_checklist_v1");
  const submission_task_count = submissionTasksRes.count ?? 0;
  const { data: sectionRows } =
    proposalIds.length > 0
      ? await admin
          .from("rfp_proposal_sections")
          .select("proposal_id, section_type, content")
          .in("proposal_id", proposalIds)
          .in("section_type", SECTION_TYPES)
          .returns<
            {
              proposal_id: string;
              section_type: string;
              content: string | null;
            }[]
          >()
      : { data: [] };

  const sectionsByProposal = new Map<
    string,
    { sectionTypes: Set<string>; verifyMarkers: number }
  >();
  for (const row of sectionRows ?? []) {
    const stat =
      sectionsByProposal.get(row.proposal_id) ??
      { sectionTypes: new Set<string>(), verifyMarkers: 0 };
    stat.sectionTypes.add(row.section_type);
    stat.verifyMarkers += row.content?.match(/\[VERIFY:/g)?.length ?? 0;
    sectionsByProposal.set(row.proposal_id, stat);
  }
  const first_export_ready = proposalRows.some((proposal) => {
    const sectionStat = sectionsByProposal.get(proposal.id);
    if (!sectionStat) return false;
    return (
      SECTION_TYPES.every((type) => sectionStat.sectionTypes.has(type)) &&
      sectionStat.verifyMarkers === 0 &&
      first_capture_readiness
    );
  });

  const state: OnboardingState = {
    org_created: true,
    voice_trained,
    vault_seeded: vault_chunk_count >= VAULT_SEEDED_THRESHOLD,
    first_match_selected: match_count > 0,
    first_draft: proposal_count > 0,
    first_review: reviewer_count > 0,
    first_capture_readiness,
    first_workroom: submission_task_count > 0,
    first_export_ready,
    match_count,
    vault_chunk_count,
    proposal_count,
    submission_task_count,
    all_complete: false,
  };
  state.all_complete =
    state.org_created &&
    state.first_match_selected &&
    state.first_draft &&
    state.first_review &&
    state.first_capture_readiness &&
    state.first_workroom &&
    state.first_export_ready;

  return state;
}
