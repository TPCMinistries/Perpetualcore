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

  const [orgRes, vaultRes, proposalsRes, reviewerSectionsRes] =
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
        .from("rfp_proposals")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId),
      admin
        .from("rfp_proposal_sections")
        .select("id, proposal_id!inner(org_id)", {
          count: "exact",
          head: true,
        })
        .eq("section_type", "reviewer_findings_v1")
        // The PostgREST inner-join filter is the cleanest way to scope this
        // count to the org without a SECURITY DEFINER helper.
        .eq("proposal_id.org_id", orgId),
    ]);

  const voice_trained = isVoiceTrained(orgRes.data?.voice_fingerprint);
  const vault_chunk_count = vaultRes.count ?? 0;
  const proposal_count = proposalsRes.count ?? 0;
  const reviewer_count = reviewerSectionsRes.count ?? 0;

  const state: OnboardingState = {
    org_created: true,
    voice_trained,
    vault_seeded: vault_chunk_count >= VAULT_SEEDED_THRESHOLD,
    first_draft: proposal_count > 0,
    first_review: reviewer_count > 0,
    vault_chunk_count,
    proposal_count,
    all_complete: false,
  };
  state.all_complete =
    state.org_created &&
    state.voice_trained &&
    state.vault_seeded &&
    state.first_draft &&
    state.first_review;

  return state;
}
