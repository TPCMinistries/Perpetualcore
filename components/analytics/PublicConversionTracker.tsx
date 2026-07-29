"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/track-event";

const PUBLIC_PREFIXES = [
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

function hasConsent(): boolean {
  return document.cookie
    .split("; ")
    .some((cookie) => cookie === "pc_consent=accepted");
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    PUBLIC_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  );
}

function metadataFromElement(element: HTMLElement): Record<string, string> {
  const metadata: Record<string, string> = {
    surface: "public",
  };
  const keys = [
    "placement",
    "product",
    "status",
    "delivery",
    "destinationHost",
  ] as const;

  for (const key of keys) {
    const value = element.dataset[key];
    if (value) metadata[key] = value.slice(0, 120);
  }
  return metadata;
}

/**
 * One consent-safe public funnel observer. Interactive elements opt in with a
 * `data-pc-event` attribute, keeping instrumentation visible in the markup.
 */
export function PublicConversionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isPublicPath(pathname)) return;

    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let tracked = false;

    const trackPage = () => {
      if (tracked || !hasConsent()) return;
      tracked = true;
      trackClientEvent("page_view", {
        event_name: "public_page_view",
        metadata: { surface: "public" },
      });
    };

    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(trackPage, { timeout: 2500 });
      } else {
        timeoutId = window.setTimeout(trackPage, 1000);
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!hasConsent()) return;
      const target = event.target instanceof Element ? event.target : null;
      const element = target?.closest<HTMLElement>("[data-pc-event]");
      const eventName = element?.dataset.pcEvent;
      if (!element || !eventName) return;
      trackClientEvent("cta_click", {
        event_name: eventName.slice(0, 120),
        metadata: metadataFromElement(element),
      });
    };

    schedule();
    document.addEventListener("click", onClick);
    window.addEventListener("pc-consent-accepted", trackPage);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("pc-consent-accepted", trackPage);
      if (idleId && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
