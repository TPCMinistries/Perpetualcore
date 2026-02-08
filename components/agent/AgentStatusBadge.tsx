"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgentStatus {
  name: string;
  isActive: boolean;
}

export function AgentStatusBadge() {
  const [status, setStatus] = useState<AgentStatus | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/agent/identity");
        if (!res.ok) return;
        const data = await res.json();
        if (data.identity) {
          setStatus({
            name: data.identity.name,
            isActive: data.identity.isActive,
          });
        }
      } catch {
        // Silently fail - badge is non-critical
      }
    }

    fetchStatus();
  }, []);

  return (
    <Link
      href="/dashboard/agent"
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
        "hover:bg-slate-100 dark:hover:bg-slate-800",
        "text-slate-600 dark:text-slate-400"
      )}
    >
      <div className="relative">
        <Bot className="h-4 w-4" />
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white dark:border-slate-900",
            status?.isActive
              ? "bg-emerald-500"
              : "bg-slate-300 dark:bg-slate-600"
          )}
        />
      </div>
      <span className="hidden sm:inline">
        {status ? status.name : "Agent"}
      </span>
    </Link>
  );
}
