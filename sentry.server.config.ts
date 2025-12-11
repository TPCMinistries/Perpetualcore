import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - lower sample rate for server
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Only enable in production when DSN is configured
  enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tag
  environment: process.env.NODE_ENV,

  // Release version
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

  // Server-specific integrations
  integrations: [],

  // Filter out noisy errors
  ignoreErrors: [
    // Common non-error situations
    /ECONNRESET/i,
    /ECONNREFUSED/i,
    /ETIMEDOUT/i,
    /socket hang up/i,
    // Intentional user actions
    /NEXT_NOT_FOUND/i,
    /NEXT_REDIRECT/i,
  ],

  // Before sending, add extra context
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry Server] Would send event:", event.message || event.exception);
      return null;
    }

    // Don't send health check failures
    if (event.request?.url?.includes("/api/health")) {
      return null;
    }

    // Add custom tags
    event.tags = {
      ...event.tags,
      runtime: "server",
      app_version: process.env.npm_package_version,
    };

    return event;
  },
});
