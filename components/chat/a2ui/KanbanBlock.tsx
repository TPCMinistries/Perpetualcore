"use client";

import type { A2UIBlock } from "@/lib/a2ui/types";
import type { KanbanBlockData } from "@/lib/a2ui/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KanbanBlockProps {
  block: A2UIBlock;
}

const COLUMN_COLORS: Record<string, string> = {
  todo: "border-t-slate-400",
  "to do": "border-t-slate-400",
  backlog: "border-t-slate-400",
  "in progress": "border-t-blue-500",
  "in-progress": "border-t-blue-500",
  doing: "border-t-blue-500",
  active: "border-t-blue-500",
  review: "border-t-amber-500",
  "in review": "border-t-amber-500",
  done: "border-t-emerald-500",
  complete: "border-t-emerald-500",
  completed: "border-t-emerald-500",
};

export default function KanbanBlock({ block }: KanbanBlockProps) {
  const data = block.data as KanbanBlockData;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 overflow-x-auto">
      <div className="flex gap-3 min-w-max">
        {data.columns.map((column) => {
          const colorClass =
            COLUMN_COLORS[column.title.toLowerCase()] || "border-t-violet-500";

          return (
            <div
              key={column.id}
              className={cn(
                "w-56 flex-shrink-0 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 border-t-2",
                colorClass
              )}
            >
              {/* Column header */}
              <div className="px-3 py-2 flex items-center justify-between">
                <h5 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {column.title}
                </h5>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium bg-slate-200 dark:bg-slate-700 rounded-full px-1.5 py-0.5">
                  {column.items.length}
                </span>
              </div>

              {/* Column items */}
              <div className="px-2 pb-2 space-y-2">
                {column.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 shadow-sm"
                  >
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.labels && item.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.labels.map((label) => (
                          <Badge
                            key={label}
                            variant="secondary"
                            className="text-[9px] px-1 py-0 h-4"
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {column.items.length === 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center py-4">
                    No items
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
