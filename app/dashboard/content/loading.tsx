import { PageHeaderSkeleton, StatsGridSkeleton, CardGridSkeleton } from "@/components/ui/skeletons";

export default function ContentLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={5} />
      <CardGridSkeleton count={6} columns={3} />
    </div>
  );
}
