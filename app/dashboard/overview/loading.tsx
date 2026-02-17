import { PageHeaderSkeleton, StatsGridSkeleton, CardGridSkeleton } from "@/components/ui/skeletons";

export default function OverviewLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={4} />
      <CardGridSkeleton count={4} columns={2} />
    </div>
  );
}
