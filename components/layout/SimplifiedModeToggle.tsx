"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
} from "lucide-react";

type ViewMode = "simple" | "standard" | "power";

interface ViewModeConfig {
  id: ViewMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
}

const VIEW_MODES: ViewModeConfig[] = [
  {
    id: "simple",
    name: "Simple",
    description: "Essential features only",
    icon: <Eye className="h-4 w-4" />,
    features: ["Home", "AI Chat", "Search", "Tasks", "Documents"],
  },
  {
    id: "standard",
    name: "Standard",
    description: "Balanced for most users",
    icon: <Sparkles className="h-4 w-4" />,
    features: ["All core features", "Automation", "Teams", "Analytics"],
  },
  {
    id: "power",
    name: "Power User",
    description: "Everything unlocked",
    icon: <Zap className="h-4 w-4" />,
    features: ["Full feature set", "Developer tools", "API access", "Webhooks"],
  },
];

interface SimplifiedModeToggleProps {
  onModeChange?: (mode: ViewMode) => void;
  compact?: boolean;
}

export function SimplifiedModeToggle({ onModeChange, compact = false }: SimplifiedModeToggleProps) {
  const [currentMode, setCurrentMode] = useState<ViewMode>("standard");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("perpetual-view-mode");
    if (saved && ["simple", "standard", "power"].includes(saved)) {
      setCurrentMode(saved as ViewMode);
    }
  }, []);

  const handleModeChange = (mode: ViewMode) => {
    setCurrentMode(mode);
    localStorage.setItem("perpetual-view-mode", mode);
    setIsOpen(false);

    if (onModeChange) {
      onModeChange(mode);
    }

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent("view-mode-change", { detail: mode }));
  };

  const currentConfig = VIEW_MODES.find(m => m.id === currentMode) || VIEW_MODES[1];

  if (compact) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1.5 h-7">
            {currentConfig.icon}
            <span className="text-xs">{currentConfig.name}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="end">
          <div className="space-y-1">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                  currentMode === mode.id
                    ? "bg-violet-100 dark:bg-violet-900/30"
                    : "hover:bg-muted"
                }`}
              >
                <div className={`p-1.5 rounded ${
                  currentMode === mode.id
                    ? "bg-violet-200 dark:bg-violet-800 text-violet-600 dark:text-violet-300"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{mode.name}</span>
                    {currentMode === mode.id && (
                      <Check className="h-3 w-3 text-violet-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {mode.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">View Mode</h4>
        <Badge variant="secondary" className="text-xs">
          {currentConfig.name}
        </Badge>
      </div>

      <div className="flex gap-2">
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleModeChange(mode.id)}
            className={`flex-1 p-3 rounded-lg border-2 transition-all ${
              currentMode === mode.id
                ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                : "border-transparent bg-background hover:border-muted"
            }`}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className={`p-2 rounded-lg ${
                currentMode === mode.id
                  ? "bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300"
                  : "bg-muted text-muted-foreground"
              }`}>
                {mode.icon}
              </div>
              <span className="text-xs font-medium">{mode.name}</span>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentMode}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="mt-3 text-xs text-muted-foreground"
        >
          <p className="mb-1">{currentConfig.description}</p>
          <div className="flex flex-wrap gap-1">
            {currentConfig.features.map((feature, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                {feature}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Hook to get current view mode
 */
export function useViewMode() {
  const [mode, setMode] = useState<ViewMode>("standard");

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("perpetual-view-mode");
    if (saved && ["simple", "standard", "power"].includes(saved)) {
      setMode(saved as ViewMode);
    }

    // Listen for mode changes
    const handleChange = (e: CustomEvent<ViewMode>) => {
      setMode(e.detail);
    };

    window.addEventListener("view-mode-change" as any, handleChange);
    return () => window.removeEventListener("view-mode-change" as any, handleChange);
  }, []);

  return mode;
}
