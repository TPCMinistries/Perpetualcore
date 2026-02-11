"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Voice Intel Error]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[40vh] p-4">
      <div className="max-w-sm w-full text-center">
        <div className="h-12 w-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Failed to load Voice Intelligence</h2>
        <p className="text-sm text-gray-600 mb-4">
          Something went wrong. Try refreshing this section.
        </p>
        <Button onClick={reset} size="sm" className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    </div>
  );
}
