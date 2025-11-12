"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Settings as SettingsIcon } from "lucide-react";
import { toast } from "sonner";

const AGENT_TYPES = [
  { value: "email_monitor", label: "Email Monitor" },
  { value: "calendar_monitor", label: "Calendar Monitor" },
  { value: "document_analyzer", label: "Document Analyzer" },
  { value: "task_manager", label: "Task Manager" },
  { value: "meeting_assistant", label: "Meeting Assistant" },
  { value: "email_organizer", label: "Email Organizer" },
  { value: "research_assistant", label: "Research Assistant" },
  { value: "workflow_optimizer", label: "Workflow Optimizer" },
  { value: "daily_digest", label: "Daily Digest" },
  { value: "sentiment_monitor", label: "Sentiment Monitor" },
];

const PERSONALITIES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

interface Agent {
  id: string;
  name: string;
  description: string | null;
  agent_type: string;
  personality: string;
  instructions: string | null;
  enabled: boolean;
}

export default function AgentSettingsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agent_type: "",
    personality: "professional",
    instructions: "",
    enabled: true,
  });

  useEffect(() => {
    fetchAgent();
  }, [params.id]);

  async function fetchAgent() {
    try {
      const response = await fetch(`/api/agents/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAgent(data.agent);
        setFormData({
          name: data.agent.name,
          description: data.agent.description || "",
          agent_type: data.agent.agent_type,
          personality: data.agent.personality,
          instructions: data.agent.instructions || "",
          enabled: data.agent.enabled,
        });
      } else {
        toast.error("Failed to load agent");
        router.push("/dashboard/agents");
      }
    } catch (error) {
      console.error("Error fetching agent:", error);
      toast.error("Failed to load agent");
      router.push("/dashboard/agents");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.agent_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/agents/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Agent updated successfully!");
        router.push(`/dashboard/agents/${params.id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update agent");
      }
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Failed to update agent");
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/agents/${params.id}`)}
          className="text-slate-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agent
        </Button>
      </div>

      <div className="max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <SettingsIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Agent Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Configure your AI agent's behavior and capabilities
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">
              Agent Configuration
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Update the settings and behavior of your AI agent
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

            {/* Enabled Toggle */}
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="enabled" className="text-base text-slate-900 dark:text-slate-100">
                  Active Status
                </Label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enable or disable this agent's automated monitoring
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleChange("enabled", checked)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/agents/${params.id}`)}
                disabled={saving}
                className="border-slate-300 dark:border-slate-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
