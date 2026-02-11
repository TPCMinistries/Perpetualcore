import { PageHeaderSkeleton, SettingsSectionSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <PageHeaderSkeleton showActions={false} />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SettingsSectionSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
