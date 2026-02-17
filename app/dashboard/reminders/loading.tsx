import { PageHeaderSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function RemindersLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={6} />
    </div>
  );
}
