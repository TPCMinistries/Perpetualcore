"use client";

import { useEffect } from "react";

const RESET_KEY = "pc-service-worker-reset-2026-05-27";

export function ServiceWorkerReset() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.sessionStorage.getItem(RESET_KEY)) return;

    window.sessionStorage.setItem(RESET_KEY, "1");

    async function resetServiceWorker() {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheNames = await window.caches.keys();
          await Promise.all(
            cacheNames
              .filter((name) =>
                [
                  "workbox",
                  "next",
                  "pages",
                  "apis",
                  "static",
                  "start-url",
                  "supabase",
                ].some((prefix) => name.toLowerCase().includes(prefix))
              )
              .map((name) => window.caches.delete(name))
          );
        }

        if (window.location.pathname.startsWith("/dashboard")) {
          window.location.reload();
        }
      } catch (error) {
        console.warn("Service worker reset failed", error);
      }
    }

    resetServiceWorker();
  }, []);

  return null;
}
