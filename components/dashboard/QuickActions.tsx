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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/dashboard/chat" className="w-full group">
          <div className="relative h-14 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm hover:shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-full flex items-center justify-center gap-2 text-base font-medium">
              <Sparkles className="h-5 w-5" />
              Ask AI Anything
            </div>
          </div>
        </Link>
        <Link href="/dashboard/training/learning-paths" className="w-full group">
          <div className="relative h-14 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-sm hover:shadow-md overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-emerald-600/10 to-teal-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-full flex items-center justify-center gap-2 text-base font-medium">
              <GraduationCap className="h-5 w-5" />
              Coach Me
            </div>
          </div>
        </Link>
        <button
          onClick={() => setCreateDocModalOpen(true)}
          className="w-full group"
        >
          <div className="h-14 rounded-lg border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 transition-all flex items-center justify-center gap-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
            <FileText className="h-5 w-5" />
            Create Document
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
