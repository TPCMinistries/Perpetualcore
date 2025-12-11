"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <div className="max-w-md w-full mx-auto p-8 text-center">
            <div className="mb-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Something went wrong
            </h1>

            <p className="text-slate-600 dark:text-slate-400 mb-6">
              We apologize for the inconvenience. Our team has been notified and is
              working on a fix.
            </p>

            {error.digest && (
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-4 font-mono">
                Error ID: {error.digest}
              </p>
            )}

            <div className="space-y-3">
              <button
                onClick={() => reset()}
                className="w-full px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
              >
                Try again
              </button>

              <a
                href="/"
                className="block w-full px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Go to homepage
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
