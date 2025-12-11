/**
 * Loading Fallback Components
 * Re-exports from skeletons.tsx for backwards compatibility
 * and adds some additional loading utilities
 */

import { Card, CardContent } from "@/components/ui/card";
import {
  Skeleton,
  PageLoadingSkeleton,
  TableSkeleton,
  ContentSpinner,
} from "./skeletons";

export function LoadingFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-1/3" />
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
            <div className="h-4 bg-muted rounded w-4/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PageLoadingFallback() {
  return <PageLoadingSkeleton />;
}

export function TableLoadingFallback() {
  return <TableSkeleton />;
}

export function ComponentLoadingFallback() {
  return <ContentSpinner />;
}

// Re-export core skeleton for convenience
export { Skeleton };
