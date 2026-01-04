"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HelpCircle,
  Lightbulb,
  ArrowRight,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface ContextualHelpProps {
  title: string;
  description: string;
  tips?: string[];
  learnMoreUrl?: string;
  aiPrompt?: string;
  position?: "top" | "bottom" | "left" | "right";
  children?: React.ReactNode;
}

/**
 * Inline help tooltip with optional tips and learn more link
 */
export function ContextualHelp({
  title,
  description,
  tips,
  learnMoreUrl,
  aiPrompt,
  position = "top",
  children,
}: ContextualHelpProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted transition-colors">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={position} className="max-w-xs p-0 overflow-hidden">
          <div className="p-3">
            <p className="font-medium text-sm mb-1">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>

            {tips && tips.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs font-medium mb-1 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                  Tips
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {tips.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {(learnMoreUrl || aiPrompt) && (
            <div className="flex gap-1 p-2 bg-muted/50 border-t">
              {learnMoreUrl && (
                <Link href={learnMoreUrl}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Learn more
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
              {aiPrompt && (
                <Link href={`/dashboard/chat?prompt=${encodeURIComponent(aiPrompt)}`}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Ask AI
                  </Button>
                </Link>
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface FeatureSpotlightProps {
  featureId: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  onDismiss?: () => void;
  children: React.ReactNode;
}

/**
 * Spotlight for highlighting new or important features
 */
export function FeatureSpotlight({
  featureId,
  title,
  description,
  position = "bottom",
  onDismiss,
  children,
}: FeatureSpotlightProps) {
  const [dismissed, setDismissed] = useState(false);

  // Check if already dismissed
  const storageKey = `spotlight-${featureId}`;

  useState(() => {
    if (typeof window !== "undefined") {
      const wasDismissed = localStorage.getItem(storageKey);
      if (wasDismissed) {
        setDismissed(true);
      }
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(storageKey, "true");
    onDismiss?.();
  };

  if (dismissed) {
    return <>{children}</>;
  }

  return (
    <div className="relative inline-block">
      {/* Pulsing ring around the element */}
      <div className="absolute inset-0 -m-1 rounded-lg">
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-violet-500"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {children}

      {/* Spotlight tooltip */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: position === "top" ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: position === "top" ? -10 : 10 }}
          className={`absolute z-50 w-64 ${
            position === "top"
              ? "bottom-full mb-2"
              : position === "bottom"
              ? "top-full mt-2"
              : position === "left"
              ? "right-full mr-2"
              : "left-full ml-2"
          }`}
        >
          <div className="bg-violet-600 text-white rounded-lg shadow-lg p-3 relative">
            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 bg-violet-600 rotate-45 ${
                position === "top"
                  ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                  : position === "bottom"
                  ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  : position === "left"
                  ? "right-0 top-1/2 translate-x-1/2 -translate-y-1/2"
                  : "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
              }`}
            />

            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{title}</p>
                <p className="text-xs text-violet-200 mt-0.5">{description}</p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-0.5 hover:bg-violet-500 rounded transition-colors flex-shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

interface PageHelpProps {
  title: string;
  description: string;
  quickActions?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
  }[];
}

/**
 * Page-level help section that appears at the top of pages
 */
export function PageHelp({ title, description, quickActions }: PageHelpProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-4 mb-6"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900">
          <Lightbulb className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>

          {quickActions && quickActions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {quickActions.map((action, i) => (
                <Link key={i} href={action.href}>
                  <Button variant="secondary" size="sm" className="h-7 text-xs">
                    {action.icon}
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-violet-100 dark:hover:bg-violet-800 rounded transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
