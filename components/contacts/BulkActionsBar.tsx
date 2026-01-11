"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tag, Mail, Download, Trash2, X } from "lucide-react";
import { useContactsPage } from "./ContactsPageProvider";

interface BulkActionsBarProps {
  onTag?: () => void;
  onEmail?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
}

export function BulkActionsBar({
  onTag,
  onEmail,
  onExport,
  onDelete,
}: BulkActionsBarProps) {
  const { selectedCount, hasSelection, clearSelection, openBulkAction } = useContactsPage();

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-900 dark:bg-slate-100 rounded-2xl shadow-2xl shadow-slate-900/50 dark:shadow-slate-900/20 border border-slate-700/50 dark:border-slate-300 backdrop-blur-xl">
            {/* Selection count */}
            <div className="flex items-center gap-2 px-3 py-1">
              <div className="h-6 w-6 rounded-lg bg-violet-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{selectedCount}</span>
              </div>
              <span className="text-sm font-medium text-white dark:text-slate-900">
                selected
              </span>
            </div>

            <Separator orientation="vertical" className="h-6 bg-slate-700 dark:bg-slate-300 mx-1" />

            {/* Tag action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-slate-300 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl transition-all"
                  onClick={() => {
                    if (onTag) onTag();
                    else openBulkAction("tag");
                  }}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Tags
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Add tags (T)</p>
              </TooltipContent>
            </Tooltip>

            {/* Email action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-slate-300 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl transition-all"
                  onClick={() => {
                    if (onEmail) onEmail();
                    else openBulkAction("email");
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Send email (M)</p>
              </TooltipContent>
            </Tooltip>

            {/* Export action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-slate-300 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl transition-all"
                  onClick={() => {
                    if (onExport) onExport();
                    else openBulkAction("export");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Export to CSV (E)</p>
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 bg-slate-700 dark:bg-slate-300 mx-1" />

            {/* Delete action */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 dark:text-rose-500 dark:hover:text-rose-600 dark:hover:bg-rose-100 rounded-xl transition-all"
                  onClick={() => {
                    if (onDelete) onDelete();
                    else openBulkAction("delete");
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Delete selected (D)</p>
              </TooltipContent>
            </Tooltip>

            {/* Clear selection */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-slate-500 hover:text-white dark:text-slate-400 dark:hover:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl transition-all ml-1"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Clear selection (Esc)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
