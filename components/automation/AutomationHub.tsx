"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AutomationGrid } from "./AutomationGrid";
import { ExecutionHistory } from "./ExecutionHistory";
import { TriggerManager } from "./TriggerManager";
import {
  Bot,
  Workflow,
  Zap,
  Clock,
  Search,
  Plus,
  History,
  Settings2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export type AutomationType = "bot" | "workflow" | "n8n" | "job";

export interface Automation {
  id: string;
  name: string;
  description?: string;
  type: AutomationType;
  status: "active" | "inactive" | "error";
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface AutomationHubProps {
  userId: string;
}

const tabConfig = [
  { value: "all", label: "All", icon: Workflow },
  { value: "bot", label: "Bots", icon: Bot },
  { value: "workflow", label: "Workflows", icon: Zap },
  { value: "n8n", label: "n8n", icon: Settings2 },
  { value: "job", label: "Jobs", icon: Clock },
  { value: "history", label: "History", icon: History },
  { value: "triggers", label: "Triggers", icon: Zap },
];

export function AutomationHub({ userId }: AutomationHubProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAutomations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch("/api/automation");
      if (!response.ok) throw new Error("Failed to fetch automations");

      const data = await response.json();
      setAutomations(data.automations || []);
    } catch (error) {
      console.error("Error fetching automations:", error);
      toast.error("Failed to load automations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, [userId]);

  // Filter automations
  const filteredAutomations = automations.filter((a) => {
    // Type filter
    if (activeTab !== "all" && activeTab !== "history" && activeTab !== "triggers") {
      if (a.type !== activeTab) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(query) ||
        a.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Count by type
  const counts = {
    all: automations.length,
    bot: automations.filter((a) => a.type === "bot").length,
    workflow: automations.filter((a) => a.type === "workflow").length,
    n8n: automations.filter((a) => a.type === "n8n").length,
    job: automations.filter((a) => a.type === "job").length,
  };

  // Stats
  const activeCount = automations.filter((a) => a.status === "active").length;
  const errorCount = automations.filter((a) => a.status === "error").length;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-muted-foreground">Total Automations</p>
          <p className="text-2xl font-semibold">{automations.length}</p>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-semibold text-green-600">{activeCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-muted-foreground">Errors</p>
          <p className="text-2xl font-semibold text-red-600">{errorCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-muted-foreground">Runs Today</p>
          <p className="text-2xl font-semibold">
            {automations.reduce((sum, a) => sum + (a.metadata?.runsToday || 0), 0)}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAutomations(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/dashboard/bots/new">
            <Button size="sm" className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
          {tabConfig.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
              {value !== "history" && value !== "triggers" && counts[value as keyof typeof counts] > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {counts[value as keyof typeof counts]}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Grid Views */}
        {["all", "bot", "workflow", "n8n", "job"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <AutomationGrid
              automations={filteredAutomations}
              loading={loading}
              onRefresh={() => fetchAutomations(true)}
            />
          </TabsContent>
        ))}

        {/* History Tab */}
        <TabsContent value="history">
          <ExecutionHistory />
        </TabsContent>

        {/* Triggers Tab */}
        <TabsContent value="triggers">
          <TriggerManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
