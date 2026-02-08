/**
 * Execution Quota Checker
 * Enforces daily execution limits per user to prevent abuse and control costs.
 * Queries the code_executions table to determine current usage.
 */

import { createAdminClient } from "@/lib/supabase/server";
import {
  QuotaCheckResult,
  PRO_DAILY_LIMIT,
  FREE_DAILY_LIMIT,
} from "./types";

/**
 * Check whether a user is allowed to execute code based on their daily quota.
 * Queries the code_executions table for today's execution count and compares
 * against the user's plan limit.
 *
 * @param userId - The authenticated user's ID
 * @returns QuotaCheckResult indicating if execution is allowed
 */
export async function checkExecutionQuota(
  userId: string
): Promise<QuotaCheckResult> {
  const supabase = createAdminClient();

  // Calculate the start of today (UTC midnight)
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

  // Count today's executions for this user
  const { count, error } = await supabase
    .from("code_executions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", tomorrowStart.toISOString());

  if (error) {
    console.error("[QuotaChecker] Error checking execution quota:", error);
    // Fail open with a conservative limit if we can't check
    return {
      allowed: true,
      remaining: 1,
      resetAt: tomorrowStart,
    };
  }

  const dailyCount = count ?? 0;

  // Determine user's plan limit
  const maxDaily = await getUserDailyLimit(userId, supabase);

  const remaining = Math.max(0, maxDaily - dailyCount);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt: tomorrowStart,
  };
}

/**
 * Get the daily execution limit for a user based on their subscription plan.
 * Checks the profiles table for subscription tier information.
 *
 * @param userId - The user's ID
 * @param supabase - Supabase admin client
 * @returns Maximum daily executions allowed
 */
async function getUserDailyLimit(
  userId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<number> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", userId)
      .single();

    if (!profile) {
      return FREE_DAILY_LIMIT;
    }

    // Pro and enterprise users get higher limits
    const tier = (profile as any).subscription_tier;
    if (tier === "pro" || tier === "enterprise" || tier === "team") {
      return PRO_DAILY_LIMIT;
    }

    return FREE_DAILY_LIMIT;
  } catch (error) {
    console.error("[QuotaChecker] Error fetching user plan:", error);
    return FREE_DAILY_LIMIT;
  }
}
