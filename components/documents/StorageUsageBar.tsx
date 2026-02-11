"use client";

import { cn } from "@/lib/utils";

interface StorageUsageBarProps {
  usedBytes: number;
  limitGB: number; // -1 means unlimited
  className?: string;
}

function formatStorage(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function StorageUsageBar({ usedBytes, limitGB, className }: StorageUsageBarProps) {
  const isUnlimited = limitGB === -1;
  const limitBytes = limitGB * 1024 * 1024 * 1024;
  const percentage = isUnlimited ? 0 : Math.min((usedBytes / limitBytes) * 100, 100);
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          Storage: {formatStorage(usedBytes)}
        </span>
        <span className="text-slate-500 dark:text-slate-500">
          {isUnlimited ? "Unlimited" : `of ${limitGB} GB`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isCritical
                ? "bg-red-500"
                : isWarning
                ? "bg-amber-500"
                : "bg-violet-500"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isCritical && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Storage almost full. Consider upgrading your plan.
        </p>
      )}
    </div>
  );
}
