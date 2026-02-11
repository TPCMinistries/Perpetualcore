"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  ExternalLink,
  Play,
  Eye,
  GitPullRequest,
  Bug,
  ChevronDown,
  ChevronUp,
  Radio,
  Terminal,
} from "lucide-react";

// ━━━ Types ━━━

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

// ━━━ Helpers ━━━

const AUTO_REFRESH_INTERVAL = 30; // seconds

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

function vercelDashboardUrl(project: EcosystemProject): string | null {
  if (!project.vercel) return null;
  return `https://vercel.com/${project.vercel.teamSlug}/${project.vercel.projectName}`;
}

function vercelDeploymentsUrl(project: EcosystemProject): string | null {
  const base = vercelDashboardUrl(project);
  return base ? `${base}/deployments` : null;
}

function vercelLogsUrl(project: EcosystemProject): string | null {
  const base = vercelDashboardUrl(project);
  return base ? `${base}/logs` : null;
}

function githubUrl(project: EcosystemProject): string | null {
  return project.repo ? `https://github.com/${project.repo}` : null;
}

function githubIssuesUrl(project: EcosystemProject): string | null {
  return project.repo ? `https://github.com/${project.repo}/issues` : null;
}

function githubPRsUrl(project: EcosystemProject): string | null {
  return project.repo ? `https://github.com/${project.repo}/pulls` : null;
}

function githubActionsUrl(project: EcosystemProject): string | null {
  return project.repo ? `https://github.com/${project.repo}/actions` : null;
}

// ━━━ Main Component ━━━

export function EcosystemDashboard() {
  const [data, setData] = useState<EcosystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_INTERVAL);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const countdownRef = useRef(AUTO_REFRESH_INTERVAL);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ecosystem/status");
      if (!res.ok) throw new Error("Failed to fetch ecosystem data");
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
      setError(null);
      countdownRef.current = AUTO_REFRESH_INTERVAL;
      setCountdown(AUTO_REFRESH_INTERVAL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        fetchData();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchData]);

  // Keyboard shortcut: R to refresh
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "r" && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement)) {
        fetchData();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fetchData]);

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
    <div className="space-y-6">
      {/* ━━━ War Room Header ━━━ */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">War Room</h1>
            <div className="flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-600">LIVE</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            {summary.totalProjects} projects &middot; {summary.totalDatabases} databases &middot; {summary.totalUsersAcrossAll.toLocaleString()} users
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live data indicators */}
          <div className="flex items-center gap-2">
            {liveData.vercel && (
              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">
                <Signal className="h-3 w-3 mr-1" /> Vercel
              </Badge>
            )}
            {liveData.crossDbConnected.length > 1 && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                <Database className="h-3 w-3 mr-1" /> {liveData.crossDbConnected.length} DBs
              </Badge>
            )}
          </div>
          {/* Auto-refresh toggle + countdown */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-colors ${
              autoRefresh ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
            }`}
            title={autoRefresh ? "Auto-refresh ON (click to pause)" : "Auto-refresh OFF (click to resume)"}
          >
            <Activity className={`h-3 w-3 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? `${countdown}s` : "Paused"}
          </button>
          {/* Manual refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-md border hover:bg-accent transition-colors disabled:opacity-50"
            title="Refresh now (R)"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ━━━ Pulse Cards ━━━ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Users className="h-5 w-5 text-sky-500" />} label="Total Users" value={summary.totalUsersAcrossAll} sublabel={`across ${liveData.crossDbConnected.length} DBs`} />
        <StatCard icon={<Boxes className="h-5 w-5 text-blue-500" />} label="Active" value={summary.activeProjects} sublabel={`of ${summary.totalProjects} projects`} />
        <StatCard icon={<Rocket className="h-5 w-5 text-emerald-500" />} label="Deploys" value={deployedCount} sublabel={errorCount > 0 ? `${errorCount} errors` : "all green"} alert={errorCount > 0} />
        <StatCard icon={<Database className="h-5 w-5 text-purple-500" />} label="Databases" value={summary.connectedDatabases} sublabel={`of ${summary.totalDatabases}`} />
        <StatCard icon={<Zap className="h-5 w-5 text-amber-500" />} label="Cron Jobs" value={summary.totalCronJobs} sublabel="scheduled" />
        <StatCard icon={<CreditCard className="h-5 w-5 text-emerald-500" />} label="Stripe" value={summary.stripeProjects} sublabel="integrated" />
      </div>

      {/* ━━━ Quick Actions Bar ━━━ */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-950/50 dark:to-blue-950/20 border-blue-100 dark:border-blue-900/30">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Quick Actions</span>
            </div>
            <div className="flex items-center gap-2">
              <QuickActionLink
                href="https://vercel.com/the-gdi"
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                label="Vercel (GDI)"
              />
              <QuickActionLink
                href="https://vercel.com/gdi-727dc440"
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                label="Vercel (Personal)"
              />
              <QuickActionLink
                href="https://github.com/TPCMinistries"
                icon={<Code className="h-3.5 w-3.5" />}
                label="GitHub Org"
              />
              <QuickActionLink
                href="https://supabase.com/dashboard/projects"
                icon={<Database className="h-3.5 w-3.5" />}
                label="Supabase"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ━━━ Operations Console — Active Projects ━━━ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg">Operations Console</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!liveData.vercel && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                  Add VERCEL_TOKEN for live deploy status
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {activeProjects.length} active
              </Badge>
            </div>
          </div>
          <CardDescription>Click any project row to expand actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeProjects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                deployment={deployments[project.id]}
                expanded={expandedProject === project.id}
                onToggle={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ━━━ Intelligence Panel ━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brain Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-500" />
                <CardTitle className="text-lg">Brain Intelligence</CardTitle>
              </div>
              <a
                href="https://perpetualcore.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Open Dashboard <ExternalLink className="h-3 w-3" />
              </a>
            </div>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Cross-Database Intel</CardTitle>
              </div>
              <a
                href="https://supabase.com/dashboard/projects"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                Supabase <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crossDbStats.map((db) => (
                <div key={db.databaseId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium">{db.databaseName}</p>
                      {db.extraStats && (
                        <p className="text-xs text-muted-foreground">
                          {Object.entries(db.extraStats).map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`).join(" · ")}
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
                    Add cross-DB env vars to see all database stats
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ━━━ Version Alerts ━━━ */}
      {versionAlerts.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Alerts</CardTitle>
              <Badge variant="outline" className="text-xs text-amber-600">{versionAlerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versionAlerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${alert.severity === "warning" ? "text-amber-500" : "text-blue-500"}`} />
                  <span className="font-medium text-sm">{alert.project}</span>
                  <span className="text-sm text-muted-foreground">{alert.issue}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ━━━ All Projects Grid ━━━ */}
      {(["CORE", "MAIN", "ANCILLARY"] as ProjectTier[]).map((tier) => {
        const tierProjects = projects.filter((p) => p.tier === tier);
        const config = TIER_CONFIG[tier];
        return (
          <div key={tier}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className={`text-lg font-semibold ${config.color}`}>{config.label}</h2>
              <Badge variant="outline" className={`${config.color} ${config.borderColor}`}>{tierProjects.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tierProjects.map((project) => (
                <ProjectCard key={project.id} project={project} deployment={deployments[project.id]} />
              ))}
            </div>
          </div>
        );
      })}

      {/* ━━━ Database Architecture ━━━ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-lg">Database Architecture</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {databases.map((db) => {
              const liveStats = crossDbStats.find((s) => s.databaseId === db.id);
              return (
                <div key={db.name} className={`p-4 rounded-lg border ${db.id ? "bg-card" : "bg-muted/30 opacity-60"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{db.name}</span>
                    <div className="flex items-center gap-1.5">
                      {db.hasPII && <Shield className="h-3.5 w-3.5 text-amber-500" title="Contains PII" />}
                      {db.id ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{db.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{db.projects} {db.projects === 1 ? "project" : "projects"}</Badge>
                    {liveStats && <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">{liveStats.totalUsers.toLocaleString()} users</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ━━━ Footer ━━━ */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pb-4">
        <div className="flex items-center gap-4">
          <span>Press <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">R</kbd> to refresh</span>
          <span>Auto-refresh: {autoRefresh ? `every ${AUTO_REFRESH_INTERVAL}s` : "paused"}</span>
        </div>
        {lastRefresh && <span>Last update: {lastRefresh.toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}

// ━━━ Sub-components ━━━

function QuickActionLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-white dark:bg-slate-900 hover:bg-accent text-xs font-medium transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}

function StatCard({ icon, label, value, sublabel, alert }: {
  icon: React.ReactNode; label: string; value: number; sublabel: string; alert?: boolean;
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

function BrainStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
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

/** Expandable project row in the Operations Console */
function ProjectRow({ project, deployment, expanded, onToggle }: {
  project: EcosystemProject; deployment: DeploymentInfo | null; expanded: boolean; onToggle: () => void;
}) {
  const tierConfig = TIER_CONFIG[project.tier];
  const vDash = vercelDashboardUrl(project);
  const vDeploys = vercelDeploymentsUrl(project);
  const vLogs = vercelLogsUrl(project);
  const gh = githubUrl(project);
  const ghIssues = githubIssuesUrl(project);
  const ghPRs = githubPRsUrl(project);
  const ghActions = githubActionsUrl(project);

  return (
    <div className={`rounded-lg border transition-all ${expanded ? "bg-muted/10 shadow-sm" : "hover:bg-muted/10"}`}>
      {/* Main row — clickable */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-3 text-left">
        {/* Status */}
        <div className="flex-shrink-0">
          {deployment ? (
            deployment.state === "READY" ? <CheckCircle className="h-5 w-5 text-emerald-500" /> :
            deployment.state === "ERROR" ? <XCircle className="h-5 w-5 text-red-500" /> :
            <CircleDot className="h-5 w-5 text-amber-500 animate-pulse" />
          ) : (
            <CircleDot className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{project.name}</span>
            <Badge variant="outline" className={`text-[10px] ${tierConfig.color} ${tierConfig.borderColor}`}>{project.tier}</Badge>
          </div>
          {deployment ? (
            <div className="flex items-center gap-2 mt-0.5">
              <GitCommit className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate">{truncate(deployment.commitMessage, 60)}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{project.description}</span>
          )}
        </div>

        {/* Time */}
        {deployment && (
          <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(deployment.createdAt)}</span>
        )}

        {/* Expand icon */}
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded action panel */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {/* Vercel actions */}
            {project.url && (
              <ActionButton href={`https://${project.url}`} icon={<Globe className="h-3.5 w-3.5" />} label="Visit Site" color="blue" />
            )}
            {vDash && (
              <ActionButton href={vDash} icon={<ArrowUpRight className="h-3.5 w-3.5" />} label="Vercel Dashboard" color="slate" />
            )}
            {vDeploys && (
              <ActionButton href={vDeploys} icon={<Rocket className="h-3.5 w-3.5" />} label="Deployments" color="emerald" />
            )}
            {vLogs && (
              <ActionButton href={vLogs} icon={<Eye className="h-3.5 w-3.5" />} label="Function Logs" color="purple" />
            )}

            {/* GitHub actions */}
            {gh && (
              <ActionButton href={gh} icon={<Code className="h-3.5 w-3.5" />} label="Repository" color="slate" />
            )}
            {ghIssues && (
              <ActionButton href={ghIssues} icon={<Bug className="h-3.5 w-3.5" />} label="Issues" color="amber" />
            )}
            {ghPRs && (
              <ActionButton href={ghPRs} icon={<GitPullRequest className="h-3.5 w-3.5" />} label="Pull Requests" color="blue" />
            )}
            {ghActions && (
              <ActionButton href={ghActions} icon={<Play className="h-3.5 w-3.5" />} label="CI/CD" color="emerald" />
            )}
          </div>

          {/* Project metadata */}
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t">
            <Badge variant="outline" className="text-[10px]">Next {project.nextVersion}</Badge>
            <Badge variant="outline" className="text-[10px]">Supabase {project.supabaseVersion}</Badge>
            <Badge variant="outline" className="text-[10px]"><Server className="h-2.5 w-2.5 mr-0.5" />{project.database}</Badge>
            {project.cronJobs > 0 && <Badge variant="outline" className="text-[10px]"><Zap className="h-2.5 w-2.5 mr-0.5" />{project.cronJobs} crons</Badge>}
            {project.stripeIntegrated && <Badge variant="outline" className="text-[10px]"><CreditCard className="h-2.5 w-2.5 mr-0.5" />Stripe</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ href, icon, label, color }: {
  href: string; icon: React.ReactNode; label: string; color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50",
    emerald: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50",
    purple: "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/50",
    amber: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/50",
    slate: "text-slate-700 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-950/50",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium transition-colors ${colorClasses[color] ?? colorClasses.slate}`}
    >
      {icon}
      {label}
    </a>
  );
}

function ProjectCard({ project, deployment }: { project: EcosystemProject; deployment?: DeploymentInfo | null }) {
  const tierConfig = TIER_CONFIG[project.tier];
  const vDash = vercelDashboardUrl(project);
  const gh = githubUrl(project);

  return (
    <Card className={`${tierConfig.borderColor} hover:shadow-md transition-shadow`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-sm">{project.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {deployment?.state === "READY" && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
            {deployment?.state === "ERROR" && <XCircle className="h-3.5 w-3.5 text-red-500" />}
            {!deployment && project.status === "active" && <Activity className="h-3.5 w-3.5 text-emerald-500" />}
            {!deployment && project.status === "development" && <Code className="h-3.5 w-3.5 text-amber-500" />}
          </div>
        </div>

        {deployment && (
          <div className="mb-3 p-2 rounded bg-muted/30 border">
            <div className="flex items-center gap-1.5">
              <GitCommit className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">{truncate(deployment.commitMessage, 45)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5 block">{timeAgo(deployment.createdAt)}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={`text-[10px] ${tierConfig.color} ${tierConfig.borderColor}`}>{project.tier}</Badge>
          <Badge variant="outline" className="text-[10px]">Next {project.nextVersion}</Badge>
          {project.cronJobs > 0 && <Badge variant="outline" className="text-[10px]"><Zap className="h-2.5 w-2.5 mr-0.5" />{project.cronJobs}</Badge>}
          {project.stripeIntegrated && <Badge variant="outline" className="text-[10px]"><CreditCard className="h-2.5 w-2.5 mr-0.5" /></Badge>}
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Server className="h-3 w-3" />
            <span className="truncate max-w-[100px]">{project.database}</span>
          </div>
          <div className="flex items-center gap-1">
            {project.url && (
              <a href={`https://${project.url}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent transition-colors" title="Visit site">
                <Globe className="h-3.5 w-3.5 text-blue-500" />
              </a>
            )}
            {vDash && (
              <a href={vDash} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent transition-colors" title="Vercel">
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            )}
            {gh && (
              <a href={gh} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-accent transition-colors" title="GitHub">
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
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-9 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-5 w-72 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}><CardContent className="pt-4 pb-4"><div className="h-4 w-16 bg-muted animate-pulse rounded mb-2" /><div className="h-7 w-12 bg-muted animate-pulse rounded mb-1" /><div className="h-3 w-20 bg-muted animate-pulse rounded" /></CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="py-4"><div className="h-10 bg-muted animate-pulse rounded" /></CardContent></Card>
      <Card><CardContent className="pt-6 space-y-2">{Array.from({ length: 7 }).map((_, i) => (<div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />))}</CardContent></Card>
    </div>
  );
}
