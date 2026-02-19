"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] p-8">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Dashboard Error</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Something went wrong loading the admin dashboard. This may be a permissions issue.
        </p>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
