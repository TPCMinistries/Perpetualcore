"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TIER_CONFIG,
  type EcosystemProject,
  type ProjectTier,
} from "@/config/ecosystem";
import {
  Globe,
  Database,
  Zap,
  Users,
  FileText,
  MessageSquare,
  Bot,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Shield,
  RefreshCw,
  Activity,
  Boxes,
  Brain,
  Code,
  GitCommit,
  Rocket,
  XCircle,
  ArrowUpRight,
  Signal,
  CircleDot,
} from "lucide-react";

interface DeploymentInfo {
  state: "READY" | "ERROR" | "BUILDING" | "QUEUED" | "CANCELED";
  createdAt: number;
  commitMessage: string;
  commitSha: string;
  inspectorUrl: string;
}

interface CrossDbStats {
  databaseName: string;
  databaseId: string;
  totalUsers: number;
  extraStats?: Record<string, number>;
}

interface EcosystemData {
  timestamp: string;
  summary: {
    totalProjects: number;
    activeProjects: number;
    totalCronJobs: number;
    totalDatabases: number;
    connectedDatabases: number;
    stripeProjects: number;
    totalUsersAcrossAll: number;
    tiers: { CORE: number; MAIN: number; ANCILLARY: number };
  };
  brainStats: {
    users: number;
    documents: number;
    conversations: number;
    agentPlans: number;
    activeSubscriptions: number;
    customSkills: number;
  };
  deployments: Record<string, DeploymentInfo | null>;
  crossDbStats: CrossDbStats[];
  projects: EcosystemProject[];
  databases: Array<{
    name: string;
    id: string;
    projects: number;
    hasPII: boolean;
    description: string;
  }>;
  versionAlerts: Array<{
    project: string;
    issue: string;
    severity: "warning" | "info";
  }>;
  liveData: {
    vercel: boolean;
    crossDbConnected: string[];
  };
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function truncate(str: string, len: number): string {
  if (!str) return "";
  const firstLine = str.split("\n")[0];
  return firstLine.length > len ? firstLine.slice(0, len) + "..." : firstLine;
}

export function EcosystemDashboard() {
  const [data, setData] = useState<EcosystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ecosystem/status");
      if (!res.ok) throw new Error("Failed to fetch ecosystem data");
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) return <EcosystemSkeleton />;

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load ecosystem data</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, brainStats, deployments, crossDbStats, projects, databases, versionAlerts, liveData } = data;
  const activeProjects = projects.filter((p) => p.status === "active");
  const deployedCount = Object.values(deployments).filter((d) => d?.state === "READY").length;
  const errorCount = Object.values(deployments).filter((d) => d?.state === "ERROR").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ecosystem Command Center</h1>
          <p className="text-muted-foreground mt-1">
            {summary.totalProjects} projects &middot; {summary.totalDatabases} databases &middot; {summary.totalUsersAcrossAll.toLocaleString()} total users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {liveData.vercel && (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                <Signal className="h-3 w-3 mr-1" /> Vercel Live
              </Badge>
            )}
            {liveData.crossDbConnected.length > 1 && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                <Database className="h-3 w-3 mr-1" /> {liveData.crossDbConnected.length} DBs
              </Badge>
            )}
          </div>
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Pulse Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-sky-500" />}
          label="Total Users"
          value={summary.totalUsersAcrossAll}
          sublabel={`across ${liveData.crossDbConnected.length} databases`}
        />
        <StatCard
          icon={<Boxes className="h-5 w-5 text-blue-500" />}
          label="Active Projects"
          value={summary.activeProjects}
          sublabel={`of ${summary.totalProjects} total`}
        />
        <StatCard
          icon={<Rocket className="h-5 w-5 text-emerald-500" />}
          label="Deploys OK"
          value={deployedCount}
          sublabel={errorCount > 0 ? `${errorCount} errors` : "all healthy"}
          alert={errorCount > 0}
        />
        <StatCard
          icon={<Database className="h-5 w-5 text-purple-500" />}
          label="Databases"
          value={summary.connectedDatabases}
          sublabel={`of ${summary.totalDatabases} connected`}
        />
        <StatCard
          icon={<Zap className="h-5 w-5 text-amber-500" />}
          label="Cron Jobs"
          value={summary.totalCronJobs}
          sublabel="scheduled tasks"
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5 text-emerald-500" />}
          label="Stripe"
          value={summary.stripeProjects}
          sublabel="payment integrations"
        />
      </div>

      {/* Deployment Monitor */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg">Deployment Monitor</CardTitle>
            </div>
            {!liveData.vercel && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                Add VERCEL_TOKEN for live status
              </Badge>
            )}
          </div>
          <CardDescription>
            {activeProjects.length} active projects with Vercel deployments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeProjects.map((project) => {
              const dep = deployments[project.id];
              return (
                <DeploymentRow key={project.id} project={project} deployment={dep} />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Brain Stats + Cross-DB Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brain Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-500" />
              <CardTitle className="text-lg">Perpetual Core — Brain</CardTitle>
            </div>
            <CardDescription>Live from LDC Brain AI database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <BrainStat icon={<Users className="h-4 w-4" />} label="Users" value={brainStats.users} />
              <BrainStat icon={<FileText className="h-4 w-4" />} label="Documents" value={brainStats.documents} />
              <BrainStat icon={<MessageSquare className="h-4 w-4" />} label="Conversations" value={brainStats.conversations} />
              <BrainStat icon={<Bot className="h-4 w-4" />} label="Agent Plans" value={brainStats.agentPlans} />
              <BrainStat icon={<CreditCard className="h-4 w-4" />} label="Active Subs" value={brainStats.activeSubscriptions} />
              <BrainStat icon={<Code className="h-4 w-4" />} label="Custom Skills" value={brainStats.customSkills} />
            </div>
          </CardContent>
        </Card>

        {/* Cross-Database Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Cross-Database Intelligence</CardTitle>
            </div>
            <CardDescription>
              {crossDbStats.length} database{crossDbStats.length !== 1 ? "s" : ""} reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crossDbStats.map((db) => (
                <div
                  key={db.databaseId}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{db.databaseName}</p>
                      {db.extraStats && (
                        <p className="text-xs text-muted-foreground">
                          {Object.entries(db.extraStats)
                            .map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{db.totalUsers.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">users</p>
                  </div>
                </div>
              ))}
              {crossDbStats.length <= 1 && (
                <div className="p-3 rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground">
                    Add SUPABASE_*_URL and SUPABASE_*_SERVICE_ROLE_KEY env vars to see cross-database stats
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version Alerts */}
      {versionAlerts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Version Alerts</CardTitle>
            </div>
            <CardDescription>{versionAlerts.length} items need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versionAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30"
                >
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${alert.severity === "warning" ? "text-amber-500" : "text-blue-500"}`} />
                  <span className="font-medium text-sm">{alert.project}</span>
                  <span className="text-sm text-muted-foreground">{alert.issue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Grid by Tier */}
      {(["CORE", "MAIN", "ANCILLARY"] as ProjectTier[]).map((tier) => {
        const tierProjects = projects.filter((p) => p.tier === tier);
        const config = TIER_CONFIG[tier];

        return (
          <div key={tier}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className={`text-lg font-semibold ${config.color}`}>{config.label}</h2>
              <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>
                {tierProjects.length} projects
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tierProjects.map((project) => (
                <ProjectCard key={project.id} project={project} deployment={deployments[project.id]} />
              ))}
            </div>
          </div>
        );
      })}

      {/* Database Architecture */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">Database Architecture</CardTitle>
          </div>
          <CardDescription>{databases.length} databases — isolated by data sensitivity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.map((db) => {
              const liveStats = crossDbStats.find((s) => s.databaseId === db.id);
              return (
                <div
                  key={db.name}
                  className={`p-4 rounded-lg border ${db.id ? "bg-card" : "bg-muted/30 opacity-60"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{db.name}</span>
                    <div className="flex items-center gap-1.5">
                      {db.hasPII && <Shield className="h-3.5 w-3.5 text-amber-500" title="Contains PII" />}
                      {db.id ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{db.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {db.projects} {db.projects === 1 ? "project" : "projects"}
                    </Badge>
                    {liveStats && (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                        {liveStats.totalUsers.toLocaleString()} users
                      </Badge>
                    )}
                    {!db.id && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Not connected
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tier Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="font-medium text-muted-foreground">Tiers:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>CORE — Mission critical ({summary.tiers.CORE})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>MAIN — Revenue & delivery ({summary.tiers.MAIN})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>ANCILLARY — Support mission ({summary.tiers.ANCILLARY})</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ━━━ Sub-components ━━━

function StatCard({ icon, label, value, sublabel, alert }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel: string;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? "border-red-200 dark:border-red-800" : ""}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${alert ? "text-red-500" : ""}`}>{value.toLocaleString()}</p>
        <p className={`text-xs mt-0.5 ${alert ? "text-red-500" : "text-muted-foreground"}`}>{sublabel}</p>
      </CardContent>
    </Card>
  );
}

function BrainStat({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-lg font-semibold">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function DeploymentRow({ project, deployment }: { project: EcosystemProject; deployment: DeploymentInfo | null }) {
  const tierConfig = TIER_CONFIG[project.tier];

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {deployment ? (
          deployment.state === "READY" ? (
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          ) : deployment.state === "ERROR" ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CircleDot className="h-5 w-5 text-amber-500 animate-pulse" />
          )
        ) : (
          <CircleDot className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Project info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{project.name}</span>
          <Badge variant="outline" className={`text-[10px] ${tierConfig.color} ${tierConfig.borderColor}`}>
            {project.tier}
          </Badge>
        </div>
        {deployment ? (
          <div className="flex items-center gap-2 mt-0.5">
            <GitCommit className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {truncate(deployment.commitMessage, 60)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No deployment data</span>
        )}
      </div>

      {/* Time ago */}
      {deployment && (
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {timeAgo(deployment.createdAt)}
        </span>
      )}

      {/* Quick actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {project.url && (
          <a
            href={`https://${project.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title="Visit site"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        )}
        {deployment?.inspectorUrl && (
          <a
            href={deployment.inspectorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title="View in Vercel"
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        )}
        {project.repo && (
          <a
            href={`https://github.com/${project.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title="Open GitHub"
          >
            <Code className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, deployment }: { project: EcosystemProject; deployment?: DeploymentInfo | null }) {
  const tierConfig = TIER_CONFIG[project.tier];

  const statusConfig = {
    active: { icon: <Activity className="h-3.5 w-3.5 text-emerald-500" />, label: "Active" },
    development: { icon: <Code className="h-3.5 w-3.5 text-amber-500" />, label: "Dev" },
    maintenance: { icon: <Clock className="h-3.5 w-3.5 text-muted-foreground" />, label: "Maintenance" },
  };

  const status = statusConfig[project.status];

  return (
    <Card className={`${tierConfig.borderColor} hover:shadow-md transition-shadow`}>
      <CardContent className="pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-sm">{project.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {deployment?.state === "READY" && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
            {deployment?.state === "ERROR" && <XCircle className="h-3.5 w-3.5 text-red-500" />}
            {!deployment && status.icon}
          </div>
        </div>

        {/* Deploy info */}
        {deployment && (
          <div className="mb-3 p-2 rounded bg-muted/30 border">
            <div className="flex items-center gap-1.5">
              <GitCommit className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">
                {truncate(deployment.commitMessage, 45)}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">
              {timeAgo(deployment.createdAt)}
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[10px] ${tierConfig.color} ${tierConfig.borderColor}`}>
            {project.tier}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            Next {project.nextVersion}
          </Badge>
          {project.cronJobs > 0 && (
            <Badge variant="outline" className="text-[10px]">
              <Zap className="h-2.5 w-2.5 mr-0.5" />
              {project.cronJobs} crons
            </Badge>
          )}
          {project.stripeIntegrated && (
            <Badge variant="outline" className="text-[10px]">
              <CreditCard className="h-2.5 w-2.5 mr-0.5" />
              Stripe
            </Badge>
          )}
        </div>

        {/* Database + Actions */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Server className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{project.database}</span>
          </div>
          <div className="flex items-center gap-1">
            {project.url && (
              <a
                href={`https://${project.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-accent transition-colors"
                title="Visit site"
              >
                <Globe className="h-3.5 w-3.5 text-blue-500" />
              </a>
            )}
            {deployment?.inspectorUrl && (
              <a
                href={deployment.inspectorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-accent transition-colors"
                title="Vercel"
              >
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            )}
            {project.repo && (
              <a
                href={`https://github.com/${project.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-accent transition-colors"
                title="GitHub"
              >
                <Code className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EcosystemSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-80 bg-muted animate-pulse rounded-md" />
        <div className="h-5 w-96 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <div className="h-4 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-7 w-12 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
