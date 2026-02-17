import { PageHeaderSkeleton, StatsGridSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function ExpensesLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={3} />
      <TableSkeleton rows={6} />
    </div>
  );
}
