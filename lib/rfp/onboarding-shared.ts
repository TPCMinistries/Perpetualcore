/**
 * lib/rfp/onboarding-shared.ts — server-safe types + constants for the
 * onboarding checklist.
 *
 * Lives separately from `lib/rfp/onboarding.ts` because that module
 * imports `next/headers` (via createClient/createAdminClient) and webpack
 * pulls the whole import graph when a client component touches it. The
 * checklist UI is a client component, so it imports from here.
 */

export interface OnboardingState {
  org_created: boolean;
  voice_trained: boolean;
  vault_seeded: boolean;
  first_draft: boolean;
  first_review: boolean;
  vault_chunk_count: number;
  proposal_count: number;
  all_complete: boolean;
}

export const VAULT_SEEDED_TARGET = 3;
