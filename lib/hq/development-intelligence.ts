import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/server";

export interface HdiOperationalSummary {
  available: boolean;
  pendingReviews: number;
  flaggedReviews: number;
  openCommitments: number;
  recentSessions: number;
}
export async function getHdiOperationalSummary(): Promise<HdiOperationalSummary> {
  const supabase = createAdminClient() as unknown as SupabaseClient;
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [pending, flagged, commitments, sessions] = await Promise.all([
      supabase
        .from("hdi_analyses")
        .select("id", { count: "exact", head: true })
        .eq("human_review_status", "pending"),
      supabase
        .from("hdi_analyses")
        .select("id", { count: "exact", head: true })
        .neq("safety_flags", "[]"),
      supabase
        .from("hdi_commitments")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "unverified"]),
      supabase
        .from("hdi_sessions")
        .select("id", { count: "exact", head: true })
        .gte("occurred_at", since),
    ]);

    if (pending.error || flagged.error || commitments.error || sessions.error) {
      return {
        available: false,
        pendingReviews: 0,
        flaggedReviews: 0,
        openCommitments: 0,
        recentSessions: 0,
      };
    }

    return {
      available: true,
      pendingReviews: pending.count || 0,
      flaggedReviews: flagged.count || 0,
      openCommitments: commitments.count || 0,
      recentSessions: sessions.count || 0,
    };
  } catch {
    return {
      available: false,
      pendingReviews: 0,
      flaggedReviews: 0,
      openCommitments: 0,
      recentSessions: 0,
    };
  }
}
