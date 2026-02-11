import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EcosystemDashboard } from "@/components/ecosystem/EcosystemDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Ecosystem | Perpetual Core",
  description: "Monitor all 13 projects across the Lorenzo ecosystem",
};

function EcosystemSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function EcosystemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<EcosystemSkeleton />}>
        <EcosystemDashboard />
      </Suspense>
    </div>
  );
}
