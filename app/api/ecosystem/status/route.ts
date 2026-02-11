import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ECOSYSTEM_PROJECTS, ECOSYSTEM_DATABASES, getEcosystemSummary } from "@/config/ecosystem";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

// Cross-database connection config — add env vars to enable live queries
const CROSS_DB_CONFIG: Record<string, { urlEnv: string; keyEnv: string; tables: string[] }> = {
  "naulwwnzrznslvhhxfed": {
    urlEnv: "SUPABASE_TPC_URL",
    keyEnv: "SUPABASE_TPC_SERVICE_ROLE_KEY",
    tables: ["profiles"],
  },
  "mputexoycdvahgjbpfbi": {
    urlEnv: "SUPABASE_WORKFORCE_URL",
    keyEnv: "SUPABASE_WORKFORCE_SERVICE_ROLE_KEY",
    tables: ["students", "applications"],
  },
  "kvhtltaxrbwuhfcjhroz": {
    urlEnv: "SUPABASE_ACADEMY_URL",
    keyEnv: "SUPABASE_ACADEMY_SERVICE_ROLE_KEY",
    tables: ["enrollments"],
  },
};

/**
 * Fetch latest deployment for a project from Vercel API
 */
async function fetchVercelDeployment(
  projectId: string,
  teamId: string
): Promise<DeploymentInfo | null> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&teamId=${teamId}&limit=1&target=production`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const dep = data.deployments?.[0];
    if (!dep) return null;

    return {
      state: dep.state,
      createdAt: dep.created,
      commitMessage: dep.meta?.githubCommitMessage || dep.meta?.gitCommitMessage || "",
      commitSha: dep.meta?.githubCommitSha || dep.meta?.gitCommitSha || "",
      inspectorUrl: dep.inspectorUrl || "",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch user counts from a cross-database connection
 * Uses Supabase admin API for auth.users and client queries for public tables
 */
async function fetchCrossDbStats(dbId: string): Promise<CrossDbStats | null> {
  const config = CROSS_DB_CONFIG[dbId];
  if (!config) return null;

  const url = process.env[config.urlEnv];
  const key = process.env[config.keyEnv];
  if (!url || !key) return null;

  try {
    const client = createSupabaseClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const dbEntry = ECOSYSTEM_DATABASES.find((d) => d.id === dbId);

    // Get total auth users via admin API (service role key required)
    const { data: usersData } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
    const totalUsers = (usersData as { total?: number })?.total ?? usersData?.users?.length ?? 0;

    // Get counts for configured tables
    const extraStats: Record<string, number> = {};
    for (const table of config.tables) {
      const { count } = await client.from(table).select("id", { count: "exact", head: true });
      extraStats[table] = count ?? 0;
    }

    return {
      databaseName: dbEntry?.name ?? dbId,
      databaseId: dbId,
      totalUsers,
      extraStats: Object.keys(extraStats).length > 0 ? extraStats : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * GET /api/ecosystem/status
 * Returns live ecosystem stats from all available data sources
 */
export async function GET() {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin client for Brain AI queries
    const admin = createAdminClient();

    // Parallel: Brain AI stats + Vercel deployments + Cross-DB stats
    const activeProjects = ECOSYSTEM_PROJECTS.filter((p) => p.vercel);
    const crossDbIds = Object.keys(CROSS_DB_CONFIG);

    const [brainResults, ...rest] = await Promise.all([
      // Brain AI stats (always available)
      Promise.all([
        admin.from("profiles").select("id", { count: "exact", head: true }),
        admin.from("documents").select("id", { count: "exact", head: true }),
        admin.from("conversations").select("id", { count: "exact", head: true }),
        admin.from("agent_plans").select("id", { count: "exact", head: true }),
        admin.from("subscriptions").select("id, status", { count: "exact", head: false }).eq("status", "active"),
        admin.from("custom_skills").select("id", { count: "exact", head: true }),
      ]),
      // Vercel deployments (if VERCEL_TOKEN exists)
      ...activeProjects.map((p) =>
        fetchVercelDeployment(p.vercel!.projectId, p.vercel!.teamId)
      ),
      // Cross-database stats (if env vars exist)
      ...crossDbIds.map((dbId) => fetchCrossDbStats(dbId)),
    ]);

    // Parse Brain AI results
    const [profilesResult, documentsResult, conversationsResult, agentPlansResult, subscriptionsResult, skillsResult] =
      brainResults as Awaited<ReturnType<typeof admin.from>>[];

    const brainStats = {
      users: (profilesResult as { count: number | null }).count ?? 0,
      documents: (documentsResult as { count: number | null }).count ?? 0,
      conversations: (conversationsResult as { count: number | null }).count ?? 0,
      agentPlans: (agentPlansResult as { count: number | null }).count ?? 0,
      activeSubscriptions: (subscriptionsResult as { data: unknown[] | null }).data?.length ?? 0,
      customSkills: (skillsResult as { count: number | null }).count ?? 0,
    };

    // Parse Vercel deployment results
    const vercelResults = rest.slice(0, activeProjects.length) as (DeploymentInfo | null)[];
    const deployments: Record<string, DeploymentInfo | null> = {};
    activeProjects.forEach((p, i) => {
      deployments[p.id] = vercelResults[i];
    });

    // Parse cross-DB results
    const crossDbResults = rest.slice(activeProjects.length) as (CrossDbStats | null)[];
    const crossDbStats: CrossDbStats[] = crossDbResults.filter(Boolean) as CrossDbStats[];

    // Add Brain AI as a cross-DB stat
    crossDbStats.unshift({
      databaseName: "LDC Brain AI",
      databaseId: "hgxxxmtfmvguotkowxbu",
      totalUsers: brainStats.users,
      extraStats: {
        documents: brainStats.documents,
        conversations: brainStats.conversations,
        active_subs: brainStats.activeSubscriptions,
      },
    });

    const summary = getEcosystemSummary();

    // Version health analysis
    const versionAlerts = ECOSYSTEM_PROJECTS
      .filter((p) => p.status === "active")
      .reduce<Array<{ project: string; issue: string; severity: "warning" | "info" }>>((alerts, project) => {
        const majorVersion = parseInt(project.nextVersion.split(".")[0]);
        if (majorVersion < 16) {
          alerts.push({
            project: project.name,
            issue: `Next.js ${project.nextVersion} — upgrade to 16.x recommended`,
            severity: "warning",
          });
        }
        const supabaseMajor = project.supabaseVersion.split(".").map(Number);
        if (supabaseMajor[1] < 80) {
          alerts.push({
            project: project.name,
            issue: `Supabase ${project.supabaseVersion} — upgrade to 2.89+ recommended`,
            severity: "info",
          });
        }
        return alerts;
      }, []);

    // Compute ecosystem-wide totals
    const totalUsersAcrossAll = crossDbStats.reduce((sum, db) => sum + db.totalUsers, 0);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: { ...summary, totalUsersAcrossAll },
      brainStats,
      deployments,
      crossDbStats,
      projects: ECOSYSTEM_PROJECTS,
      databases: ECOSYSTEM_DATABASES,
      versionAlerts,
      liveData: {
        vercel: !!process.env.VERCEL_TOKEN,
        crossDbConnected: crossDbStats.map((d) => d.databaseName),
      },
    });
  } catch (error) {
    console.error("[Ecosystem Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ecosystem status" },
      { status: 500 }
    );
  }
}
