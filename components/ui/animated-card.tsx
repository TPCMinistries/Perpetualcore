"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hover = true,
  onClick,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={hover ? {
        y: -4,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 }
      } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedGlassCard({
  children,
  className,
  delay = 0,
  hover = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, y: 0, backdropFilter: "blur(16px)" }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={hover ? {
        y: -4,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 }
      } : undefined}
      className={cn(
        "rounded-xl border border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedStatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  delay = 0,
}: {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <motion.p
            className="text-3xl font-bold mt-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2, type: "spring", stiffness: 300 }}
          >
            {value}
          </motion.p>
          {change && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
              className={cn(
                "text-sm mt-1",
                changeType === "positive" && "text-green-600",
                changeType === "negative" && "text-red-600",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </motion.p>
          )}
        </div>
        {icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.1, type: "spring", stiffness: 300 }}
            className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800"
          >
            {icon}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function AnimatedFeatureCard({
  title,
  description,
  icon,
  delay = 0,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -8,
        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        transition: { duration: 0.2 }
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6",
        onClick && "cursor-pointer"
      )}
    >
      <motion.div
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="inline-flex p-3 rounded-lg bg-slate-100 dark:bg-slate-800 mb-4"
      >
        {icon}
      </motion.div>
      <h3 className="font-semibold text-lg mb-2 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
