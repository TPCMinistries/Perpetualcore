import { createAdminClient } from "@/lib/supabase/server";
import type { AnalyticsEvent } from "./types";

/**
 * Track an analytics event server-side (fire-and-forget).
 * Always uses createAdminClient() — safe for background/async contexts.
 */
export function trackEvent(event: AnalyticsEvent): void {
  trackEventAsync(event).catch((err) =>
    console.error("[Analytics] Failed to track event:", err)
  );
}

async function trackEventAsync(event: AnalyticsEvent): Promise<string | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("track_analytics_event", {
    p_event_type: event.event_type,
    p_event_name: event.event_name ?? null,
    p_user_id: event.user_id ?? null,
    p_anonymous_id: event.anonymous_id ?? null,
    p_session_id: event.session_id ?? null,
    p_utm_source: event.utm_source ?? null,
    p_utm_medium: event.utm_medium ?? null,
    p_utm_campaign: event.utm_campaign ?? null,
    p_utm_term: event.utm_term ?? null,
    p_utm_content: event.utm_content ?? null,
    p_referrer: event.referrer ?? null,
    p_page_url: event.page_url ?? null,
    p_page_path: event.page_path ?? null,
    p_metadata: event.metadata ?? {},
    p_user_agent: event.user_agent ?? null,
    p_ip_address: event.ip_address ?? null,
  });

  if (error) {
    console.error("[Analytics] RPC error:", error);
    return null;
  }

  return data;
}

/**
 * Link anonymous visitor events to a user after signup.
 */
export async function linkAnonymousToUser(
  anonymousId: string,
  userId: string
): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("link_anonymous_to_user", {
    p_anonymous_id: anonymousId,
    p_user_id: userId,
  });

  if (error) {
    console.error("[Analytics] Failed to link anonymous to user:", error);
    return 0;
  }

  return data ?? 0;
}

/**
 * Track signup event with anonymous-to-user linking.
 */
export function trackSignup(
  userId: string,
  anonymousId: string | undefined,
  utm: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer?: string;
  },
  method: string
): void {
  trackEvent({
    event_type: "signup",
    event_name: `signup_${method}`,
    user_id: userId,
    anonymous_id: anonymousId,
    ...utm,
    metadata: { method },
  });

  // Link prior anonymous events to this user
  if (anonymousId) {
    linkAnonymousToUser(anonymousId, userId).catch(() => {});
  }
}

/**
 * Track activation milestone events.
 */
export function trackActivation(
  userId: string,
  milestone: "first_chat" | "first_document" | "explore_agents",
  metadata?: Record<string, unknown>
): void {
  trackEvent({
    event_type: milestone,
    user_id: userId,
    metadata,
  });
}
