"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

export default function AdminSeedPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    if (!confirm("This will DELETE all existing entities, projects, and tasks, then create fresh data. Continue?")) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/seed-lorenzo", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed data");
      }

      setResult(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin: Seed Data</h1>
        <p className="text-muted-foreground">
          Reset and seed your account with proper entities, projects, and tasks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Seed Lorenzo's Data
          </CardTitle>
          <CardDescription>
            This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Delete all existing entities, projects, and tasks</li>
              <li>Create 10 entities (Kenya Trip, Streams of Grace, TPC Ministries, etc.)</li>
              <li>Create ~25 projects with proper descriptions</li>
              <li>Create ~100 tasks with priorities</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSeed}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Reset & Seed Data
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="font-medium text-green-700 dark:text-green-400">Data seeded successfully!</div>
                <div className="mt-2 space-y-1 text-sm">
                  <div><strong>Deleted:</strong> {result.deleted.entities} entities, {result.deleted.projects} projects, {result.deleted.tasks} tasks</div>
                  <div><strong>Created:</strong> {result.created.entities} entities, {result.created.projects} projects, {result.created.tasks} tasks</div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="text-amber-600 mt-2">
                      <strong>Warnings:</strong>
                      <ul className="list-disc list-inside">
                        {result.errors.slice(0, 5).map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                        {result.errors.length > 5 && <li>...and {result.errors.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        After seeding, go to{" "}
        <a href="/dashboard/home" className="text-violet-600 hover:underline">
          Dashboard
        </a>{" "}
        to see your data.
      </div>
    </div>
  );
}
