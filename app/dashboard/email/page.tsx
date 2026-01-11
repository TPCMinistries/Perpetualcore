"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Email page redirects to unified inbox with outbox tab
 * All email functionality is now consolidated in /dashboard/inbox
 */
export default function EmailPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to inbox - the outbox tab is now integrated there
    router.replace("/dashboard/inbox");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-muted-foreground">Redirecting to inbox...</div>
    </div>
  );
}
