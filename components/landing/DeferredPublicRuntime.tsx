"use client";

import { useEffect, useState } from "react";

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/blog",
  "/contact-sales",
  "/engine",
  "/fund",
  "/institute",
  "/marketplace",
  "/pricing",
  "/products",
  "/solutions",
  "/studio",
];

function isPublicMarketingPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`))
  );
}

function hasAnalyticsConsent(): boolean {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie === "pc_consent=accepted");
}

type DeferredComponent = React.ComponentType;

/**
 * Keeps third-party chat and engagement prompts out of the critical rendering
 * path. Both are restricted to public marketing surfaces; chat additionally
 * requires explicit cookie consent.
 */
export function DeferredPublicRuntime() {
  const [Crisp, setCrisp] = useState<DeferredComponent | null>(null);
  const [ExitPrompt, setExitPrompt] = useState<DeferredComponent | null>(null);

  useEffect(() => {
    if (!isPublicMarketingPath(window.location.pathname)) return;

    let disposed = false;
    let chatTimer: number | undefined;
    let promptTimer: number | undefined;

    const scheduleChat = () => {
      if (!hasAnalyticsConsent() || chatTimer) return;
      chatTimer = window.setTimeout(() => {
        void import("@/components/landing/CrispChat").then(({ CrispChat }) => {
          if (!disposed) setCrisp(() => CrispChat);
        });
      }, 15000);
    };

    const schedulePrompt = () => {
      promptTimer = window.setTimeout(() => {
        void import("@/components/landing/ExitIntent").then(({ ExitIntent }) => {
          if (!disposed) setExitPrompt(() => ExitIntent);
        });
      }, 12000);
    };

    scheduleChat();
    schedulePrompt();
    window.addEventListener("pc-consent-accepted", scheduleChat);

    return () => {
      disposed = true;
      window.removeEventListener("pc-consent-accepted", scheduleChat);
      if (chatTimer) window.clearTimeout(chatTimer);
      if (promptTimer) window.clearTimeout(promptTimer);
    };
  }, []);

  return (
    <>
      {Crisp ? <Crisp /> : null}
      {ExitPrompt ? <ExitPrompt /> : null}
    </>
  );
}
