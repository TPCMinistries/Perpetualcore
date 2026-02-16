"use client";

import { useState, useCallback } from "react";
import type { A2UIBlock } from "@/lib/a2ui/types";
import type { ChecklistBlockData, ChecklistItem } from "@/lib/a2ui/types";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ChecklistBlockProps {
  block: A2UIBlock;
}

export default function ChecklistBlock({ block }: ChecklistBlockProps) {
  const data = block.data as ChecklistBlockData;
  const [items, setItems] = useState<ChecklistItem[]>(data.items);

  const handleToggle = useCallback(
    async (itemId: string, checked: boolean) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, checked } : item
        )
      );

      // Fire and forget callback
      try {
        await fetch("/api/a2ui/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            callbackId: data.callbackId,
            data: { itemId, checked },
          }),
        });
      } catch {
        // Revert on error
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, checked: !checked } : item
          )
        );
      }
    },
    [data.callbackId]
  );

  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-300"
            style={{
              width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
            }}
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
          {checkedCount}/{items.length}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex items-center gap-2.5 py-1 cursor-pointer group",
              item.checked && "opacity-60"
            )}
          >
            <Checkbox
              checked={item.checked}
              onCheckedChange={(checked) =>
                handleToggle(item.id, checked as boolean)
              }
              className="data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500"
            />
            <span
              className={cn(
                "text-sm text-slate-700 dark:text-slate-300 transition-all",
                item.checked && "line-through text-slate-400 dark:text-slate-500"
              )}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
