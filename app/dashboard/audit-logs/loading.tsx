import { PageHeaderSkeleton, StatsGridSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function AuditLogsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={4} />
      <TableSkeleton rows={8} />
    </div>
  );
}
