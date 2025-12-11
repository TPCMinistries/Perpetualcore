import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay (capture 10% of sessions, 100% of sessions with errors)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Only enable in production when DSN is configured
  enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tag
  environment: process.env.NODE_ENV,

  // Release version (use VERCEL_GIT_COMMIT_SHA or package version)
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

  // Integration settings
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: false,
      // Block all media (images, videos) from being captured
      blockAllMedia: false,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /Extensions/i,
    /^chrome:\/\//i,
    // Network errors
    /Network request failed/i,
    /Failed to fetch/i,
    /Load failed/i,
    // User-cancelled actions
    /AbortError/i,
    /cancelled/i,
    // Third-party scripts
    /Script error/i,
    // Benign browser issues
    /ResizeObserver loop limit exceeded/i,
    /ResizeObserver loop completed with undelivered notifications/i,
  ],

  // Don't send errors from these URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    // Firefox extensions
    /^moz-extension:\/\//i,
    // Safari extensions
    /^safari-extension:\/\//i,
  ],

  // Before sending, add extra context
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry] Would send event:", event.message || event.exception);
      return null;
    }

    // Add custom tags
    event.tags = {
      ...event.tags,
      app_version: process.env.npm_package_version,
    };

    return event;
  },
});
