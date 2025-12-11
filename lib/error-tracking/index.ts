/**
 * Error Tracking Service
 *
 * Centralized error handling integrated with Sentry.
 *
 * Environment variables:
 * - NEXT_PUBLIC_SENTRY_DSN: Sentry DSN for error reporting
 * - NODE_ENV: Environment (development/production)
 */

import * as Sentry from "@sentry/nextjs";

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  url?: string;
  action?: string;
  component?: string;
  extra?: Record<string, unknown>;
}

export interface LoggedError {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  severity: "error" | "warning" | "info";
}

// In-memory error store for development/debugging
const errorLog: LoggedError[] = [];
const MAX_STORED_ERRORS = 100;

/**
 * Initialize error tracking
 * Note: Sentry is initialized via sentry.client.config.ts
 * This function sets up additional global handlers
 */
export function initErrorTracking(): void {
  if (typeof window === "undefined") return;

  // Sentry handles global error handlers automatically when initialized
  // This is now a no-op but kept for backwards compatibility
}

/**
 * Capture and log an error
 */
export function captureError(
  error: Error | unknown,
  context: ErrorContext = {}
): void {
  const err = error instanceof Error ? error : new Error(String(error));

  const loggedError: LoggedError = {
    message: err.message,
    stack: err.stack,
    context: {
      url: typeof window !== "undefined" ? window.location.href : undefined,
      ...context,
    },
    timestamp: new Date().toISOString(),
    severity: "error",
  };

  // Store in memory for debugging
  errorLog.push(loggedError);
  if (errorLog.length > MAX_STORED_ERRORS) {
    errorLog.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error Tracked]", {
      message: loggedError.message,
      context: loggedError.context,
      stack: loggedError.stack,
    });
  }

  // Send to Sentry
  Sentry.captureException(err, {
    extra: {
      ...context.extra,
      action: context.action,
      component: context.component,
    },
    tags: {
      userId: context.userId,
      organizationId: context.organizationId,
    },
  });
}

/**
 * Capture a warning
 */
export function captureWarning(
  message: string,
  context: ErrorContext = {}
): void {
  const loggedError: LoggedError = {
    message,
    context: {
      url: typeof window !== "undefined" ? window.location.href : undefined,
      ...context,
    },
    timestamp: new Date().toISOString(),
    severity: "warning",
  };

  errorLog.push(loggedError);
  if (errorLog.length > MAX_STORED_ERRORS) {
    errorLog.shift();
  }

  if (process.env.NODE_ENV === "development") {
    console.warn("[Warning Tracked]", message, context);
  }

  // Send to Sentry as a message
  Sentry.captureMessage(message, {
    level: "warning",
    extra: {
      ...context.extra,
      action: context.action,
      component: context.component,
    },
    tags: {
      userId: context.userId,
      organizationId: context.organizationId,
    },
  });
}

/**
 * Capture info message for debugging
 */
export function captureInfo(
  message: string,
  context: ErrorContext = {}
): void {
  const loggedError: LoggedError = {
    message,
    context: {
      url: typeof window !== "undefined" ? window.location.href : undefined,
      ...context,
    },
    timestamp: new Date().toISOString(),
    severity: "info",
  };

  errorLog.push(loggedError);
  if (errorLog.length > MAX_STORED_ERRORS) {
    errorLog.shift();
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[Info Tracked]", message, context);
  }

  // Only send info to Sentry in specific cases (not spam)
  // Info is mainly for local debugging
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string): void {
  Sentry.setUser({
    id: userId,
    email: email,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * Get recent errors (for admin dashboard or debugging)
 */
export function getRecentErrors(): LoggedError[] {
  return [...errorLog].reverse();
}

/**
 * Create an error boundary wrapper for async operations
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    captureError(error, context);
    return null;
  }
}

/**
 * Wrap an API handler with error tracking
 */
export function apiErrorHandler(
  error: unknown,
  context: ErrorContext = {}
): { message: string; status: number } {
  captureError(error, context);

  const err = error instanceof Error ? error : new Error(String(error));

  return {
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An error occurred. Please try again.",
    status: 500,
  };
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string = "custom",
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

/**
 * Start a performance span
 */
export function startTransaction(
  name: string,
  op: string = "custom"
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

/**
 * Report a performance metric
 */
export function reportMetric(
  name: string,
  value: number,
  unit: "ms" | "bytes" | "count" = "ms"
): void {
  if (process.env.NODE_ENV === "development") {
    console.debug(`[Metric] ${name}: ${value}${unit}`);
  }

  // Add as a custom measurement if within a transaction
  Sentry.setMeasurement(name, value, unit === "ms" ? "millisecond" : unit === "bytes" ? "byte" : "none");
}

export default {
  init: initErrorTracking,
  captureError,
  captureWarning,
  captureInfo,
  setUserContext,
  clearUserContext,
  getRecentErrors,
  withErrorTracking,
  apiErrorHandler,
  addBreadcrumb,
  startTransaction,
  reportMetric,
};
