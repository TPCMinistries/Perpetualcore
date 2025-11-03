"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function MyLearningPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnrollments();
  }, []);

  async function loadEnrollments() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Will load enrollments after migration

    } catch (error) {
      console.error("Error loading enrollments:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-500/5">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-blue-600" />
              My Learning
            </h1>
            <p className="text-muted-foreground mt-2">
              Track your progress and continue your training journey
            </p>
          </div>
          <Link href="/dashboard/training">
            <Button variant="outline" className="backdrop-blur-xl bg-background/50 border-border">
              Browse All Courses
            </Button>
          </Link>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enrolled</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">0</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">0</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">0</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Certificates</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">0</h3>
              </div>
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Getting Started */}
        <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-8">
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Start Your Learning Journey
              </h2>
              <p className="text-muted-foreground">
                You haven't enrolled in any training modules yet. Explore available courses and
                begin building your skills.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-lg border border-border bg-background/50">
                <Play className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Learn at Your Pace</h3>
                <p className="text-sm text-muted-foreground">
                  Access training materials anytime, anywhere
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background/50">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor completion and see your growth
                </p>
              </div>

              <div className="p-4 rounded-lg border border-border bg-background/50">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Earn Certificates</h3>
                <p className="text-sm text-muted-foreground">
                  Get recognized for completing courses
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/dashboard/training">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Training Modules
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Setup Info */}
        <Card className="backdrop-blur-2xl bg-card/80 border-border shadow-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Ready to Use
          </h3>
          <p className="text-muted-foreground mb-3">
            The Training Hub foundation is complete! Run the migration to enable all features:
          </p>
          <pre className="bg-background/50 border border-border rounded-lg p-4 text-sm">
            <code>npx supabase db push</code>
          </pre>
        </Card>
      </div>
    </div>
  );
}
