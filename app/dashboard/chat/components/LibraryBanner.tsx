"use client";

import { Brain, FileText, Building2 } from "lucide-react";
import { LibraryStats } from "../hooks/useChat";

interface LibraryBannerProps {
  stats: LibraryStats | null;
}

export function LibraryBanner({ stats }: LibraryBannerProps) {
  if (!stats) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-b border-purple-100 dark:border-purple-900/30">
      <div className="max-w-3xl mx-auto px-6 py-3">
        <div className="flex items-center gap-3 text-sm">
          <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            Your AI assistant has access to your <strong>entire library</strong>
          </span>
          <div className="flex items-center gap-3 ml-auto text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-medium">{stats.docCount} documents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              <span className="font-medium">{stats.spacesCount} spaces</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
