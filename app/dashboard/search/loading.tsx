import { PageHeaderSkeleton, Skeleton } from "@/components/ui/skeletons";

export default function SearchLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton showActions={false} />
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
