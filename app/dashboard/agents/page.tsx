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
  AlertTriangle,
  Link as LinkIcon,
  Power,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cardVariants } from "@/lib/design/animations";
import { DashboardPageWrapper, DashboardHeader } from "@/components/ui/dashboard-header";
import { StatCard, StatCardGrid } from "@/components/ui/stat-card";
import { FilterPills } from "@/components/ui/filter-pills";
import { StaggeredGrid, StaggeredGridItem } from "@/components/ui/page-wrapper";

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

// System agent type definitions with prerequisites
interface SystemAgentType {
  type: string;
  name: string;
  description: string;
  icon: any;
  prerequisites: ("gmail" | "google-calendar")[];
  defaultConfig: Record<string, any>;
}

const SYSTEM_AGENT_TYPES: SystemAgentType[] = [
  {
    type: "email_monitor",
    name: "Email Monitor",
    description: "Monitors Gmail for important emails and creates tasks from action items",
    icon: Mail,
    prerequisites: ["gmail"],
    defaultConfig: { scan_interval_minutes: 15, auto_categorize: true, priority_threshold: "medium" },
  },
  {
    type: "calendar_monitor",
    name: "Calendar Monitor",
    description: "Tracks upcoming events and sends prep reminders with context",
    icon: Calendar,
    prerequisites: ["google-calendar"],
    defaultConfig: { prep_time_minutes: 30, auto_prep: true, conflict_detection: true },
  },
  {
    type: "task_manager",
    name: "Task Manager",
    description: "Intelligently organizes, prioritizes, and follows up on your tasks",
    icon: ClipboardList,
    prerequisites: [],
    defaultConfig: { auto_prioritize: true, daily_review: true, follow_up_days: 3 },
  },
  {
    type: "document_analyzer",
    name: "Document Analyzer",
    description: "Processes uploaded documents, extracts key info and action items",
    icon: FileText,
    prerequisites: [],
    defaultConfig: { auto_summarize: true, extract_action_items: true, auto_tag: true },
  },
  {
    type: "daily_digest",
    name: "Daily Digest",
    description: "Sends a morning summary of tasks, emails, and calendar events",
    icon: MessageSquare,
    prerequisites: [],
    defaultConfig: { send_time: "08:00", include_tasks: true, include_calendar: true, include_emails: true },
  },
];

// Agent type icons mapping
const agentTypeIcons: { [key: string]: any } = {
  document_analyzer: FileText,
  task_manager: CheckCircle2,
  meeting_assistant: Calendar,
  email_organizer: Mail,
  email_monitor: Mail,
  calendar_monitor: Calendar,
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


export default function AgentsPage() {
  const { confirm } = useConfirm();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPersonality, setFilterPersonality] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [connectedIntegrations, setConnectedIntegrations] = useState<Set<string>>(new Set());
  const [enablingAgent, setEnablingAgent] = useState<string | null>(null);

  // Smart Coaching
  const { suggestions, dismissSuggestion, completeSuggestion } =
    useSmartCoaching();

  useEffect(() => {
    fetchAgents();
    fetchIntegrationStatus();
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

  async function fetchIntegrationStatus() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const connected = new Set<string>();

      // Check user_integrations table (settings page connections)
      const { data: userIntegrations } = await supabase
        .from("user_integrations")
        .select("integration_id, is_connected")
        .eq("user_id", user.id)
        .eq("is_connected", true);

      if (userIntegrations) {
        userIntegrations.forEach((i: any) => connected.add(i.integration_id));
      }

      // Check org-level integrations table (main integrations page connections)
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .single();

      if (profile?.organization_id) {
        const { data: orgIntegrations } = await supabase
          .from("integrations")
          .select("provider, is_active")
          .eq("organization_id", profile.organization_id)
          .eq("is_active", true);

        if (orgIntegrations) {
          orgIntegrations.forEach((i: any) => {
            // Map "google" provider to specific services
            if (i.provider === "google") {
              connected.add("gmail");
              connected.add("google-calendar");
            }
            connected.add(i.provider);
          });
        }
      }

      setConnectedIntegrations(connected);
    } catch (error) {
      console.error("Error fetching integration status:", error);
    }
  }

  function isPrerequisiteMet(prerequisite: string): boolean {
    return connectedIntegrations.has(prerequisite);
  }

  function areAllPrerequisitesMet(prerequisites: string[]): boolean {
    if (prerequisites.length === 0) return true;
    return prerequisites.every((p) => isPrerequisiteMet(p));
  }

  function getExistingAgentByType(agentType: string): Agent | undefined {
    return agents.find((a) => a.agent_type === agentType);
  }

  async function enableSystemAgent(agentDef: SystemAgentType) {
    if (!areAllPrerequisitesMet(agentDef.prerequisites)) {
      toast.error("Please connect the required integrations first", {
        description: `This agent requires: ${agentDef.prerequisites.map(p => p === "gmail" ? "Gmail" : "Google Calendar").join(", ")}`,
        action: {
          label: "Go to Integrations",
          onClick: () => window.location.href = "/dashboard/integrations",
        },
      });
      return;
    }

    const existing = getExistingAgentByType(agentDef.type);
    if (existing) {
      // Agent already exists, just toggle it on
      await toggleAgent(existing.id, false);
      return;
    }

    setEnablingAgent(agentDef.type);
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: agentDef.name,
          description: agentDef.description,
          agent_type: agentDef.type,
          config: agentDef.defaultConfig,
          personality: "professional",
        }),
      });

      if (response.ok) {
        toast.success(`${agentDef.name} activated successfully`);
        fetchAgents();
      } else {
        const data = await response.json();
        if (data.code === "FEATURE_GATED") {
          toast.error("Feature not available on your plan", {
            description: data.reason,
          });
        } else {
          toast.error(`Failed to activate ${agentDef.name}`);
        }
      }
    } catch (error) {
      toast.error(`Failed to activate ${agentDef.name}`);
    } finally {
      setEnablingAgent(null);
    }
  }

  async function disableSystemAgent(agentId: string, agentName: string) {
    try {
      const response = await fetch(`/api/agents/${agentId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      });

      if (response.ok) {
        toast.success(`${agentName} deactivated`);
        fetchAgents();
      } else {
        toast.error("Failed to deactivate agent");
      }
    } catch (error) {
      toast.error("Failed to deactivate agent");
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
    if (!(await confirm("Are you sure you want to delete this agent?"))) return;

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
          <div className="rounded-2xl border border-border bg-background p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 w-28 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 w-32 bg-violet-200 dark:bg-violet-900/50 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          {/* Stats Skeleton */}
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="border-border bg-background"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                      <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
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
                className="border-border bg-background"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-full bg-muted rounded animate-pulse" />
                      <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
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
                  className="border-border hover:bg-muted"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link href="/dashboard/agents/activity">
                <Button
                  variant="outline"
                  className="border-border hover:bg-muted"
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

        {/* System Agents - Enable/Disable Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-border bg-background overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/50 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <Power className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <CardTitle className="text-base font-semibold text-foreground">
                  System Agents
                </CardTitle>
                <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                  {SYSTEM_AGENT_TYPES.filter((sa) => {
                    const existing = getExistingAgentByType(sa.type);
                    return existing?.enabled;
                  }).length} / {SYSTEM_AGENT_TYPES.length} active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {SYSTEM_AGENT_TYPES.map((agentDef) => {
                  const existingAgent = getExistingAgentByType(agentDef.type);
                  const isActive = existingAgent?.enabled ?? false;
                  const prereqsMet = areAllPrerequisitesMet(agentDef.prerequisites);
                  const isEnabling = enablingAgent === agentDef.type;
                  const AgentIcon = agentDef.icon;

                  return (
                    <div
                      key={agentDef.type}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isActive
                          ? "border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20"
                          : "border-border bg-background hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isActive
                              ? "bg-violet-100 dark:bg-violet-900/30"
                              : "bg-muted"
                          }`}
                        >
                          <AgentIcon
                            className={`h-5 w-5 ${
                              isActive
                                ? "text-violet-600 dark:text-violet-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm text-foreground truncate">
                              {agentDef.name}
                            </h4>
                            {isActive && (
                              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {agentDef.description}
                          </p>
                          {/* Prerequisites */}
                          {agentDef.prerequisites.length > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              {agentDef.prerequisites.map((prereq) => {
                                const met = isPrerequisiteMet(prereq);
                                return (
                                  <span
                                    key={prereq}
                                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                      met
                                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                        : "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                    }`}
                                  >
                                    {met ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3" />
                                    )}
                                    {prereq === "gmail" ? "Gmail" : "Calendar"}
                                  </span>
                                );
                              })}
                              {!prereqsMet && (
                                <Link
                                  href="/dashboard/integrations"
                                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                                >
                                  <LinkIcon className="h-3 w-3" />
                                  Connect
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {isEnabling ? (
                          <Button size="sm" disabled className="min-w-[80px]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </Button>
                        ) : isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => disableSystemAgent(existingAgent!.id, agentDef.name)}
                            className="min-w-[80px] border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Disable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => enableSystemAgent(agentDef)}
                            disabled={!prereqsMet}
                            className={`min-w-[80px] ${
                              prereqsMet
                                ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                                : ""
                            }`}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Enable
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
            <Card className="border-border bg-background overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/50 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                      <Wand2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">
                      AI-Powered Agent Suggestions
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAISuggestions(false)}
                    className="text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-slate-200"
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
                            className={`p-4 h-full bg-background rounded-xl border ${colors.border} ${colors.hover} transition-all cursor-pointer group hover:shadow-md`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`h-10 w-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}
                              >
                                <Icon className={`h-5 w-5 ${colors.text}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm mb-1 truncate text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                  {suggestion.title}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
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
            <Card className="border-border bg-background">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search agents by name or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-border bg-muted"
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
                        <SelectTrigger className="w-[150px] border-border">
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
                        <SelectTrigger className="w-[150px] border-border">
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

                    <div className="flex border border-border rounded-lg overflow-hidden">
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
            <Card className="border-border bg-background p-12">
              <div className="text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  No agents found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {filteredAgents.length} Agent
                {filteredAgents.length !== 1 ? "s" : ""}
              </h2>
            </div>

            <StaggeredGrid
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
                  <StaggeredGridItem key={agent.id}>
                    <Card
                      className={`border-border bg-background transition-all hover:shadow-lg ${
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
                                  : "bg-muted"
                              }`}
                            >
                              <AgentIcon
                                className={`h-7 w-7 ${
                                  agent.enabled
                                    ? "text-violet-600 dark:text-violet-400"
                                    : "text-muted-foreground dark:text-muted-foreground"
                                }`}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold text-lg truncate text-foreground">
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
                                    className="bg-muted text-muted-foreground"
                                  >
                                    Inactive
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="capitalize text-xs border-border text-muted-foreground"
                                >
                                  {agent.personality}
                                </Badge>
                              </div>

                              {agent.description && (
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                  {agent.description}
                                </p>
                              )}

                              {/* Visual Performance Indicator */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
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
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
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

                              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
                                className="border-border hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700"
                              >
                                <Eye className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAgent(agent.id, agent.enabled)}
                              className="border-border"
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
                              className="border-border hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-300 dark:hover:border-rose-700"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggeredGridItem>
                );
              })}
            </StaggeredGrid>
          </div>
        )}
      </div>
    </DashboardPageWrapper>
  );
}
