"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics/track-event";

/**
 * Fires a `page_view` event once per page load.
 * Uses a ref to prevent double-fires in React Strict Mode.
 * Drop this component into any layout or page to auto-track views.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    // Only fire once per unique pathname
    if (tracked.current === pathname) return;
    tracked.current = pathname;

    trackClientEvent("page_view", {
      metadata: { page_path: pathname },
    });
  }, [pathname]);

  return null;
}
