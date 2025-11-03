"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Bot, ArrowLeft, CheckCircle, Star, Sparkles, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RoleTemplate {
  id: string;
  name: string;
  description: string;
  role: string;
  avatar_emoji: string;
  category: string;
  default_tone: string;
  use_cases: string[];
  example_prompts: string[];
  is_popular: boolean;
  usage_count: number;
}

export default function BrowseTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<RoleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "business", label: "Business" },
    { id: "technical", label: "Technical" },
    { id: "creative", label: "Creative" },
    { id: "support", label: "Support" },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.role.toLowerCase().includes(query) ||
        t.use_cases?.some((uc) => uc.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  }, [selectedCategory, templates, searchQuery]);

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/assistants/templates");
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
      const response = await fetch("/api/assistants/install-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Created "${templateName}" assistant!`);
        router.push(`/dashboard/assistants/${data.assistant.id}/chat`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create assistant");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setInstallingId(null);
    }
  }

  function getCategoryBadge(category: string) {
    const colors: { [key: string]: string } = {
      business: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      technical: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      creative: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      support: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };

    return (
      <Badge variant="outline" className={colors[category] || ""}>
        {category}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-muted rounded"></div>
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
            <Link href="/dashboard/assistants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assistants
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-900 via-pink-800 to-orange-900 dark:from-purple-100 dark:via-pink-100 dark:to-orange-100 bg-clip-text text-transparent">
                  Assistant Templates
                </div>
                <p className="text-purple-700 dark:text-purple-300 text-sm">
                  Pre-configured AI assistants ready to use
                </p>
              </div>
            </div>
            {!loading && (
              <Badge variant="secondary" className="text-sm">
                {filteredTemplates.length} {filteredTemplates.length === 1 ? "template" : "templates"}
              </Badge>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-950"
            />
          </div>
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
          icon={Bot}
          title="No templates found"
          description={searchQuery ? "Try a different search term or category" : "Try selecting a different category"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
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
                  <div className="text-5xl">{template.avatar_emoji}</div>
                  <div className="flex flex-col gap-1 items-end">
                    {getCategoryBadge(template.category)}
                    <Badge variant="secondary" className="text-xs">
                      {template.default_tone}
                    </Badge>
                  </div>
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

                {/* Example Prompts */}
                {template.example_prompts && template.example_prompts.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Try asking:
                    </p>
                    <div className="space-y-1">
                      {template.example_prompts.slice(0, 2).map((prompt, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground italic">
                          "{prompt}"
                        </p>
                      ))}
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
                      <TrendingUp className="mr-2 h-4 w-4 animate-pulse" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Assistant
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
