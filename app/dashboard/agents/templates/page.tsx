"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Download,
  FileText,
  Calendar,
  Mail,
  BarChart3,
  Brain,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  icon: string;
  category: string;
  capabilities: string[];
  usage_count: number;
}

const CATEGORY_ICONS: { [key: string]: any } = {
  Documents: FileText,
  Productivity: Zap,
  Calendar: Calendar,
  Communication: Mail,
  Knowledge: Brain,
  Analytics: BarChart3,
};

export default function AgentTemplatesPage() {
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const response = await fetch("/api/agents/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function installTemplate(templateId: string) {
    setInstallingId(templateId);
    try {
      const response = await fetch("/api/agents/install-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        toast.success("Agent created from template!");
        router.push("/dashboard/agents");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to create agent");
      }
    } catch (error) {
      toast.error("Failed to create agent");
    } finally {
      setInstallingId(null);
    }
  }

  const categories = Array.from(new Set(templates.map((t) => t.category)));
  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.category === selectedCategory)
    : templates;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Templates</h1>
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/agents">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Agent Templates</h1>
        <p className="text-muted-foreground">
          Start with a pre-configured AI agent
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          All Templates
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => {
          const CategoryIcon = CATEGORY_ICONS[template.category] || FileText;

          return (
            <Card
              key={template.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-2xl">
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1 truncate">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CategoryIcon className="h-3 w-3" />
                    {template.category}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {template.description}
              </p>

              {/* Capabilities */}
              {template.capabilities && template.capabilities.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2">Capabilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.capabilities.slice(0, 3).map((capability, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-muted rounded-full"
                      >
                        {capability.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span>{template.usage_count} installs</span>
              </div>

              <Button
                className="w-full"
                onClick={() => installTemplate(template.id)}
                disabled={installingId === template.id}
              >
                <Download className="h-4 w-4 mr-2" />
                {installingId === template.id
                  ? "Installing..."
                  : "Create Agent"}
              </Button>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No templates found in this category
          </p>
        </Card>
      )}
    </div>
  );
}
