/**
 * Browser Cookie Store
 *
 * Persists cookies per-user per-domain in Supabase for session persistence
 * across browser automation actions. Stored as JSONB in user_skills config.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { CookieData } from "./types";

const COOKIE_CONFIG_KEY = "browser_cookies";

/**
 * Save cookies for a user/domain combination.
 */
export async function saveCookies(
  userId: string,
  domain: string,
  cookies: CookieData[]
): Promise<void> {
  const supabase = createAdminClient();

  // Load existing cookie store
  const { data: existing } = await supabase
    .from("user_skills")
    .select("config")
    .eq("user_id", userId)
    .eq("skill_id", "browser")
    .single();

  const config = existing?.config || {};
  const cookieStore = config[COOKIE_CONFIG_KEY] || {};
  cookieStore[domain] = cookies;

  await supabase
    .from("user_skills")
    .upsert(
      {
        user_id: userId,
        skill_id: "browser",
        enabled: true,
        config: { ...config, [COOKIE_CONFIG_KEY]: cookieStore },
        installed_at: existing ? undefined : new Date().toISOString(),
      },
      { onConflict: "user_id,skill_id" }
    );
}

/**
 * Load cookies for a user/domain combination.
 */
export async function loadCookies(
  userId: string,
  domain: string
): Promise<CookieData[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("user_skills")
    .select("config")
    .eq("user_id", userId)
    .eq("skill_id", "browser")
    .single();

  if (!data?.config?.[COOKIE_CONFIG_KEY]?.[domain]) {
    return [];
  }

  return data.config[COOKIE_CONFIG_KEY][domain] as CookieData[];
}

/**
 * Clear cookies for a user. Optionally filter by domain.
 */
export async function clearCookies(
  userId: string,
  domain?: string
): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("user_skills")
    .select("config")
    .eq("user_id", userId)
    .eq("skill_id", "browser")
    .single();

  if (!existing?.config?.[COOKIE_CONFIG_KEY]) {
    return;
  }

  const config = { ...existing.config };

  if (domain) {
    const cookieStore = { ...config[COOKIE_CONFIG_KEY] };
    delete cookieStore[domain];
    config[COOKIE_CONFIG_KEY] = cookieStore;
  } else {
    config[COOKIE_CONFIG_KEY] = {};
  }

  await supabase
    .from("user_skills")
    .update({ config })
    .eq("user_id", userId)
    .eq("skill_id", "browser");
}
