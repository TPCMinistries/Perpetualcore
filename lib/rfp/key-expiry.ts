/**
 * lib/rfp/key-expiry.ts
 *
 * Helpers for SAM.gov (and future) API-key expiry tracking.
 *
 * Used by: app/api/cron/rfp-key-expiry-check/route.ts
 *
 * Design:
 *   - Pure functions — no DB access here. The cron route owns the I/O.
 *   - No `any` types; TypeScript strict.
 *   - Alert threshold: 21 days (more slack than SAM.gov's 15-day renewal window).
 *   - Alert de-dup: suppress re-alert within 7 days of the last alert to avoid daily spam.
 */

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute the number of whole days until the given expiry timestamp.
 *
 * Returns `null` when `expiresAt` is null/empty (key not yet registered —
 * alerting simply won't fire, which is correct).
 * Returns a negative number when the key is already expired.
 */
export function daysUntilExpiry(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const expiryMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryMs)) return null;
  return Math.floor((expiryMs - Date.now()) / MILLISECONDS_PER_DAY);
}

/**
 * Decide whether an operator alert should fire for this key.
 *
 * Rules:
 *   1. `expiresAt` must be set (non-null) — unregistered keys are skipped.
 *   2. Days remaining must be ≤ `thresholdDays` (default 21) — catches both
 *      upcoming expirations and already-expired keys.
 *   3. We have NOT sent an alert in the last 7 days — prevents daily re-spam
 *      after the first alert fires.
 *
 * @param expiresAt       ISO-8601 string or null from rfp_api_key_health.expires_at
 * @param lastAlertedAt   ISO-8601 string or null from rfp_api_key_health.last_alerted_at
 * @param thresholdDays   Alert when days-remaining ≤ this value (default 21)
 */
export function needsAlert(
  expiresAt: string | null,
  lastAlertedAt: string | null,
  thresholdDays: number = 21,
): boolean {
  const days = daysUntilExpiry(expiresAt);
  if (days === null) return false;           // no expiry date set — skip
  if (days > thresholdDays) return false;   // still plenty of time

  // Within threshold — suppress if we already alerted within the last 7 days.
  if (lastAlertedAt) {
    const lastAlertMs = new Date(lastAlertedAt).getTime();
    if (!Number.isNaN(lastAlertMs)) {
      const daysSinceAlert = (Date.now() - lastAlertMs) / MILLISECONDS_PER_DAY;
      if (daysSinceAlert < 7) return false;
    }
  }

  return true;
}
