"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  Plus,
  BookOpen,
  Clock,
  Users,
  Award,
  TrendingUp,
  Play,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TrainingStats {
  totalModules: number;
  publishedModules: number;
  totalEnrollments: number;
  completedEnrollments: number;
}

export default function TrainingHubPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TrainingStats>({
    totalModules: 0,
    publishedModules: 0,
    totalEnrollments: 0,
    completedEnrollments: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.organization_id) return;

      // Get basic stats (tables will be created after migration)
      setStats({
        totalModules: 0,
        publishedModules: 0,
        totalEnrollments: 0,
        completedEnrollments: 0,
      });

    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-500/5">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-green-950/20 border border-emerald-100 dark:border-emerald-900/20 p-8 shadow-lg">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-900 via-teal-800 to-green-900 dark:from-emerald-100 dark:via-teal-100 dark:to-green-100 bg-clip-text text-transparent">
                  Training Hub
                </h1>
                <p className="text-emerald-700 dark:text-emerald-300 mt-1">
                  Create, manage, and track organizational training programs
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/training/my-learning">
                <Button variant="outline" className="backdrop-blur-xl bg-background/50 border-border shadow-md">
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Learning
                </Button>
              </Link>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Create Module
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Modules</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stats.totalModules}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stats.publishedModules}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalModules > 0
                    ? `${Math.round((stats.publishedModules / stats.totalModules) * 100)}% live`
                    : "0% live"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stats.totalEnrollments}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stats.completedEnrollments}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalEnrollments > 0
                    ? `${Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100)}% completion`
                    : "0% completion"}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Getting Started */}
        <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-8">
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Transform Your Organization with AI-Powered Training
              </h2>
              <p className="text-muted-foreground">
                Create engaging training modules, track employee progress, and certify completion.
                Connect your knowledge base to train specialized AI assistants.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg border border-border bg-background/50">
                <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Create Modules</h3>
                <p className="text-sm text-muted-foreground">
                  Build comprehensive training programs from your documents
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background/50">
                <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor completion rates and learner engagement
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background/50">
                <Award className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Certify Skills</h3>
                <p className="text-sm text-muted-foreground">
                  Issue certificates and validate knowledge
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Module
              </Button>
              <Button variant="outline" className="backdrop-blur-xl bg-background/50 border-border">
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </div>
        </Card>

        {/* Integration Info */}
        <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Setup Required
          </h3>
          <div className="space-y-3">
            <p className="text-muted-foreground">
              The Training Hub is ready to use! To get started, run the database migration:
            </p>
            <pre className="bg-background/50 border border-border rounded-lg p-4 text-sm">
              <code>npx supabase db push</code>
            </pre>
            <p className="text-sm text-muted-foreground">
              This will create all necessary tables for training modules, lessons, enrollments, and certificates.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
