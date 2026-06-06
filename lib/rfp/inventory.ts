/**
 * RFP inventory metrics used by tenant-facing product surfaces.
 *
 * These are aggregate counts only. They intentionally use the admin client on
 * the server because the opportunity catalog is global while org-specific
 * relevance and pursuit data remain RLS-scoped elsewhere.
 */

import { createAdminClient } from "@/lib/supabase/server";

export async function getOpportunityInventoryCount(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("rfp_opportunities")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error("[rfp/inventory] opportunity count failed", error);
    return 0;
  }

  return count ?? 0;
}
