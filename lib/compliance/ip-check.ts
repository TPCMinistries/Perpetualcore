import { createAdminClient } from "@/lib/supabase/server";

interface IPWhitelistEntry {
  ip_range: string;
  enabled: boolean;
}

/**
 * Check if an IP address is allowed for a given organization.
 * If no whitelist entries exist, all IPs are allowed.
 * Uses CIDR matching via Postgres inet operators.
 */
export async function isIPAllowed(
  ip: string,
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  if (!ip || ip === "unknown") {
    return { allowed: true, reason: "no_ip" };
  }

  const supabase = createAdminClient();

  // Check if org has any enabled whitelist rules
  const { data: rules, error } = await supabase
    .from("ip_whitelist")
    .select("ip_range, enabled")
    .eq("organization_id", organizationId)
    .eq("enabled", true);

  if (error || !rules || rules.length === 0) {
    // No whitelist rules = allow all
    return { allowed: true, reason: "no_rules" };
  }

  // Use Postgres CIDR matching via RPC
  const { data: matchResult, error: matchError } = await supabase.rpc(
    "check_ip_whitelist",
    {
      check_ip: ip,
      org_id: organizationId,
    }
  );

  if (matchError) {
    // On error, fail open to avoid lockout
    console.error("IP whitelist check error:", matchError);
    return { allowed: true, reason: "check_error" };
  }

  return {
    allowed: !!matchResult,
    reason: matchResult ? "whitelisted" : "blocked",
  };
}

/**
 * Get organization ID from user profile for middleware use.
 */
export async function getOrgIdForUser(userId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  return data?.organization_id ?? null;
}
