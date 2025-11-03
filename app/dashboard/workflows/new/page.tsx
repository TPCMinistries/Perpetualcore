"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewWorkflowPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "⚡",
    category: "automation",
    trigger_type: "manual",
  });

  const icons = ["⚡", "🔄", "🤖", "📝", "📊", "🎯", "🚀", "✨", "🔥", "💡"];
  const categories = [
    { value: "automation", label: "Automation" },
    { value: "content", label: "Content" },
    { value: "analysis", label: "Analysis" },
    { value: "support", label: "Support" },
  ];
  const triggerTypes = [
    { value: "manual", label: "Manual", description: "Run manually when needed" },
    { value: "schedule", label: "Scheduled", description: "Run on a schedule" },
    { value: "webhook", label: "Webhook", description: "Triggered by external event" },
    { value: "event", label: "Event", description: "Triggered by internal event" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    setSaving(true);
    try {
      // For now, create a basic workflow with empty nodes/edges
      // In a full implementation, this would come from a visual builder
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          nodes: [],
          edges: [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Workflow created!");
        router.push(`/dashboard/workflows/${data.workflow.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create workflow");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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
                Create New Workflow
              </div>
              <p className="text-purple-700 dark:text-purple-300 text-sm">
                Set up your workflow automation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Workflow Details</CardTitle>
            <CardDescription>
              Basic information about your workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Daily Content Creation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this workflow do?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex gap-2">
                {icons.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`text-3xl p-2 rounded-lg border-2 transition-all hover:scale-110 ${
                      formData.icon === icon
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-muted"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trigger Type */}
            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger Type</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger id="trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((trigger) => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      <div>
                        <div className="font-medium">{trigger.label}</div>
                        <div className="text-xs text-muted-foreground">{trigger.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Coming Soon: Visual Workflow Builder</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    For now, workflows are created with basic settings. A drag-and-drop visual builder with AI assistants, conditions, and transformations is coming in the next update!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button type="submit" disabled={saving} className="flex-1">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Creating..." : "Create Workflow"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/workflows")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
