"use client";

import { useReportWebVitals } from "next/web-vitals";

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

/**
 * A small, consent-gated real-user measurement sample. It records only the
 * metric name, rating, and numeric value — never form contents or identity.
 */
export function PublicWebVitals() {
  useReportWebVitals((metric) => {
    if (!hasConsent() || !isPublicPath(window.location.pathname)) return;

    const sampleKey =
      window.sessionStorage.getItem("pc_vitals_sample") ??
      String(Math.random() < 0.1);
    window.sessionStorage.setItem("pc_vitals_sample", sampleKey);
    if (sampleKey !== "true") return;

    const body = JSON.stringify({
      event_type: "page_view",
      event_name: `public_web_vital_${metric.name.toLowerCase()}`,
      page_path: window.location.pathname,
      metadata: {
        surface: "public",
        metric: metric.name,
        rating: metric.rating,
        value: Math.round(metric.value * 100) / 100,
      },
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/analytics/track",
        new Blob([body], { type: "application/json" })
      );
      return;
    }

    void fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  });

  return null;
}
