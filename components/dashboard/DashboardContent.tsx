"use client";

import { useState, useEffect } from "react";
import { DailyBriefing } from "@/components/briefing/DailyBriefing";
import { SimpleModeDashboard } from "@/components/dashboard/SimpleModeDashboard";
import { useDashboardMode } from "@/components/dashboard/DashboardModeToggle";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardContentProps {
  userId: string;
  userName: string;
}

/**
 * Smart dashboard content that switches between Simple and Full modes
 */
export function DashboardContent({ userId, userName }: DashboardContentProps) {
  const dashboardMode = useDashboardMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading skeleton during hydration
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render based on mode
  if (dashboardMode === "simple") {
    return <SimpleModeDashboard userId={userId} userName={userName} />;
  }

  // Default: Full mode with Daily Briefing
  return <DailyBriefing userId={userId} userName={userName} />;
}
