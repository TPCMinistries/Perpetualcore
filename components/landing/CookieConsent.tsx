"use client";

/**
 * Cookie consent banner — required for GDPR/UK PECR compliance.
 * Writes `pc_consent` cookie (accepted | rejected). Middleware reads
 * this and only sets analytics cookies (pc_anon_id, pc_session_id,
 * pc_utm) when consent === "accepted".
 *
 * Cookies that aren't gated:
 * - Supabase auth cookies (necessary for the app to function)
 *
 * Banner only renders client-side and only when no decision exists yet.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_COOKIE = "pc_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; max-age=${maxAgeSec}; path=/; samesite=lax${secure}`;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Hide on dashboard, auth, and admin paths — those need cookies to function
    const path = window.location.pathname;
    if (
      path.startsWith("/dashboard") ||
      path.startsWith("/admin") ||
      path.startsWith("/auth") ||
      path.startsWith("/login") ||
      path.startsWith("/signup") ||
      path.startsWith("/accept-invite") ||
      path.startsWith("/invite") ||
      path.startsWith("/orgs")
    ) {
      return;
    }
    if (!readCookie(CONSENT_COOKIE)) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    writeCookie(CONSENT_COOKIE, "accepted", CONSENT_MAX_AGE);
    setVisible(false);
    // Optional: notify analytics to start firing
    try {
      window.dispatchEvent(new CustomEvent("pc-consent-accepted"));
    } catch {
      /* ignore */
    }
  };

  const handleReject = () => {
    writeCookie(CONSENT_COOKIE, "rejected", CONSENT_MAX_AGE);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-heading"
      aria-describedby="cookie-consent-desc"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-[100] border border-border bg-card shadow-xl rounded-[8px] p-5"
    >
      <p
        id="cookie-consent-heading"
        className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3"
      >
        Cookies
      </p>
      <p id="cookie-consent-desc" className="text-sm text-foreground leading-[1.6] mb-4">
        We use a small set of first-party cookies to understand which marketing
        channels send the people we should pay attention to. No third-party ad
        pixels. No data sold.{" "}
        <Link href="/cookies" className="underline hover:no-underline">
          Read the cookie policy
        </Link>
        .
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAccept}
          className="h-9 px-4 bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition rounded-[6px]"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={handleReject}
          className="h-9 px-4 bg-background border border-border text-foreground text-xs font-medium hover:bg-card transition rounded-[6px]"
        >
          Reject non-essential
        </button>
      </div>
    </div>
  );
}
