"use client";

import { Button } from "@/components/ui/button";
import {
  Check,
  Archive,
  Star,
  X,
  Trash2,
  Clock,
} from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onMarkDone: () => void;
  onArchive: () => void;
  onStar: () => void;
  onSnooze: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionBar({
  selectedCount,
  onMarkDone,
  onArchive,
  onStar,
  onSnooze,
  onDelete,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 p-3 mb-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkDone}
            className="h-8"
          >
            <Check className="h-4 w-4 mr-1" />
            Done
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onStar}
            className="h-8"
          >
            <Star className="h-4 w-4 mr-1" />
            Star
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onSnooze}
            className="h-8"
          >
            <Clock className="h-4 w-4 mr-1" />
            Snooze
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onArchive}
            className="h-8"
          >
            <Archive className="h-4 w-4 mr-1" />
            Archive
          </Button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>

          <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
