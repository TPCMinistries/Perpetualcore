"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Clock, ArrowLeft, CheckCircle, Star } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface JobTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  default_cron: string;
  job_type: string;
  is_popular: boolean;
  usage_count: number;
}

export default function JobTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<JobTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<JobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "productivity", label: "Productivity" },
    { id: "analytics", label: "Analytics" },
    { id: "communication", label: "Communication" },
    { id: "maintenance", label: "Maintenance" },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter((t) => t.category === selectedCategory));
    }
  }, [selectedCategory, templates]);

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/scheduled-jobs/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        setFilteredTemplates(data.templates || []);
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
      const response = await fetch("/api/scheduled-jobs/install-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        toast.success(`Created "${templateName}" job!`);
        router.push("/dashboard/scheduled-jobs");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create job");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setInstallingId(null);
    }
  }

  function formatCron(cron: string): string {
    const patterns: { [key: string]: string } = {
      "0 * * * *": "Every hour",
      "*/15 * * * *": "Every 15 minutes",
      "*/30 * * * *": "Every 30 minutes",
      "0 0 * * *": "Daily at midnight",
      "0 8 * * *": "Daily at 8am",
      "0 9 * * *": "Daily at 9am",
      "0 9 * * 1-5": "Weekdays at 9am",
      "0 17 * * 1-5": "Weekdays at 5pm",
      "0 7 * * 1-5": "Weekdays at 7am",
      "0 16 * * 1-5": "Weekdays at 4pm",
      "0 9 * * 1": "Monday at 9am",
      "0 9 * * 0": "Sunday at 10am",
      "0 10 * * 0": "Sunday at 10am",
      "0 9 1 * *": "Monthly on 1st at 9am",
      "0 2 * * 0": "Sunday at 2am",
      "0 3 * * *": "Daily at 3am",
      "0 10 * * 5": "Friday at 10am",
    };

    return patterns[cron] || cron;
  }

  function getCategoryBadge(category: string) {
    const colors: { [key: string]: string } = {
      productivity: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      analytics: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      communication: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };

    return (
      <Badge variant="outline" className={colors[category] || ""}>
        {category}
      </Badge>
    );
  }

  function getJobTypeBadge(type: string) {
    return (
      <Badge variant="secondary" className="text-xs">
        {type}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/dashboard/scheduled-jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Job Templates</h1>
          <p className="text-muted-foreground">
            Pre-configured scheduled tasks ready to use
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.label}
            {category.id !== "all" && (
              <Badge variant="secondary" className="ml-2">
                {templates.filter((t) => t.category === category.id).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No templates found"
          description="Try selecting a different category"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="relative hover:shadow-lg transition-shadow"
            >
              {template.is_popular && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-2 shadow-lg">
                  <Star className="h-4 w-4" fill="currentColor" />
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-4xl">{template.icon}</div>
                  <div className="flex flex-col gap-1 items-end">
                    {getCategoryBadge(template.category)}
                    {getJobTypeBadge(template.job_type)}
                  </div>
                </div>
                <CardTitle className="text-xl">{template.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground min-h-[60px]">
                  {template.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span className="font-medium">
                      {formatCron(template.default_cron)}
                    </span>
                  </div>

                  {template.usage_count > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Installs:</span>
                      <span className="font-medium">{template.usage_count}</span>
                    </div>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => installTemplate(template.id, template.name)}
                  disabled={installingId === template.id}
                >
                  {installingId === template.id ? (
                    <>Installing...</>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Install Template
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
