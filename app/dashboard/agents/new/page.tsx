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
import { ArrowLeft, Loader2, Sparkles, Clock, Settings2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

const AGENT_TYPES = [
  {
    value: "email_monitor",
    label: "Email Monitor",
    description: "Automatically monitors emails and creates actionable tasks",
    implemented: true,
  },
  {
    value: "calendar_monitor",
    label: "Calendar Monitor",
    description: "Tracks calendar events, detects conflicts, and creates prep tasks",
    implemented: true,
  },
  {
    value: "document_analyzer",
    label: "Document Analyzer",
    description: "Analyzes documents and extracts key information, tags, and action items",
    implemented: true,
  },
  {
    value: "task_manager",
    label: "Task Manager",
    description: "Automatically organizes, prioritizes, and flags overdue tasks",
    implemented: true,
  },
  {
    value: "daily_digest",
    label: "Daily Digest",
    description: "Sends personalized daily summaries with tasks, calendar, and recommendations",
    implemented: true,
  },
  {
    value: "meeting_assistant",
    label: "Meeting Assistant",
    description: "Prepares meeting agendas and follows up on action items",
    implemented: false,
  },
  {
    value: "email_organizer",
    label: "Email Organizer",
    description: "Categorizes and organizes emails automatically",
    implemented: false,
  },
  {
    value: "research_assistant",
    label: "Research Assistant",
    description: "Conducts research and compiles findings",
    implemented: false,
  },
  {
    value: "workflow_optimizer",
    label: "Workflow Optimizer",
    description: "Analyzes workflows and suggests improvements",
    implemented: false,
  },
  {
    value: "sentiment_monitor",
    label: "Sentiment Monitor",
    description: "Monitors sentiment in communications",
    implemented: false,
  },
];

const PERSONALITIES = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "enthusiastic", label: "Enthusiastic" },
];

// Agent-specific configuration defaults
const AGENT_CONFIG_DEFAULTS: Record<string, Record<string, any>> = {
  email_monitor: {
    autoCreateTasks: true,
    priorityThreshold: "medium",
    filterSenders: [],
  },
  calendar_monitor: {
    hoursAhead: 24,
    createPrepTasks: true,
    notifyConflicts: true,
    trackResponseStatus: true,
    importantAttendees: [],
  },
  document_analyzer: {
    autoTag: true,
    generateSummary: true,
    createTasksFromActions: true,
    minConfidenceScore: 0.7,
  },
  task_manager: {
    autoPrioritize: true,
    flagOverdue: true,
    overdueThresholdHours: 24,
  },
  daily_digest: {
    includeCalendar: true,
    includeTasks: true,
    includeDocuments: true,
    includeInsights: true,
    digestTime: "09:00",
    deliveryMethod: "in_app",
  },
};

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agent_type: "",
    personality: "professional",
    instructions: "",
    configuration: {} as Record<string, any>,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name || !formData.agent_type) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if selected agent type is implemented
    const agentType = AGENT_TYPES.find(t => t.value === formData.agent_type);
    if (agentType && !agentType.implemented) {
      toast.error(`${agentType.label} is coming soon and cannot be created yet.`);
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
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // When agent type changes, load default configuration
      if (field === "agent_type" && AGENT_CONFIG_DEFAULTS[value]) {
        updated.configuration = { ...AGENT_CONFIG_DEFAULTS[value] };
      }
      return updated;
    });
  }

  function handleConfigChange(key: string, value: any) {
    setFormData((prev) => ({
      ...prev,
      configuration: { ...prev.configuration, [key]: value },
    }));
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

      {/* How AI Agents Work - Info Card */}
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
                onValueChange={(value) => {
                  const agentType = AGENT_TYPES.find(t => t.value === value);
                  if (agentType && !agentType.implemented) {
                    toast.info(`${agentType.label} is coming soon!`);
                    return;
                  }
                  handleChange("agent_type", value);
                }}
                required
              >
                <SelectTrigger className="border-slate-300 dark:border-slate-700">
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_TYPES.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className={!type.implemented ? "opacity-60" : ""}
                    >
                      <div className="flex items-center gap-2">
                        <span>{type.label}</span>
                        {!type.implemented && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedType.description}
                </p>
              )}
              {selectedType && !selectedType.implemented && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md">
                  <Clock className="h-4 w-4" />
                  <span>This agent type is coming soon. Only Email Monitor is currently available.</span>
                </div>
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

            {/* Agent-Specific Configuration */}
            {formData.agent_type && AGENT_CONFIG_DEFAULTS[formData.agent_type] && (
              <Card className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                      {selectedType?.label} Settings
                    </CardTitle>
                  </div>
                  <CardDescription className="text-slate-600 dark:text-slate-400">
                    Configure specific behaviors for this agent type
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email Monitor Configuration */}
                  {formData.agent_type === "email_monitor" && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Auto-create Tasks</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Automatically create tasks from actionable emails
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.autoCreateTasks ?? true}
                          onCheckedChange={(checked) => handleConfigChange("autoCreateTasks", checked)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-900 dark:text-slate-100">Priority Threshold</Label>
                        <Select
                          value={formData.configuration.priorityThreshold ?? "medium"}
                          onValueChange={(value) => handleConfigChange("priorityThreshold", value)}
                        >
                          <SelectTrigger className="border-slate-300 dark:border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - Process all emails</SelectItem>
                            <SelectItem value="medium">Medium - Skip routine emails</SelectItem>
                            <SelectItem value="high">High - Only urgent emails</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Minimum priority level to process emails
                        </p>
                      </div>
                    </>
                  )}

                  {/* Calendar Monitor Configuration */}
                  {formData.agent_type === "calendar_monitor" && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-900 dark:text-slate-100">Hours Ahead to Monitor</Label>
                          <Badge variant="outline">{formData.configuration.hoursAhead ?? 24}h</Badge>
                        </div>
                        <Slider
                          value={[formData.configuration.hoursAhead ?? 24]}
                          onValueChange={([value]) => handleConfigChange("hoursAhead", value)}
                          min={6}
                          max={72}
                          step={6}
                          className="w-full"
                        />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          How far ahead to look for upcoming events
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Create Prep Tasks</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Auto-create preparation tasks for meetings
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.createPrepTasks ?? true}
                          onCheckedChange={(checked) => handleConfigChange("createPrepTasks", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Notify Conflicts</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Alert when scheduling conflicts are detected
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.notifyConflicts ?? true}
                          onCheckedChange={(checked) => handleConfigChange("notifyConflicts", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Track RSVP Status</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Monitor for missing responses to meeting invites
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.trackResponseStatus ?? true}
                          onCheckedChange={(checked) => handleConfigChange("trackResponseStatus", checked)}
                        />
                      </div>
                    </>
                  )}

                  {/* Document Analyzer Configuration */}
                  {formData.agent_type === "document_analyzer" && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Auto-tag Documents</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Automatically add relevant tags to documents
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.autoTag ?? true}
                          onCheckedChange={(checked) => handleConfigChange("autoTag", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Generate Summaries</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Create AI summaries for analyzed documents
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.generateSummary ?? true}
                          onCheckedChange={(checked) => handleConfigChange("generateSummary", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Extract Action Items</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Create tasks from action items in documents
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.createTasksFromActions ?? true}
                          onCheckedChange={(checked) => handleConfigChange("createTasksFromActions", checked)}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-900 dark:text-slate-100">Confidence Threshold</Label>
                          <Badge variant="outline">{Math.round((formData.configuration.minConfidenceScore ?? 0.7) * 100)}%</Badge>
                        </div>
                        <Slider
                          value={[(formData.configuration.minConfidenceScore ?? 0.7) * 100]}
                          onValueChange={([value]) => handleConfigChange("minConfidenceScore", value / 100)}
                          min={50}
                          max={95}
                          step={5}
                          className="w-full"
                        />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Minimum AI confidence to apply tags or extract items
                        </p>
                      </div>
                    </>
                  )}

                  {/* Task Manager Configuration */}
                  {formData.agent_type === "task_manager" && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Auto-prioritize Tasks</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Automatically adjust task priorities based on context
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.autoPrioritize ?? true}
                          onCheckedChange={(checked) => handleConfigChange("autoPrioritize", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-slate-900 dark:text-slate-100">Flag Overdue Tasks</Label>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Highlight tasks that are past due date
                          </p>
                        </div>
                        <Switch
                          checked={formData.configuration.flagOverdue ?? true}
                          onCheckedChange={(checked) => handleConfigChange("flagOverdue", checked)}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-slate-900 dark:text-slate-100">Overdue Threshold</Label>
                          <Badge variant="outline">{formData.configuration.overdueThresholdHours ?? 24}h</Badge>
                        </div>
                        <Slider
                          value={[formData.configuration.overdueThresholdHours ?? 24]}
                          onValueChange={([value]) => handleConfigChange("overdueThresholdHours", value)}
                          min={1}
                          max={72}
                          step={1}
                          className="w-full"
                        />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Hours after due date before task is flagged overdue
                        </p>
                      </div>
                    </>
                  )}

                  {/* Daily Digest Configuration */}
                  {formData.agent_type === "daily_digest" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-slate-900 dark:text-slate-100">Digest Time</Label>
                        <Input
                          type="time"
                          value={formData.configuration.digestTime ?? "09:00"}
                          onChange={(e) => handleConfigChange("digestTime", e.target.value)}
                          className="border-slate-300 dark:border-slate-700 w-32"
                        />
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          When to generate and deliver daily digest
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-900 dark:text-slate-100">Delivery Method</Label>
                        <Select
                          value={formData.configuration.deliveryMethod ?? "in_app"}
                          onValueChange={(value) => handleConfigChange("deliveryMethod", value)}
                        >
                          <SelectTrigger className="border-slate-300 dark:border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_app">In-App Notification</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="both">Both</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <Label className="text-slate-900 dark:text-slate-100 mb-3 block">Include in Digest</Label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-slate-700 dark:text-slate-300 font-normal">Calendar Events</Label>
                            <Switch
                              checked={formData.configuration.includeCalendar ?? true}
                              onCheckedChange={(checked) => handleConfigChange("includeCalendar", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-slate-700 dark:text-slate-300 font-normal">Tasks Overview</Label>
                            <Switch
                              checked={formData.configuration.includeTasks ?? true}
                              onCheckedChange={(checked) => handleConfigChange("includeTasks", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-slate-700 dark:text-slate-300 font-normal">Recent Documents</Label>
                            <Switch
                              checked={formData.configuration.includeDocuments ?? true}
                              onCheckedChange={(checked) => handleConfigChange("includeDocuments", checked)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm text-slate-700 dark:text-slate-300 font-normal">AI Insights</Label>
                            <Switch
                              checked={formData.configuration.includeInsights ?? true}
                              onCheckedChange={(checked) => handleConfigChange("includeInsights", checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

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
    </div>
  );
}
