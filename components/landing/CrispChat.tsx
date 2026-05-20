"use client";

/**
 * Crisp chat widget — gated on pc_consent === "accepted" (or logged-in user
 * implied consent) and only loaded when NEXT_PUBLIC_CRISP_WEBSITE_ID is set.
 *
 * Setup:
 * 1. Sign up at https://crisp.chat (free tier)
 * 2. Copy your Website ID from Settings → Website Settings
 * 3. Set NEXT_PUBLIC_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-... in Vercel env
 * 4. Add https://client.crisp.chat to CSP script-src + frame-src + connect-src
 *
 * Until step 3, this component renders nothing — no widget appears, no script
 * loads. Safe to ship.
 */

import { useEffect, useState } from "react";

const CRISP_PATHS_TO_HIDE = [
  "/dashboard",
  "/admin",
  "/auth",
  "/login",
  "/signup",
];

declare global {
  interface Window {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  }
}

export function CrispChat() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!websiteId) return;

    // Hide on app/auth surfaces — the in-app support flow lives in
    // /dashboard/support, not the chat widget.
    const path = window.location.pathname;
    if (CRISP_PATHS_TO_HIDE.some((p) => path.startsWith(p))) {
      return;
    }

    // Consent gate. Matches the rule in middleware.ts: explicit cookie consent
    // OR a logged-in account context. We can only see the cookie here.
    const consent = document.cookie.match(/(?:^|; )pc_consent=([^;]*)/);
    const accepted = consent?.[1] === "accepted";
    if (!accepted) {
      // Listen for the accept event fired by CookieConsent and load then.
      const onAccept = () => setShouldLoad(true);
      window.addEventListener("pc-consent-accepted", onAccept);
      return () => window.removeEventListener("pc-consent-accepted", onAccept);
    }

    setShouldLoad(true);
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    if (!websiteId) return;

    // Init exactly once
    if (window.$crisp) return;
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    script.id = "crisp-loader";
    document.head.appendChild(script);
  }, [shouldLoad]);

  return null;
}
