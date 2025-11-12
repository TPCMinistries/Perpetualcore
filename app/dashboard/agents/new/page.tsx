"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const AGENT_TYPES = [
  {
    value: "email_monitor",
    label: "Email Monitor",
    description: "Automatically monitors emails and creates actionable tasks",
  },
  {
    value: "calendar_monitor",
    label: "Calendar Monitor",
    description: "Tracks calendar events and sends reminders",
  },
  {
    value: "document_analyzer",
    label: "Document Analyzer",
    description: "Analyzes documents and extracts key information",
  },
  {
    value: "task_manager",
    label: "Task Manager",
    description: "Automatically organizes and prioritizes tasks",
  },
  {
    value: "meeting_assistant",
    label: "Meeting Assistant",
    description: "Prepares meeting agendas and follows up on action items",
  },
  {
    value: "email_organizer",
    label: "Email Organizer",
    description: "Categorizes and organizes emails automatically",
  },
  {
    value: "research_assistant",
    label: "Research Assistant",
    description: "Conducts research and compiles findings",
  },
  {
    value: "workflow_optimizer",
    label: "Workflow Optimizer",
    description: "Analyzes workflows and suggests improvements",
  },
  {
    value: "daily_digest",
    label: "Daily Digest",
    description: "Sends daily summary of important updates",
  },
  {
    value: "sentiment_monitor",
    label: "Sentiment Monitor",
    description: "Monitors sentiment in communications",
  },
];

const PERSONALITIES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agent_type: "",
    personality: "professional",
    instructions: "",
    config: {},
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.agent_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Agent "${formData.name}" created successfully!`);
        router.push("/dashboard/agents");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create agent");
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const selectedType = AGENT_TYPES.find((t) => t.value === formData.agent_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/agents")}
          className="text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>
      </div>

      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Create AI Agent
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Configure a new proactive AI agent to automate your workflows
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">
              Agent Configuration
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Define the behavior and capabilities of your AI agent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Agent Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-900 dark:text-slate-100">
                Agent Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., My Email Monitor"
                className="border-slate-300 dark:border-slate-700"
                required
              />
            </div>

            {/* Agent Type */}
            <div className="space-y-2">
              <Label htmlFor="agent_type" className="text-slate-900 dark:text-slate-100">
                Agent Type *
              </Label>
              <Select
                value={formData.agent_type}
                onValueChange={(value) => handleChange("agent_type", value)}
                required
              >
                <SelectTrigger className="border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedType.description}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-900 dark:text-slate-100">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe what this agent does..."
                className="border-slate-300 dark:border-slate-700 min-h-[100px]"
              />
            </div>

            {/* Personality */}
            <div className="space-y-2">
              <Label htmlFor="personality" className="text-slate-900 dark:text-slate-100">
                Personality
              </Label>
              <Select
                value={formData.personality}
                onValueChange={(value) => handleChange("personality", value)}
              >
                <SelectTrigger className="border-slate-300 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERSONALITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                The tone and style of communication for this agent
              </p>
            </div>

            {/* Custom Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-slate-900 dark:text-slate-100">
                Custom Instructions
              </Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleChange("instructions", e.target.value)}
                placeholder="Add any specific instructions or guidelines for this agent..."
                className="border-slate-300 dark:border-slate-700 min-h-[150px] font-mono text-sm"
              />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Optional: Provide custom instructions to customize the agent's behavior
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Agent
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/agents")}
                disabled={loading}
                className="border-slate-300 dark:border-slate-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Help Card */}
      <Card className="max-w-3xl border-slate-200 dark:border-slate-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
            How AI Agents Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            <strong>Proactive Monitoring:</strong> Your agent runs automatically in the
            background, monitoring its assigned domain (emails, calendar, documents, etc.)
          </p>
          <p>
            <strong>Intelligent Analysis:</strong> Uses AI to analyze content and determine
            what requires action or attention
          </p>
          <p>
            <strong>Task Creation:</strong> Automatically creates tasks for you when it
            identifies actionable items
          </p>
          <p>
            <strong>Always Learning:</strong> Agents improve over time based on your
            feedback and usage patterns
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
