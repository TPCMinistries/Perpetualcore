"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DashboardHeaderAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
}

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: "violet" | "blue" | "green" | "amber" | "rose" | "indigo" | "slate";
  badge?: {
    label: string;
    icon?: LucideIcon;
  };
  stats?: {
    label: string;
    value: string | number;
  }[];
  actions?: DashboardHeaderAction[];
  children?: React.ReactNode;
}

const iconColors = {
  violet: "from-violet-500 to-purple-600 shadow-violet-500/25",
  blue: "from-blue-500 to-cyan-600 shadow-blue-500/25",
  green: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
  amber: "from-amber-500 to-orange-600 shadow-amber-500/25",
  rose: "from-rose-500 to-pink-600 shadow-rose-500/25",
  indigo: "from-indigo-500 to-blue-600 shadow-indigo-500/25",
  slate: "from-slate-600 to-slate-800 shadow-slate-500/25",
};

const buttonVariants = {
  primary: "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 border-0",
  secondary: "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900",
  outline: "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
  ghost: "hover:bg-slate-100 dark:hover:bg-slate-800",
};

export function DashboardHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = "violet",
  badge,
  stats,
  actions,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          {/* Icon Badge */}
          <div
            className={cn(
              "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
              iconColors[iconColor]
            )}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>

          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {title}
              </h1>
              {badge && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full">
                  {badge.icon && <badge.icon className="h-3 w-3" />}
                  {badge.label}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
            {stats && stats.length > 0 && (
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                {stats.map((stat, i) => (
                  <span key={stat.label}>
                    {i > 0 && " · "}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {stat.value}
                    </span>{" "}
                    {stat.label}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-3">
            {actions.map((action, i) => {
              const ActionIcon = action.icon;
              const variant = action.variant || "primary";

              if (action.href) {
                return (
                  <Button
                    key={i}
                    asChild
                    className={cn("h-11 px-5", buttonVariants[variant])}
                  >
                    <a href={action.href}>
                      {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                      {action.label}
                    </a>
                  </Button>
                );
              }

              return (
                <Button
                  key={i}
                  onClick={action.onClick}
                  className={cn("h-11 px-5", buttonVariants[variant])}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional children (filters, tabs, etc.) */}
      {children}
    </div>
  );
}

/**
 * Page wrapper with consistent gradient background
 */
export function DashboardPageWrapper({
  children,
  maxWidth = "7xl",
  className,
}: {
  children: React.ReactNode;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
}) {
  const maxWidthClass = {
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className={cn(maxWidthClass[maxWidth], "mx-auto px-6 py-8", className)}>
        {children}
      </div>
    </div>
  );
}
