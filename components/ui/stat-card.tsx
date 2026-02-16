"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function useCountUp(end: number, duration = 600) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    const start = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [end, duration]);

  return count;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: "violet" | "blue" | "green" | "amber" | "rose" | "indigo" | "slate" | "emerald" | "cyan";
  change?: {
    value: string;
    trend: "up" | "down" | "neutral";
  };
  description?: string;
  className?: string;
}

const iconColors = {
  violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
};

const trendColors = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  neutral: "text-muted-foreground",
};

function AnimatedValue({ value }: { value: string | number }) {
  // If the value is a pure integer, count up to it
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    const animatedCount = useCountUp(value);
    return <>{animatedCount.toLocaleString()}</>;
  }
  // If it's a string like "1,234" or "$5.2K" or "89%", just fade it in
  return <>{value}</>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = "violet",
  change,
  description,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className={cn("p-3 rounded-xl", iconColors[iconColor])}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold text-foreground truncate">
                <AnimatedValue value={value} />
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {label}
              </p>
            </div>
            {change && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={cn("text-sm font-medium", trendColors[change.trend])}
              >
                {change.trend === "up" && "↑"}
                {change.trend === "down" && "↓"}
                {change.value}
              </motion.div>
            )}
          </div>
          {description && (
            <p className="mt-3 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Grid wrapper for stat cards with responsive columns
 */
export function StatCardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.08, delayChildren: 0.1 },
        },
      }}
      className={cn("grid gap-4", gridCols[columns], className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Mini stat for inline display
 */
export function MiniStat({
  label,
  value,
  icon: Icon,
  iconColor = "slate",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: keyof typeof iconColors;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("p-1.5 rounded-lg", iconColors[iconColor])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
