"use client";

import { useCallback } from "react";
import type { AnalyticsEventType } from "./types";
import { ANON_COOKIE_NAME, SESSION_COOKIE_NAME } from "./utm-store";

/**
 * Get a cookie value by name (client-side).
 */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * React hook for tracking analytics events from the client.
 * Sends events to /api/analytics/track which handles server-side storage.
 */
export function useTrackEvent() {
  return useCallback(
    (
      eventType: AnalyticsEventType,
      options?: {
        event_name?: string;
        metadata?: Record<string, unknown>;
      }
    ) => {
      const anonymousId = getCookie(ANON_COOKIE_NAME);
      const sessionId = getCookie(SESSION_COOKIE_NAME);

      // Fire and forget — non-blocking
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          event_name: options?.event_name,
          anonymous_id: anonymousId,
          session_id: sessionId,
          page_url: window.location.href,
          page_path: window.location.pathname,
          metadata: options?.metadata,
        }),
        keepalive: true, // Survives page navigations
      }).catch(() => {});
    },
    []
  );
}

/**
 * Standalone tracking function (non-hook, for use outside React components).
 */
export function trackClientEvent(
  eventType: AnalyticsEventType,
  options?: {
    event_name?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const anonymousId = getCookie(ANON_COOKIE_NAME);
  const sessionId = getCookie(SESSION_COOKIE_NAME);

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_type: eventType,
      event_name: options?.event_name,
      anonymous_id: anonymousId,
      session_id: sessionId,
      page_url: window.location.href,
      page_path: window.location.pathname,
      metadata: options?.metadata,
    }),
    keepalive: true,
  }).catch(() => {});
}
