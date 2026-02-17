import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/ui/skeletons";

export default function DataExplorerLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showActions={false} />
      <CardGridSkeleton count={6} columns={3} />
    </div>
  );
}
