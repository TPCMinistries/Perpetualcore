"use client";

import { useState } from "react";
import type { A2UIBlock } from "@/lib/a2ui/types";
import type { CodeBlockData } from "@/lib/a2ui/types";
import { Button } from "@/components/ui/button";
import { Copy, Check, FileCode, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  block: A2UIBlock;
}

export default function CodeBlock({ block }: CodeBlockProps) {
  const data = block.data as CodeBlockData;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <FileCode className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {data.filename || data.language || "code"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {data.runnable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Run code"
            >
              <Play className="h-3 w-3 text-emerald-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-slate-400" />
            )}
          </Button>
        </div>
      </div>

      {/* Code */}
      <div className="bg-slate-950 dark:bg-slate-950 overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code
            className={cn(
              "font-mono text-slate-200",
              data.language && `language-${data.language}`
            )}
          >
            {data.code}
          </code>
        </pre>
      </div>
    </div>
  );
}
