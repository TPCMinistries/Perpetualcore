/**
 * lib/rfp/admin.ts — Platform admin gate for /admin/rfp/*.
 *
 * v1 auth model: env-var allowlist. Set RFP_PLATFORM_ADMIN_USER_IDS to a
 * comma-separated list of Supabase auth user UUIDs. Anything else hits a
 * 404 via the calling page.
 *
 * The legacy app/admin uses user_profiles.is_super_admin / is_admin which
 * is its own auth surface. We don't reuse it here because (a) the RFP
 * product runs on a different host with a different access policy and
 * (b) keeping the allowlist in env keeps Lorenzo's user_id out of public
 * code while still being easy to rotate.
 */

import { createClient } from "@/lib/supabase/server";

export interface PlatformAdminContext {
  user_id: string;
  email: string | null;
}

function getAllowedIds(): Set<string> {
  const raw = process.env.RFP_PLATFORM_ADMIN_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
}

/**
 * Returns the admin context if the caller is allowlisted, else null.
 * Page should `notFound()` on null — never reveal the route exists.
 */
export async function getRfpPlatformAdmin(): Promise<PlatformAdminContext | null> {
  const allowed = getAllowedIds();
  if (allowed.size === 0) return null; // env not configured — fail closed

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!allowed.has(user.id)) return null;

  return { user_id: user.id, email: user.email ?? null };
}
