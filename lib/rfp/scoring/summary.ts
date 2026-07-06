/**
 * Phase 05-03 — AI-generated fit summary.
 *
 * Generates a 1-2 sentence "why this opp matches" reasoning blurb that the
 * feed UI (Plan 05-04) renders below the structured chips. Chips are the
 * durable, model-agnostic explanation; the summary is the narrative gloss.
 *
 * Model selection:
 *   - Primary: Claude Sonnet 4 (claude-sonnet-4-5)
 *   - Fallback: Claude Haiku 4.5 (claude-haiku-4-5)
 *   - On any error (rate limit, network, model down) returns null. Caller
 *     treats null as "keep existing summary or leave blank." Never throws.
 *
 * Profile-pending case:
 *   Skip AI entirely. Returns a fixed sentinel so we don't pay for tokens to
 *   generate "we don't have your profile yet" prose.
 *
 * Caching:
 *   Caller is responsible for checking the scored_version cache key — when the
 *   (opp_id, org_id) row already has the same scored_version, the caller skips
 *   `generateFitSummary` entirely. This module is a pure generator; cache
 *   logic lives in recompute.ts.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  OpportunityForScoring,
  CaptureProfileForScoring,
  ScoreBreakdown,
} from './score';

// Lazy init — matches lib/ai/router.ts pattern. Don't crash at build-time when
// ANTHROPIC_API_KEY is absent.
let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (anthropic) return anthropic;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  anthropic = new Anthropic({ apiKey: key });
  return anthropic;
}

/** Sentinel returned when profile is pending — no AI call. */
const PROFILE_PENDING_SUMMARY =
  'Capture profile not yet built. Score uses geo and deadline only.';

/** Primary + fallback model ids. Sonnet 4.5 / Haiku 4.5 per Anthropic 2026 lineup. */
const MODEL_PRIMARY = 'claude-sonnet-4-5';
const MODEL_FALLBACK = 'claude-haiku-4-5';

/** Cap response at ~50 tokens — this is a one-or-two-sentence summary. */
const MAX_TOKENS = 80;

/**
 * Build the prompt sent to Claude. Kept tight — no verbose framing, no
 * marketing language coaching. The model is given the matched signal so it
 * can name them specifically.
 */
function buildPrompt(
  opp: OpportunityForScoring,
  profile: CaptureProfileForScoring,
  breakdown: ScoreBreakdown
): string {
  const briefTruncated = (opp.brief ?? '').slice(0, 200);
  const amountStr =
    opp.amount_max != null ? `$${opp.amount_max.toLocaleString()}` : 'unspecified amount';
  const deadlineStr = opp.deadline ?? 'no deadline given';
  const naicsList = profile.naics.join(',') || 'none';
  const capStr = profile.capacity_keywords.slice(0, 5).join(', ') || 'none';
  const geoStr = profile.geo_focus.join('/') || 'none';

  return [
    'You explain why an opportunity matches an organization in 1-2 sentences.',
    'Be specific. Reference NAICS code, capacity area, geo, or past funder by name when they match.',
    'No marketing language. No "Strong fit" — that\'s already shown elsewhere.',
    '',
    `Opportunity: ${opp.title} — ${opp.agency ?? 'agency unknown'} — ${amountStr} — deadline ${deadlineStr} — ${briefTruncated}`,
    `Org: NAICS ${naicsList} · capacity ${capStr} · geo ${geoStr}`,
    `Score breakdown: NAICS ${breakdown.naics.score}, keyword ${breakdown.keyword.score}, geo ${breakdown.geo.score}, dollar ${breakdown.dollar_band.score}, past ${breakdown.past_funder.score}`,
    '',
    'Return only the summary. No quotes, no preamble.',
  ].join('\n');
}

/**
 * Generate a 1-2 sentence reasoning summary.
 *
 * @returns the summary string on success, the profile-pending sentinel when
 * `breakdown.profile_pending` is true, or `null` on any error or missing
 * ANTHROPIC_API_KEY (caller leaves existing summary or null).
 */
export async function generateFitSummary(
  opp: OpportunityForScoring,
  profile: CaptureProfileForScoring | null,
  breakdown: ScoreBreakdown
): Promise<string | null> {
  // Profile-pending case: skip the AI call.
  if (breakdown.profile_pending || profile === null) {
    return PROFILE_PENDING_SUMMARY;
  }

  const client = getAnthropic();
  if (!client) {
    // No key wired — caller treats null as "leave blank".
    return null;
  }

  const prompt = buildPrompt(opp, profile, breakdown);

  // Try primary, fall back to Haiku on transient errors.
  for (const model of [MODEL_PRIMARY, MODEL_FALLBACK]) {
    try {
      const resp = await client.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }],
      });
      // Extract text from the first content block.
      const block = resp.content[0];
      if (block && block.type === 'text') {
        const text = block.text.trim();
        if (text.length > 0) return text;
      }
      // Empty response — try fallback if any.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[scoring/summary] ${model} failed for opp=${opp.id}: ${msg}`
      );
      // Continue to fallback model.
    }
  }

  // Both models failed (rate limit, network, etc.) — return null per contract.
  return null;
}
