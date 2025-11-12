"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSmartCoaching } from "@/hooks/useSmartCoaching";
import { SmartCoachingCard } from "@/components/ai-coach/SmartCoachingCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Plus,
  Play,
  Pause,
  Trash2,
  Activity,
  CheckCircle2,
  XCircle,
  BarChart3,
  Sparkles,
  Brain,
  Eye,
  Search,
  Filter,
  TrendingUp,
  Zap,
  MessageSquare,
  Clock,
  Target,
  Users,
  FileText,
  Mail,
  Calendar,
  Settings,
  LayoutGrid,
  List as ListIcon,
  ArrowRight,
  Wand2,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";

interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  enabled: boolean;
  personality: string;
  total_actions: number;
  successful_actions: number;
  failed_actions: number;
  last_active_at: string | null;
  created_at: string;
}

// Agent type icons mapping
const agentTypeIcons: { [key: string]: any } = {
  document_analyzer: FileText,
  task_manager: CheckCircle2,
  meeting_assistant: Calendar,
  email_organizer: Mail,
  research_assistant: Search,
  workflow_optimizer: Zap,
  daily_digest: MessageSquare,
  sentiment_monitor: TrendingUp,
};

// AI-powered agent suggestions
const agentSuggestions = [
  {
    title: "Smart Email Responder",
    description: "Automatically draft and suggest responses to emails",
    type: "email_organizer",
    icon: Mail,
  },
  {
    title: "Meeting Prep Assistant",
    description: "Gather context and prep materials before meetings",
    type: "meeting_assistant",
    icon: Calendar,
  },
  {
    title: "Daily Insights Agent",
    description: "Analyze patterns and deliver actionable insights",
    type: "daily_digest",
    icon: Brain,
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPersonality, setFilterPersonality] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAISuggestions, setShowAISuggestions] = useState(true);

  // Smart Coaching
  const { suggestions, dismissSuggestion, completeSuggestion } = useSmartCoaching();

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchAgents() {
    try {
      const response = await fetch("/api/agents");
      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleAgent(agentId: string, currentlyEnabled: boolean) {
    try {
      const response = await fetch(`/api/agents/${agentId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentlyEnabled }),
      });

      if (response.ok) {
        toast.success(
          `Agent ${!currentlyEnabled ? "activated" : "deactivated"}`
        );
        fetchAgents();
      } else {
        toast.error("Failed to update agent");
      }
    } catch (error) {
      toast.error("Failed to update agent");
    }
  }

  async function deleteAgent(agentId: string) {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Agent deleted");
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
      } else {
        toast.error("Failed to delete agent");
      }
    } catch (error) {
      toast.error("Failed to delete agent");
    }
  }

  function getAgentIcon(agentType: string) {
    return agentTypeIcons[agentType] || Bot;
  }

  function getSuccessRate(agent: Agent) {
    if (agent.total_actions === 0) return 0;
    return Math.round((agent.successful_actions / agent.total_actions) * 100);
  }

  // Filter agents
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || agent.agent_type === filterType;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && agent.enabled) ||
      (filterStatus === "inactive" && !agent.enabled);

    const matchesPersonality =
      filterPersonality === "all" || agent.personality === filterPersonality;

    return matchesSearch && matchesType && matchesStatus && matchesPersonality;
  });

  // Get unique agent types and personalities for filters
  const uniqueTypes = [...new Set(agents.map((a) => a.agent_type))];
  const uniquePersonalities = [...new Set(agents.map((a) => a.personality))];

  // Calculate stats
  const activeAgents = agents.filter((a) => a.enabled).length;
  const totalActions = agents.reduce((sum, a) => sum + a.total_actions, 0);
  const avgSuccessRate =
    agents.length > 0
      ? Math.round(
          agents.reduce((sum, a) => sum + getSuccessRate(a), 0) / agents.length
        )
      : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            AI Agents
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-8 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center">
              <Cpu className="h-6 w-6 text-white dark:text-slate-900" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                AI Agents
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Proactive assistants that monitor your work and automatically create tasks
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/agents/templates">
              <Button variant="outline" className="border-slate-200 dark:border-slate-800">
                <Sparkles className="h-4 w-4 mr-2" />
                Templates
              </Button>
            </Link>
            <Link href="/dashboard/agents/activity">
              <Button variant="outline" className="border-slate-200 dark:border-slate-800">
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </Button>
            </Link>
            <Link href="/dashboard/agents/new">
              <Button className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                <Plus className="h-4 w-4 mr-2" />
                New Agent
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Agents</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{agents.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Agents</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{activeAgents}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total Actions</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{totalActions}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg Success Rate</p>
              <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100 mt-1">{avgSuccessRate}%</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Smart Coaching Cards */}
      {suggestions.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestions.map((suggestion) => (
            <SmartCoachingCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={dismissSuggestion}
              onComplete={completeSuggestion}
            />
          ))}
        </div>
      )}

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <Card className="p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                AI-Powered Agent Suggestions
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAISuggestions(false)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {agentSuggestions.map((suggestion, idx) => {
              const Icon = suggestion.icon;
              return (
                <Link
                  key={idx}
                  href="/dashboard/agents/new"
                  className="block"
                >
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1 truncate text-slate-900 dark:text-slate-100">
                          {suggestion.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {/* Search and Filters */}
      {agents.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search agents by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Agent Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterPersonality}
                onValueChange={setFilterPersonality}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Personality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Personalities</SelectItem>
                  {uniquePersonalities.map((personality) => (
                    <SelectItem key={personality} value={personality}>
                      {personality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-none"
                >
                  <ListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Agents List */}
      {agents.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="No AI agents yet"
          description="Agents monitor your work (emails, calendar, documents) and automatically create tasks in your Tasks page. They're proactive assistants that notice what needs to be done."
          action={{
            label: "Create Agent",
            onClick: () => (window.location.href = "/dashboard/agents/new"),
          }}
          secondaryAction={{
            label: "Browse Templates",
            onClick: () =>
              (window.location.href = "/dashboard/agents/templates"),
          }}
        />
      ) : filteredAgents.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {filteredAgents.length} Agent{filteredAgents.length !== 1 ? "s" : ""}
            </h2>
          </div>

          <div
            className={
              viewMode === "grid"
                ? "grid gap-4 md:grid-cols-2"
                : "space-y-4"
            }
          >
            {filteredAgents.map((agent) => {
              const successRate = getSuccessRate(agent);
              const AgentIcon = getAgentIcon(agent.agent_type);

              return (
                <Card
                  key={agent.id}
                  className={`p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors ${
                    agent.enabled
                      ? "hover:border-slate-300 dark:hover:border-slate-700"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          agent.enabled
                            ? "bg-purple-50 dark:bg-purple-950/30"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <AgentIcon
                          className={`h-7 w-7 ${
                            agent.enabled
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-slate-400 dark:text-slate-600"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg truncate text-slate-900 dark:text-slate-100">
                            {agent.name}
                          </h3>
                          {agent.enabled ? (
                            <Badge className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 border border-green-200 dark:border-green-800">
                              <Activity className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">Inactive</Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="capitalize text-xs border-slate-200 dark:border-slate-800"
                          >
                            {agent.personality}
                          </Badge>
                        </div>

                        {agent.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            {agent.description}
                          </p>
                        )}

                        {/* Visual Performance Indicator */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                            <span>Performance</span>
                            <span className="font-medium">{successRate}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all rounded-full ${
                                successRate >= 90
                                  ? "bg-green-600 dark:bg-green-500"
                                  : successRate >= 70
                                    ? "bg-orange-600 dark:bg-orange-500"
                                    : "bg-red-600 dark:bg-red-500"
                              }`}
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {agent.total_actions} actions
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                            {agent.successful_actions} success
                          </span>
                          {agent.failed_actions > 0 && (
                            <span className="flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                              {agent.failed_actions} failed
                            </span>
                          )}
                          {agent.last_active_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(
                                agent.last_active_at
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/dashboard/agents/${agent.id}/activity`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-slate-200 dark:border-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAgent(agent.id, agent.enabled)}
                        className="border-slate-200 dark:border-slate-800"
                      >
                        {agent.enabled ? (
                          <Pause className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAgent(agent.id)}
                        className="border-slate-200 dark:border-slate-800"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
