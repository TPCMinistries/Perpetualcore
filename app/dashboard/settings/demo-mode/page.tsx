"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Trash2, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function DemoModePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    checkDemoModeStatus();
  }, []);

  async function checkDemoModeStatus() {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setIsDemoMode(data.demo_mode || false);
      }
    } catch (error) {
      console.error("Error checking demo mode status:", error);
    }
  }

  async function handlePopulateSampleData() {
    if (
      !confirm(
        "This will add sample documents, tasks, conversations, and calendar events to your account. Continue?"
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/demo/populate", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Demo data added! Created ${data.summary.documents} documents, ${data.summary.tasks} tasks, ${data.summary.conversations} conversations, and ${data.summary.events} events.`
        );
        setIsDemoMode(true);
      } else {
        toast.error(data.message || "Failed to populate demo data");
      }
    } catch (error) {
      toast.error("Failed to populate demo data");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleClearDemoData() {
    if (
      !confirm(
        "This will DELETE ALL your documents, tasks, conversations, and calendar events. This action cannot be undone. Are you sure?"
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/demo/clear", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Demo data cleared! Removed ${data.summary.documents} documents, ${data.summary.tasks} tasks, ${data.summary.conversations} conversations, and ${data.summary.events} events.`
        );
        setIsDemoMode(false);
      } else {
        toast.error(data.message || "Failed to clear demo data");
      }
    } catch (error) {
      toast.error("Failed to clear demo data");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Demo Mode</h1>
        <p className="text-muted-foreground">
          Populate your account with sample data to explore features
        </p>
      </div>

      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-1">Demo Data Status</h2>
            <p className="text-sm text-muted-foreground">
              {isDemoMode
                ? "Your account currently has demo data populated"
                : "Your account does not have demo data"}
            </p>
          </div>
          {isDemoMode && (
            <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
              Active
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {!isDemoMode ? (
          <div>
            <Button
              onClick={handlePopulateSampleData}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? "Populating..." : "Populate Sample Data"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              This will create sample documents, tasks, conversations, and
              calendar events
            </p>
          </div>
        ) : (
          <div>
            <Button
              onClick={handleClearDemoData}
              disabled={isLoading}
              variant="destructive"
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isLoading ? "Clearing..." : "Clear All Data"}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Warning: This will delete ALL your documents, tasks,
              conversations, and calendar events
            </p>
          </div>
        )}
      </Card>

      {/* What's Included Card */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">What's Included in Demo Data</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📄</span>
            </div>
            <div>
              <p className="font-medium text-sm">Documents</p>
              <p className="text-xs text-muted-foreground">
                3 sample documents including roadmaps and meeting notes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✅</span>
            </div>
            <div>
              <p className="font-medium text-sm">Tasks</p>
              <p className="text-xs text-muted-foreground">
                6 tasks with different statuses and priorities
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💬</span>
            </div>
            <div>
              <p className="font-medium text-sm">Conversations</p>
              <p className="text-xs text-muted-foreground">
                3 AI chat conversations with helpful responses
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📅</span>
            </div>
            <div>
              <p className="font-medium text-sm">Calendar Events</p>
              <p className="text-xs text-muted-foreground">
                4 upcoming meetings and events
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Warning Card */}
      {isDemoMode && (
        <Card className="p-6 border-orange-200 bg-orange-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">
                Important Note
              </h3>
              <p className="text-sm text-orange-800">
                Demo mode is currently active. Clearing demo data will remove
                ALL your documents, tasks, conversations, and events. Make sure
                to export any important data before clearing.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
