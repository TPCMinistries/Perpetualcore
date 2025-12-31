"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  children: ReactNode;
  className?: string;
  showZero?: boolean;
  max?: number;
  dot?: boolean;
  pulse?: boolean;
  color?: "default" | "primary" | "success" | "warning" | "danger";
}

export function NotificationBadge({
  count,
  children,
  className,
  showZero = false,
  max = 99,
  dot = false,
  pulse = true,
  color = "danger",
}: NotificationBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;
  const showBadge = count > 0 || showZero;

  const colorClasses = {
    default: "bg-slate-500",
    primary: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      {children}
      <AnimatePresence>
        {showBadge && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white text-xs font-bold",
              colorClasses[color],
              dot ? "w-3 h-3" : "min-w-[18px] h-[18px] px-1"
            )}
          >
            {pulse && (
              <motion.span
                className={cn(
                  "absolute inset-0 rounded-full",
                  colorClasses[color]
                )}
                animate={{
                  scale: [1, 1.5, 1.5],
                  opacity: [0.7, 0, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}
            {!dot && <span className="relative z-10">{displayCount}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Status indicator dot
interface StatusDotProps {
  status: "online" | "offline" | "busy" | "away" | "idle";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ status, size = "md", pulse = true, className }: StatusDotProps) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-slate-400",
    busy: "bg-red-500",
    away: "bg-yellow-500",
    idle: "bg-slate-400",
  };

  const sizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className={cn("relative inline-flex", className)}>
      <span className={cn("rounded-full", sizes[size], statusColors[status])} />
      {pulse && status === "online" && (
        <motion.span
          className={cn(
            "absolute inset-0 rounded-full",
            statusColors[status]
          )}
          animate={{
            scale: [1, 2, 2],
            opacity: [0.7, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}
    </div>
  );
}

// Live indicator
export function LiveIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <motion.div
        className="w-2 h-2 bg-red-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <span className="text-xs font-medium text-red-500 uppercase">Live</span>
    </div>
  );
}

// Typing indicator
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-slate-400 rounded-full"
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Progress ring
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}

export function ProgressRing({
  progress,
  size = 40,
  strokeWidth = 3,
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-700"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-slate-900 dark:text-white"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
