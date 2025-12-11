import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      card: "p-6",
      iconContainer: "w-10 h-10 mb-3",
      icon: "h-5 w-5",
      title: "text-base font-medium mb-1",
      description: "text-sm mb-4",
    },
    md: {
      card: "p-12",
      iconContainer: "w-12 h-12 mb-4",
      icon: "h-6 w-6",
      title: "text-lg font-semibold mb-2",
      description: "text-sm mb-6",
    },
    lg: {
      card: "p-16",
      iconContainer: "w-16 h-16 mb-6",
      icon: "h-8 w-8",
      title: "text-xl font-semibold mb-3",
      description: "text-base mb-8",
    },
  };

  const styles = sizeClasses[size];

  return (
    <Card
      className={cn(
        styles.card,
        "text-center border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
        className
      )}
      role="status"
      aria-label={title}
    >
      <div
        className={cn(
          "mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center",
          styles.iconContainer
        )}
        aria-hidden="true"
      >
        <Icon className={cn("text-slate-600 dark:text-slate-400", styles.icon)} />
      </div>
      <h3 className={cn("text-slate-900 dark:text-slate-100", styles.title)}>
        {title}
      </h3>
      <p className={cn("text-slate-600 dark:text-slate-400 max-w-md mx-auto", styles.description)}>
        {description}
      </p>
      {action && (
        <div className="flex items-center justify-center gap-3">
          {action.href ? (
            <Button asChild>
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Search Empty State - Specialized for search results
 */
interface SearchEmptyStateProps {
  query: string;
  onClear?: () => void;
}

export function SearchEmptyState({ query, onClear }: SearchEmptyStateProps) {
  return (
    <div className="text-center py-12" role="status" aria-live="polite">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <svg
          className="h-6 w-6 text-slate-600 dark:text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        No results found
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">
        We couldn&apos;t find anything matching &quot;{query}&quot;. Try adjusting your search or filters.
      </p>
      {onClear && (
        <Button variant="outline" onClick={onClear}>
          Clear search
        </Button>
      )}
    </div>
  );
}

/**
 * Error Empty State - For error scenarios
 */
interface ErrorEmptyStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorEmptyState({
  title = "Something went wrong",
  message = "We encountered an error. Please try again.",
  onRetry,
}: ErrorEmptyStateProps) {
  return (
    <div className="text-center py-12" role="alert">
      <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <svg
          className="h-6 w-6 text-red-600 dark:text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">
        {message}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Loading Empty State - For loading scenarios with helpful text
 */
interface LoadingEmptyStateProps {
  message?: string;
}

export function LoadingEmptyState({
  message = "Loading...",
}: LoadingEmptyStateProps) {
  return (
    <div className="text-center py-12" role="status" aria-live="polite">
      <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 dark:border-slate-700 border-t-slate-900 dark:border-t-slate-100" />
      </div>
      <p className="text-slate-600 dark:text-slate-400">
        {message}
      </p>
    </div>
  );
}
