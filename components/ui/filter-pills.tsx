"use client";

import { cn } from "@/lib/utils";

interface FilterOption<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface FilterPillsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterPillsProps<T>) {
  return (
    <div
      className={cn(
        "flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.key}
          onClick={() => onChange(option.key)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-all",
            value === option.key
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span
              className={cn(
                "ml-2 text-xs",
                value === option.key
                  ? "text-slate-500 dark:text-slate-400"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/**
 * Tab-style filter for larger sections
 */
interface TabFilterProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function TabFilter<T extends string>({
  options,
  value,
  onChange,
  className,
}: TabFilterProps<T>) {
  return (
    <div className={cn("border-b border-slate-200 dark:border-slate-800", className)}>
      <div className="flex gap-1">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              value === option.key
                ? "text-violet-600 dark:text-violet-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={cn(
                  "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                  value === option.key
                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}
              >
                {option.count}
              </span>
            )}
            {value === option.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
