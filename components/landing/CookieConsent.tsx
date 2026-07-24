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
      path.startsWith("/orgs") ||
      path.startsWith("/org/")
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
      className="fixed bottom-3 left-1/2 z-[100] w-[calc(100%-1.5rem)] max-w-4xl -translate-x-1/2 rounded-[20px] border border-black/10 bg-white/94 p-3.5 shadow-[0_22px_70px_rgba(23,23,27,0.18)] backdrop-blur-xl sm:flex sm:items-center sm:gap-5 sm:px-4"
    >
      <div className="flex-1">
        <p
          id="cookie-consent-heading"
          className="text-xs font-semibold text-[#35353b]"
        >
          Cookie choice
        </p>
        <p id="cookie-consent-desc" className="mt-1 text-xs leading-5 text-[#62626c]">
          We use limited first-party analytics cookies. No advertising pixels and
          no data sold.{" "}
          <Link href="/cookies" className="underline underline-offset-2 hover:no-underline">
            Read the policy
          </Link>
          .
        </p>
      </div>
      <div className="mt-3 flex shrink-0 flex-wrap gap-2 sm:mt-0">
        <button
          type="button"
          onClick={handleAccept}
          className="min-h-11 cursor-pointer rounded-full bg-[#17171b] px-4 text-xs font-semibold text-white transition hover:bg-[#34343c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9] focus-visible:ring-offset-2"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={handleReject}
          className="min-h-11 cursor-pointer rounded-full border border-black/10 bg-white px-4 text-xs font-semibold text-[#393940] transition hover:bg-[#f1f0ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5548d9] focus-visible:ring-offset-2"
        >
          Reject non-essential
        </button>
      </div>
    </div>
  );
}
