"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid, Users, Check, ChevronDown } from "lucide-react";
import { DashboardMode, DASHBOARD_MODES } from "@/types/user-experience";

const STORAGE_KEY = "perpetual-dashboard-mode";

/**
 * Hook to get and set dashboard mode
 */
export function useDashboardMode(): DashboardMode {
  const [mode, setMode] = useState<DashboardMode>("full");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as DashboardMode;
    if (saved && (saved === "simple" || saved === "full")) {
      setMode(saved);
    }

    // Listen for changes from other components
    const handleChange = (event: CustomEvent<{ mode: DashboardMode }>) => {
      setMode(event.detail.mode);
    };

    window.addEventListener("dashboardModeChanged" as any, handleChange);
    return () => {
      window.removeEventListener("dashboardModeChanged" as any, handleChange);
    };
  }, []);

  // Return default during SSR
  if (!mounted) return "full";

  return mode;
}

/**
 * Hook to set dashboard mode
 */
export function useSetDashboardMode() {
  return useCallback((mode: DashboardMode) => {
    localStorage.setItem(STORAGE_KEY, mode);

    // Emit custom event for other components
    window.dispatchEvent(
      new CustomEvent("dashboardModeChanged", { detail: { mode } })
    );
  }, []);
}

interface DashboardModeToggleProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Toggle component for switching between Simple and Full dashboard modes
 */
export function DashboardModeToggle({
  className,
  showLabel = true,
}: DashboardModeToggleProps) {
  const mode = useDashboardMode();
  const setMode = useSetDashboardMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className={className} disabled>
        <LayoutGrid className="h-4 w-4 mr-2" />
        {showLabel && "Loading..."}
      </Button>
    );
  }

  const currentMode = DASHBOARD_MODES[mode];
  const Icon = mode === "simple" ? Users : LayoutGrid;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Icon className="h-4 w-4 mr-2" />
          {showLabel && currentMode.label}
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {(Object.keys(DASHBOARD_MODES) as DashboardMode[]).map((modeKey) => {
          const modeConfig = DASHBOARD_MODES[modeKey];
          const isActive = mode === modeKey;
          const ModeIcon = modeKey === "simple" ? Users : LayoutGrid;

          return (
            <DropdownMenuItem
              key={modeKey}
              onClick={() => setMode(modeKey)}
              className="flex items-start gap-3 py-3"
            >
              <ModeIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{modeConfig.label}</span>
                  {isActive && <Check className="h-4 w-4 text-primary" />}
                </div>
                <span className="text-xs text-muted-foreground">
                  {modeConfig.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
