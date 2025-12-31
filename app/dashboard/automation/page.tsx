import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AutomationHub } from "@/components/automation/AutomationHub";
import { Skeleton } from "@/components/ui/skeleton";
import { Workflow } from "lucide-react";

export const metadata = {
  title: "Automation Hub | Perpetual Core",
  description: "All your automations in one place - bots, workflows, n8n, and scheduled jobs",
};

function AutomationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default async function AutomationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Workflow className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              Automation Hub
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              All your automations in one place - bots, workflows, n8n, and scheduled jobs
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<AutomationSkeleton />}>
        <AutomationHub userId={user.id} />
      </Suspense>
    </div>
  );
}
