"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Trash2, FolderIcon, Tag, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BulkActionBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClearSelection: () => void;
  onDeleteComplete: () => void;
}

export function BulkActionBar({
  selectedCount,
  selectedIds,
  onClearSelection,
  onDeleteComplete,
}: BulkActionBarProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedCount} document(s)? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Deleted ${data.deleted || selectedCount} document(s)`);
        onClearSelection();
        onDeleteComplete();
      } else {
        toast.error("Failed to delete documents");
      }
    } catch (error) {
      toast.error("Failed to delete documents");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl shadow-black/20 px-6 py-4 flex items-center gap-4"
        >
          <span className="text-sm font-medium">
            {selectedCount} selected
          </span>

          <div className="h-6 w-px bg-slate-700" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            Delete
          </Button>

          <div className="h-6 w-px bg-slate-700" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
