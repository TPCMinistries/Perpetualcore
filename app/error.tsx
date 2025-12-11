"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="h-16 w-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Oops! Something went wrong
        </h1>

        <p className="text-slate-600 dark:text-slate-400 mb-6">
          We encountered an unexpected error. Don&apos;t worry, our team has been
          notified and is looking into it.
        </p>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
            <p className="text-sm font-mono text-red-800 dark:text-red-200 break-all">
              {error.message}
            </p>
          </div>
        )}

        {error.digest && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-slate-500 dark:text-slate-500">
          If this problem persists, please{" "}
          <a
            href="mailto:support@perpetualcore.com"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            contact support
          </a>
        </p>
      </div>
    </div>
  );
}
