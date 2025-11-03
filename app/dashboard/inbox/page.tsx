"use client";

import { UnifiedInbox } from "@/components/inbox/UnifiedInbox";
import { Inbox } from "lucide-react";

export default function InboxPage() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
            <Inbox className="h-6 w-6 text-white dark:text-slate-900" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Unified Inbox
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              All your messages and notifications in one place
            </p>
          </div>
        </div>
      </div>

      <UnifiedInbox />
    </div>
  );
}
