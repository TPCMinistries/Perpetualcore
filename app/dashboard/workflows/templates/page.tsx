"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Workflow, ArrowLeft, Star, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  use_cases: string[];
  is_popular: boolean;
  usage_count: number;
}

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/workflows/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  async function installTemplate(templateId: string, templateName: string) {
    setInstallingId(templateId);
    try {
      const response = await fetch("/api/workflows/install-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Created "${templateName}" workflow!`);
        router.push(`/dashboard/workflows/${data.workflow.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create workflow");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setInstallingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 border border-purple-100 dark:border-purple-900/20 p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/dashboard/workflows">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workflows
            </Link>
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-900 via-pink-800 to-orange-900 dark:from-purple-100 dark:via-pink-100 dark:to-orange-100 bg-clip-text text-transparent">
                Workflow Templates
              </div>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                Pre-built workflow automation ready to use
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No templates available"
          description="Check back later for workflow templates"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="relative hover:shadow-xl transition-all duration-200 hover:scale-[1.02] flex flex-col border-2 hover:border-primary/50"
            >
              {template.is_popular && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full p-2 shadow-lg z-10">
                  <Star className="h-4 w-4" fill="currentColor" />
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-5xl">{template.icon}</div>
                  {template.category && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {template.category}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                {/* Use Cases */}
                {template.use_cases && template.use_cases.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Use Cases:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.use_cases.slice(0, 3).map((useCase, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {useCase}
                        </Badge>
                      ))}
                      {template.use_cases.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.use_cases.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Usage Count */}
                {template.usage_count > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Used by {template.usage_count} {template.usage_count === 1 ? "user" : "users"}
                  </div>
                )}

                {/* Install Button */}
                <Button
                  className="w-full mt-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => installTemplate(template.id, template.name)}
                  disabled={installingId === template.id}
                >
                  {installingId === template.id ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Use Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
