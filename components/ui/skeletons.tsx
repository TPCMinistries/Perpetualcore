"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "./card";

/**
 * Base Skeleton Component
 * Used as the building block for all skeleton loaders
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Page Header Skeleton
 * Used for page title and description areas
 */
export function PageHeaderSkeleton({ showActions = true }: { showActions?: boolean }) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stats Card Skeleton
 * Used for dashboard statistics cards
 */
export function StatCardSkeleton() {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </Card>
  );
}

/**
 * Stats Grid Skeleton
 * Used for dashboard overview stats
 */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Card Skeleton
 * Generic card placeholder
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900", className)}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-8" />
      </div>
    </Card>
  );
}

/**
 * Card Grid Skeleton
 * Used for card-based list views
 */
export function CardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 }) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Table Row Skeleton
 * Used for table-based lists
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 px-4 border-b border-slate-200 dark:border-slate-800">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

/**
 * Table Skeleton
 * Used for data tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 py-3 px-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24 ml-auto" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Task Item Skeleton
 * Matches the task list item design
 */
export function TaskItemSkeleton() {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Task List Skeleton
 * For tasks page
 */
export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TaskItemSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Agent Card Skeleton
 * Matches the agent card design
 */
export function AgentCardSkeleton() {
  return (
    <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <Skeleton className="h-14 w-14 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

/**
 * Workflow Card Skeleton
 * Matches the workflow card design
 */
export function WorkflowCardSkeleton() {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-10 w-10" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <Skeleton className="h-3 w-32" />
        <div className="flex gap-2 mt-auto pt-4">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Chat Message Skeleton
 * Matches chat message design
 */
export function ChatMessageSkeleton({ isAI = false }: { isAI?: boolean }) {
  return (
    <div className={cn("flex gap-3 mb-4", !isAI && "flex-row-reverse")}>
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className={cn("flex-1 space-y-2 max-w-[80%]", !isAI && "items-end")}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className={cn("h-20 rounded-lg", isAI ? "w-full" : "w-48")} />
      </div>
    </div>
  );
}

/**
 * Chat Skeleton
 * For chat interface
 */
export function ChatSkeleton({ messages = 4 }: { messages?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: messages }).map((_, i) => (
        <ChatMessageSkeleton key={i} isAI={i % 2 === 1} />
      ))}
    </div>
  );
}

/**
 * Document Card Skeleton
 * For document/library pages
 */
export function DocumentCardSkeleton() {
  return (
    <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Document Grid Skeleton
 * For library/documents pages
 */
export function DocumentGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Search Results Skeleton
 * For search result pages
 */
export function SearchResultSkeleton() {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-200 dark:border-slate-800">
      <Skeleton className="h-5 w-5 flex-shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Search Results List Skeleton
 */
export function SearchResultsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SearchResultSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Settings Section Skeleton
 * For settings pages
 */
export function SettingsSectionSkeleton() {
  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Form Skeleton
 * Generic form placeholder
 */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  );
}

/**
 * Dashboard Skeleton
 * Full dashboard page placeholder
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-64 w-full" />
        </Card>
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/**
 * Page Loading Skeleton
 * Generic full page skeleton
 */
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </div>
  );
}

/**
 * Tasks Page Skeleton
 */
export function TasksPageSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <PageHeaderSkeleton />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
      <TaskListSkeleton />
    </div>
  );
}

/**
 * Agents Page Skeleton
 */
export function AgentsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton />
      <Card className="p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-40" />
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <AgentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Workflows Page Skeleton
 */
export function WorkflowsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 flex-shrink-0" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <WorkflowCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Library Page Skeleton
 */
export function LibraryPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      <DocumentGridSkeleton />
    </div>
  );
}

/**
 * Chat Page Skeleton
 */
export function ChatPageSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        <ChatSkeleton />
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Marketplace Card Skeleton
 */
export function MarketplaceCardSkeleton() {
  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <Skeleton className="h-40 w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Marketplace Page Skeleton
 */
export function MarketplacePageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <MarketplaceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Inline Loading Spinner
 * For small loading indicators within content
 */
export function InlineSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-100" />
    </div>
  );
}

/**
 * Content Loading Spinner
 * Larger centered spinner for content areas
 */
export function ContentSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-100 mb-3" />
      {text && <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>}
    </div>
  );
}
