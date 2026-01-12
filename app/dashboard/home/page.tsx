import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Home | Perpetual Core",
  description: "Your daily briefing - priorities, insights, and what needs attention",
};

function BriefingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user profile for personalization
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferences")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Dashboard Content - automatically switches between Simple and Full modes */}
      <Suspense fallback={<BriefingSkeleton />}>
        <DashboardContent userId={user.id} userName={firstName} />
      </Suspense>
    </div>
  );
}
