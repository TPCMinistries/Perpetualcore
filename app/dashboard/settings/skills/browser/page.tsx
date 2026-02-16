"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BrowserSettingsPage() {
  const [quota, setQuota] = useState<{
    used: number;
    limit: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearingCookies, setClearingCookies] = useState(false);

  useEffect(() => {
    loadQuota();
  }, []);

  async function loadQuota() {
    try {
      const res = await fetch("/api/skills/browser/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {
      // Non-critical — show defaults
      setQuota({ used: 0, limit: 50 });
    } finally {
      setLoading(false);
    }
  }

  async function handleClearCookies() {
    setClearingCookies(true);
    try {
      const res = await fetch("/api/skills/browser/cookies", {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("All browser cookies cleared");
      } else {
        toast.error("Failed to clear cookies");
      }
    } catch {
      toast.error("Failed to clear cookies");
    } finally {
      setClearingCookies(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const usedPercent = quota ? Math.round((quota.used / quota.limit) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Browser Automation
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage browser automation settings, quota, and stored cookies.
        </p>
      </div>

      {/* Daily Quota */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Usage</CardTitle>
          <CardDescription>
            Browser automation sessions used today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {quota?.used ?? 0} / {quota?.limit ?? 50} sessions
              </span>
              <Badge variant={usedPercent > 80 ? "destructive" : "secondary"}>
                {usedPercent}%
              </Badge>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(usedPercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Quota resets daily at midnight UTC.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Management */}
      <Card>
        <CardHeader>
          <CardTitle>Cookie Management</CardTitle>
          <CardDescription>
            Stored browser cookies for maintaining login sessions across automation runs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearCookies}
            disabled={clearingCookies}
          >
            {clearingCookies ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Clear All Cookies
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            This will log you out of all sites where browser automation has saved session cookies.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
