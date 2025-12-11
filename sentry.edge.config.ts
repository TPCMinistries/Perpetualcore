import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring - lower sample rate for edge
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  // Only enable in production when DSN is configured
  enabled: process.env.NODE_ENV === "production" && !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tag
  environment: process.env.NODE_ENV,

  // Release version
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version,

  // Before sending, add extra context
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry Edge] Would send event:", event.message || event.exception);
      return null;
    }

    // Add custom tags
    event.tags = {
      ...event.tags,
      runtime: "edge",
      app_version: process.env.npm_package_version,
    };

    return event;
  },
});
