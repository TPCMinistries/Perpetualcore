"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  violet: "from-violet-500 to-purple-600 shadow-violet-500/20",
  blue: "from-blue-500 to-cyan-600 shadow-blue-500/20",
  green: "from-emerald-500 to-teal-600 shadow-emerald-500/20",
  amber: "from-amber-500 to-orange-600 shadow-amber-500/20",
  rose: "from-rose-500 to-pink-600 shadow-rose-500/20",
  indigo: "from-indigo-500 to-blue-600 shadow-indigo-500/20",
  slate: "from-slate-600 to-slate-800 shadow-slate-500/20",
};

const buttonVariants = {
  primary: "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg shadow-primary/20 border-0 rounded-xl",
  secondary: "bg-foreground hover:bg-foreground/90 text-background rounded-xl",
  outline: "border hover:bg-accent rounded-xl",
  ghost: "hover:bg-accent rounded-xl",
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
              "h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-glow-sm",
              iconColors[iconColor]
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>

          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {title}
              </h1>
              {badge && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/[0.08] px-2.5 py-1 rounded-full">
                  {badge.icon && <badge.icon className="h-3 w-3" />}
                  {badge.label}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
            {stats && stats.length > 0 && (
              <p className="text-muted-foreground mt-0.5">
                {stats.map((stat, i) => (
                  <span key={stat.label}>
                    {i > 0 && " · "}
                    <span className="font-medium text-foreground">
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
 * Page wrapper with consistent background
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
    <div className="min-h-screen bg-background">
      <div className={cn(maxWidthClass[maxWidth], "mx-auto px-6 py-8", className)}>
        {children}
      </div>
    </div>
  );
}
