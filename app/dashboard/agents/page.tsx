"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sparkles,
  Brain,
  Eye,
  Search,
  TrendingUp,
  Zap,
  MessageSquare,
  Clock,
  FileText,
  Mail,
  Calendar,
  LayoutGrid,
  List as ListIcon,
  Wand2,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { FilterPills } from "@/components/ui/filter-pills";

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
    color: "violet",
  },
  {
    title: "Meeting Prep Assistant",
    description: "Gather context and prep materials before meetings",
    type: "meeting_assistant",
    icon: Calendar,
    color: "emerald",
  },
  {
    title: "Daily Insights Agent",
    description: "Analyze patterns and deliver actionable insights",
    type: "daily_digest",
    icon: Brain,
    color: "amber",
  },
];

const suggestionColors = {
  violet: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
    hover: "hover:border-violet-300 dark:hover:border-violet-700",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    hover: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    hover: "hover:border-amber-300 dark:hover:border-amber-700",
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

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
  const { suggestions, dismissSuggestion, completeSuggestion } =
    useSmartCoaching();

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

  // Status filter options
  const statusFilters = [
    { id: "all", label: "All Agents" },
    { id: "active", label: "Active" },
    { id: "inactive", label: "Inactive" },
  ];

  if (isLoading) {
    return (
      <DashboardPageWrapper>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-10 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                <div className="h-10 w-32 bg-violet-200 dark:bg-violet-900/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-8 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <DashboardHeader
          title="AI Agents"
          subtitle="Proactive assistants that monitor your work and automatically create tasks"
          icon={Cpu}
          iconColor="violet"
          stats={[
            { label: "agents", value: agents.length },
            { label: "active", value: activeAgents },
          ]}
          actions={
            <>
              <Link href="/dashboard/agents/templates">
                <Button
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link href="/dashboard/agents/activity">
                <Button
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </Button>
              </Link>
              <Link href="/dashboard/agents/new">
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25">
                  <Plus className="h-4 w-4 mr-2" />
                  New Agent
                </Button>
              </Link>
            </>
          }
        />

        {/* Stats Cards */}
        <StatCardGrid>
          <StatCard
            label="Total Agents"
            value={agents.length}
            icon={Bot}
            iconColor="violet"
          />
          <StatCard
            label="Active"
            value={activeAgents}
            icon={CheckCircle2}
            iconColor="emerald"
          />
          <StatCard
            label="Total Actions"
            value={totalActions.toLocaleString()}
            icon={Zap}
            iconColor="amber"
          />
          <StatCard
            label="Avg Success"
            value={`${avgSuccessRate}%`}
            icon={TrendingUp}
            iconColor="blue"
          />
        </StatCardGrid>

        {/* Smart Coaching Cards */}
        {suggestions.length > 0 && (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {suggestions.map((suggestion) => (
              <SmartCoachingCard
                key={suggestion.id}
                suggestion={suggestion}
                onDismiss={dismissSuggestion}
                onComplete={completeSuggestion}
              />
            ))}
          </motion.div>
        )}

        {/* AI Suggestions Panel */}
        {showAISuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <Wand2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      AI-Powered Agent Suggestions
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAISuggestions(false)}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {agentSuggestions.map((suggestion, idx) => {
                    const Icon = suggestion.icon;
                    const colors =
                      suggestionColors[
                        suggestion.color as keyof typeof suggestionColors
                      ];
                    return (
                      <motion.div
                        key={idx}
                        custom={idx}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Link
                          href="/dashboard/agents/new"
                          className="block h-full"
                        >
                          <div
                            className={`p-4 h-full bg-white dark:bg-slate-900 rounded-xl border ${colors.border} ${colors.hover} transition-all cursor-pointer group hover:shadow-md`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-10 w-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon className={`h-5 w-5 ${colors.text}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm mb-1 truncate text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                  {suggestion.title}
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {suggestion.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Search and Filters */}
        {agents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search agents by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>

                  {/* Status Filter Pills */}
                  <FilterPills
                    filters={statusFilters}
                    activeFilter={filterStatus}
                    onFilterChange={setFilterStatus}
                  />

                  {/* Dropdowns & View Toggle */}
                  <div className="flex gap-2">
                    {uniqueTypes.length > 0 && (
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[150px] border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Type" />
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
                    )}

                    {uniquePersonalities.length > 0 && (
                      <Select
                        value={filterPersonality}
                        onValueChange={setFilterPersonality}
                      >
                        <SelectTrigger className="w-[150px] border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Personality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {uniquePersonalities.map((personality) => (
                            <SelectItem key={personality} value={personality}>
                              {personality}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
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
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Agents List */}
        {agents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
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
          </motion.div>
        ) : filteredAgents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                  No agents found
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try adjusting your search or filters
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {filteredAgents.length} Agent
                {filteredAgents.length !== 1 ? "s" : ""}
              </h2>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid gap-4 md:grid-cols-2"
                  : "space-y-4"
              }
            >
              {filteredAgents.map((agent, idx) => {
                const successRate = getSuccessRate(agent);
                const AgentIcon = getAgentIcon(agent.agent_type);

                return (
                  <motion.div
                    key={agent.id}
                    custom={idx}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Card
                      className={`border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:shadow-lg ${
                        agent.enabled
                          ? "hover:border-violet-300 dark:hover:border-violet-700"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div
                              className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                agent.enabled
                                  ? "bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30"
                                  : "bg-slate-100 dark:bg-slate-800"
                              }`}
                            >
                              <AgentIcon
                                className={`h-7 w-7 ${
                                  agent.enabled
                                    ? "text-violet-600 dark:text-violet-400"
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
                                  <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                                    <Activity className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="capitalize text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                >
                                  {agent.personality}
                                </Badge>
                              </div>

                              {agent.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                                  {agent.description}
                                </p>
                              )}

                              {/* Visual Performance Indicator */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                                  <span>Performance</span>
                                  <span
                                    className={`font-semibold ${
                                      successRate >= 90
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : successRate >= 70
                                          ? "text-amber-600 dark:text-amber-400"
                                          : "text-rose-600 dark:text-rose-400"
                                    }`}
                                  >
                                    {successRate}%
                                  </span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div
                                    className={`h-full rounded-full ${
                                      successRate >= 90
                                        ? "bg-gradient-to-r from-emerald-500 to-green-500"
                                        : successRate >= 70
                                          ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                          : "bg-gradient-to-r from-rose-500 to-red-500"
                                    }`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${successRate}%` }}
                                    transition={{
                                      duration: 0.8,
                                      delay: idx * 0.1,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  {agent.total_actions} actions
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  {agent.successful_actions} success
                                </span>
                                {agent.failed_actions > 0 && (
                                  <span className="flex items-center gap-1">
                                    <XCircle className="h-3 w-3 text-rose-500" />
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
                                className="border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700"
                              >
                                <Eye className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAgent(agent.id, agent.enabled)}
                              className="border-slate-200 dark:border-slate-700"
                            >
                              {agent.enabled ? (
                                <Pause className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <Play className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteAgent(agent.id)}
                              className="border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardPageWrapper>
  );
}
