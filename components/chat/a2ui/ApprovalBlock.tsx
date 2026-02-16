"use client";

import { useState } from "react";
import type { A2UIBlock } from "@/lib/a2ui/types";
import type { ApprovalBlockData } from "@/lib/a2ui/types";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApprovalBlockProps {
  block: A2UIBlock;
}

export default function ApprovalBlock({ block }: ApprovalBlockProps) {
  const data = block.data as ApprovalBlockData;
  const [state, setState] = useState<
    "idle" | "loading" | "approved" | "rejected"
  >("idle");

  const handleAction = async (action: "approve" | "reject") => {
    setState("loading");
    try {
      const res = await fetch("/api/a2ui/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callbackId: data.callbackId,
          action,
        }),
      });

      if (!res.ok) throw new Error("Callback failed");
      setState(action === "approve" ? "approved" : "rejected");
    } catch {
      setState("idle");
    }
  };

  if (state === "approved") {
    return (
      <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Approved
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {data.title}
          </p>
        </div>
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex items-center gap-3">
        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-red-700 dark:text-red-300">
            Rejected
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            {data.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {data.title}
      </h4>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
        {data.description}
      </p>

      {data.details && Object.keys(data.details).length > 0 && (
        <div className="mt-3 rounded-md bg-slate-50 dark:bg-slate-800/50 p-3 space-y-1.5">
          {Object.entries(data.details).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{key}</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button
          className={cn(
            "flex-1 h-9 text-sm",
            "bg-emerald-600 hover:bg-emerald-700 text-white"
          )}
          disabled={state === "loading"}
          onClick={() => handleAction("approve")}
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {data.approveLabel || "Approve"}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          className={cn(
            "flex-1 h-9 text-sm",
            "border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          )}
          disabled={state === "loading"}
          onClick={() => handleAction("reject")}
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-1.5" />
              {data.rejectLabel || "Reject"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
