"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, GraduationCap, FileText } from "lucide-react";
import { CreateDocumentModal } from "@/components/documents/CreateDocumentModal";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const [createDocModalOpen, setCreateDocModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Primary CTA - Start Conversation */}
        <Link href="/dashboard/chat" className="w-full group active:scale-[0.98] transition-transform">
          <div className="relative h-20 md:h-16 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg hover:shadow-xl overflow-hidden touch-manipulation">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-blue-500/10 to-blue-700/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-full flex flex-col items-center justify-center gap-1 px-4">
              <div className="flex items-center gap-2.5 text-base md:text-base font-semibold">
                <Sparkles className="h-5 w-5 md:h-5 md:w-5" />
                Start Conversation
              </div>
              <p className="text-xs opacity-90 text-center hidden sm:block">Auto-routes to best model for your task</p>
              <p className="text-xs opacity-90 text-center sm:hidden">AI auto-routing</p>
            </div>
          </div>
        </Link>

        {/* Secondary CTA - Execute Task */}
        <Link href="/dashboard/tasks" className="w-full group active:scale-[0.98] transition-transform">
          <div className="relative h-20 md:h-16 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-lg hover:shadow-xl overflow-hidden touch-manipulation">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/10 via-emerald-500/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-full flex flex-col items-center justify-center gap-1 px-4">
              <div className="flex items-center gap-2.5 text-base md:text-base font-semibold">
                <GraduationCap className="h-5 w-5 md:h-5 md:w-5" />
                Execute Task
              </div>
              <p className="text-xs opacity-90 text-center hidden sm:block">Agent-powered workflow execution</p>
              <p className="text-xs opacity-90 text-center sm:hidden">AI agent workflows</p>
            </div>
          </div>
        </Link>

        {/* Tertiary CTA - Generate Content */}
        <button
          onClick={() => setCreateDocModalOpen(true)}
          className="w-full group active:scale-[0.98] transition-transform"
        >
          <div className="h-20 md:h-16 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center gap-1 px-4 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 touch-manipulation">
            <div className="flex items-center gap-2.5 text-base md:text-base font-semibold">
              <FileText className="h-5 w-5 md:h-5 md:w-5" />
              Generate Content
            </div>
            <p className="text-xs opacity-80 text-center hidden sm:block">Create documents, presentations & more</p>
            <p className="text-xs opacity-80 text-center sm:hidden">Docs & presentations</p>
          </div>
        </button>
      </div>

      <CreateDocumentModal
        open={createDocModalOpen}
        onOpenChange={setCreateDocModalOpen}
        onSuccess={() => {
          setCreateDocModalOpen(false);
          router.push("/dashboard/documents");
        }}
      />
    </>
  );
}
