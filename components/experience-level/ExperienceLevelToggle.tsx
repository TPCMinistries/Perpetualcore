"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserExperienceLevel, EXPERIENCE_LEVELS } from "@/types/user-experience";
import { getNavigationStats } from "@/config/navigation";
import { Layers, Check } from "lucide-react";

const STORAGE_KEY = "ai-os-experience-level";

export function ExperienceLevelToggle() {
  const [experienceLevel, setExperienceLevel] = useState<UserExperienceLevel>("intermediate");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    const saved = localStorage.getItem(STORAGE_KEY) as UserExperienceLevel | null;
    if (saved && (saved === "beginner" || saved === "intermediate" || saved === "advanced")) {
      setExperienceLevel(saved);
    }
  }, []);

  const handleLevelChange = (level: UserExperienceLevel) => {
    setExperienceLevel(level);
    localStorage.setItem(STORAGE_KEY, level);

    // Emit custom event so navigation can react
    window.dispatchEvent(new CustomEvent("experienceLevelChanged", {
      detail: { level }
    }));
  };

  const stats = getNavigationStats();
  const currentLevel = EXPERIENCE_LEVELS[experienceLevel];

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between bg-white/5 hover:bg-white/10 border-white/10 text-white"
        >
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm">{currentLevel.icon} {currentLevel.label}</span>
          </div>
          <span className="text-xs text-slate-400">{stats[experienceLevel]} items</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Experience Level</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {(["beginner", "intermediate", "advanced"] as UserExperienceLevel[]).map((level) => {
          const levelInfo = EXPERIENCE_LEVELS[level];
          const isActive = experienceLevel === level;

          return (
            <DropdownMenuItem
              key={level}
              onClick={() => handleLevelChange(level)}
              className={`flex flex-col items-start space-y-1 p-3 cursor-pointer ${
                isActive ? "bg-blue-50 dark:bg-blue-950/30" : ""
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{levelInfo.icon}</span>
                  <span className="font-medium">{levelInfo.label}</span>
                </div>
                {isActive && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                {levelInfo.description}
              </p>

              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Shows {stats[level]} navigation items
              </div>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />

        <div className="p-3 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Beginner: Simple, focused interface</li>
            <li>Intermediate: Balanced feature set</li>
            <li>Advanced: All features unlocked</li>
          </ul>
          <p className="mt-2 text-slate-500 dark:text-slate-500">
            You can switch anytime. Your preference is saved automatically.
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hook to get current experience level
 */
export function useExperienceLevel(): UserExperienceLevel {
  const [level, setLevel] = useState<UserExperienceLevel>("intermediate");

  useEffect(() => {
    // Load initial value
    const saved = localStorage.getItem(STORAGE_KEY) as UserExperienceLevel | null;
    if (saved && (saved === "beginner" || saved === "intermediate" || saved === "advanced")) {
      setLevel(saved);
    }

    // Listen for changes
    const handleChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ level: UserExperienceLevel }>;
      setLevel(customEvent.detail.level);
    };

    window.addEventListener("experienceLevelChanged", handleChange);
    return () => window.removeEventListener("experienceLevelChanged", handleChange);
  }, []);

  return level;
}
