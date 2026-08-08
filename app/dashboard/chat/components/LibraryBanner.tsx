"use client";

import { Brain, FileText, Building2 } from "lucide-react";
import { LibraryStats } from "../hooks/useChat";

interface LibraryBannerProps {
  stats: LibraryStats | null;
}

export function LibraryBanner({ stats }: LibraryBannerProps) {
  if (!stats) return null;

  return (
    <div className="bg-primary dark:to-blue-950/20 border-b border-primary/20 dark:border-primary/30">
      <div className="max-w-3xl mx-auto px-6 py-3">
        <div className="flex items-center gap-3 text-sm">
          <Brain className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-foreground dark:text-muted-foreground">
            Your AI assistant has access to your <strong>entire library</strong>
          </span>
          <div className="flex items-center gap-3 ml-auto text-xs text-muted-foreground dark:text-muted-foreground">
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
