/**
 * Lorenzo Ecosystem — Project Registry
 * Static configuration for all 13 projects in the ecosystem
 * Used by the Ecosystem Dashboard at /dashboard/ecosystem
 */

export type ProjectTier = "CORE" | "MAIN" | "ANCILLARY";

export interface VercelProjectConfig {
  projectId: string;
  teamId: string;
  teamSlug: string;
  projectName: string; // Vercel project name for URLs
}

export interface EcosystemProject {
  id: string;
  name: string;
  description: string;
  tier: ProjectTier;
  url?: string;
  repo?: string;
  database: string;
  databaseId: string;
  nextVersion: string;
  supabaseVersion: string;
  stripeIntegrated: boolean;
  cronJobs: number;
  status: "active" | "development" | "maintenance";
  vercel?: VercelProjectConfig;
}

export const ECOSYSTEM_PROJECTS: EcosystemProject[] = [
  // ━━━ CORE ━━━
  {
    id: "perpetual-core",
    name: "Perpetual Core",
    description: "AI Operating System — the brain of the ecosystem",
    tier: "CORE",
    url: "perpetualcore.com",
    repo: "TPCMinistries/ai-os-platform",
    database: "LDC Brain AI",
    databaseId: "hgxxxmtfmvguotkowxbu",
    nextVersion: "14.2.33",
    supabaseVersion: "2.75.1",
    stripeIntegrated: true,
    cronJobs: 11,
    status: "active",
    vercel: { projectId: "prj_x43EVdICsTFvzabfeqvMbY345s6Z", teamId: "team_aqtYqMLkpMhGBxJ0oiBUxDW6", teamSlug: "gdi-727dc440", projectName: "ai-os-platform" },
  },
  {
    id: "uplift-ops",
    name: "Uplift Ops",
    description: "Intern Command Center",
    tier: "CORE",
    repo: "TPCMinistries/uplift-ops",
    database: "Uplift Opps",
    databaseId: "fbgmkqpxaaxbndhdbpzt",
    nextVersion: "16.1.4",
    supabaseVersion: "2.91.0",
    stripeIntegrated: false,
    cronJobs: 0,
    status: "active",
    vercel: { projectId: "prj_AFlH72y5JKqg72K8BAED9qE3KvTN", teamId: "team_QC77u3MLDVxFLID7hCuF8EOy", teamSlug: "the-gdi", projectName: "uplift-ops" },
  },

  // ━━━ MAIN ━━━
  {
    id: "iha-academy",
    name: "IHA AI Academy",
    description: "AI education platform — 5 modules, certificates, AI companion",
    tier: "MAIN",
    url: "academy.iha.org",
    repo: "TPCMinistries/iha-academy",
    database: "IHA Academy",
    databaseId: "kvhtltaxrbwuhfcjhroz",
    nextVersion: "16.1.6",
    supabaseVersion: "2.95.3",
    stripeIntegrated: true,
    cronJobs: 3,
    status: "active",
    vercel: { projectId: "prj_qRt3DR3ZCPmbfpepaZon4A8cI1qr", teamId: "team_QC77u3MLDVxFLID7hCuF8EOy", teamSlug: "the-gdi", projectName: "iha-academy" },
  },
  {
    id: "uplift-workforce",
    name: "Uplift Medical Workforce",
    description: "DYCD Healthcare training — student PII protected",
    tier: "MAIN",
    url: "workforce.upliftcommunities.org",
    repo: "TPCMinistries/uplift-medical-workforce",
    database: "Uplift-KBCC-Workforce",
    databaseId: "mputexoycdvahgjbpfbi",
    nextVersion: "16.0.8",
    supabaseVersion: "2.84.0",
    stripeIntegrated: false,
    cronJobs: 13,
    status: "active",
    vercel: { projectId: "prj_3jtWUChn1M8ujCjkQbVvC9Usq7ZW", teamId: "team_QC77u3MLDVxFLID7hCuF8EOy", teamSlug: "the-gdi", projectName: "uplift-medical-workforce" },
  },
  {
    id: "lorenzodc-site",
    name: "Lorenzo DC",
    description: "Personal brand — coaching, speaking, consulting",
    tier: "MAIN",
    url: "lorenzodc.com",
    repo: "TPCMinistries/lorenzodc-personal-site",
    database: "LDC Brain AI",
    databaseId: "hgxxxmtfmvguotkowxbu",
    nextVersion: "16.1.0",
    supabaseVersion: "2.95.0",
    stripeIntegrated: true,
    cronJobs: 1,
    status: "active",
    vercel: { projectId: "prj_P5tssdYVoHH5CxFZSpOJB3fEHYGY", teamId: "team_aqtYqMLkpMhGBxJ0oiBUxDW6", teamSlug: "gdi-727dc440", projectName: "lorenzodc-personal-site" },
  },
  {
    id: "uplift-communities",
    name: "Uplift Communities 2026",
    description: "Organization website",
    tier: "MAIN",
    repo: "TPCMinistries/uplift-communities-2026",
    database: "LDC Brain AI",
    databaseId: "hgxxxmtfmvguotkowxbu",
    nextVersion: "16.1.2",
    supabaseVersion: "2.89.0",
    stripeIntegrated: false,
    cronJobs: 0,
    status: "development",
  },
  {
    id: "hedge-fund",
    name: "AI Hedge Fund Engine",
    description: "Trading automation — financial data",
    tier: "MAIN",
    repo: "TPCMinistries/ai-hedge-fund-engine",
    database: "Hedge Fund",
    databaseId: "",
    nextVersion: "16.1.1",
    supabaseVersion: "2.39.0",
    stripeIntegrated: false,
    cronJobs: 0,
    status: "development",
  },
  {
    id: "tmwyb",
    name: "TMWYB",
    description: "Emotional support app — sensitive data",
    tier: "MAIN",
    repo: "TPCMinistries/tmwyb",
    database: "TMWYB",
    databaseId: "",
    nextVersion: "15.5.0",
    supabaseVersion: "2.56.1",
    stripeIntegrated: true,
    cronJobs: 0,
    status: "development",
  },

  // ━━━ ANCILLARY ━━━
  {
    id: "tpc-ministries",
    name: "TPC Ministries",
    description: "Ministry platform — CMS, media, members",
    tier: "ANCILLARY",
    url: "tpcministries.org",
    repo: "TPCMinistries/tpc-ministries-platform",
    database: "TPC Ministries",
    databaseId: "naulwwnzrznslvhhxfed",
    nextVersion: "14.2.33",
    supabaseVersion: "2.58.0",
    stripeIntegrated: true,
    cronJobs: 0,
    status: "active",
    vercel: { projectId: "prj_ooDSG4LKzETByzRj4NNo3gCs2O4a", teamId: "team_QC77u3MLDVxFLID7hCuF8EOy", teamSlug: "the-gdi", projectName: "tpc-ministries-platform" },
  },
  {
    id: "streams-of-grace",
    name: "Streams of Grace",
    description: "Faith PWA — launching Feb 16",
    tier: "ANCILLARY",
    url: "streamsofgrace.app",
    repo: "TPCMinistries/streams-of-grace",
    database: "TPC Ministries",
    databaseId: "naulwwnzrznslvhhxfed",
    nextVersion: "16.1.6",
    supabaseVersion: "2.89.0",
    stripeIntegrated: true,
    cronJobs: 3,
    status: "active",
    vercel: { projectId: "prj_qFxDjviDHruNrMqHwaqHXdRr8CDx", teamId: "team_aqtYqMLkpMhGBxJ0oiBUxDW6", teamSlug: "gdi-727dc440", projectName: "streams-of-grace" },
  },
  {
    id: "boardroom-prayer",
    name: "Boardroom Prayer Room",
    description: "Podcast platform",
    tier: "ANCILLARY",
    repo: "TPCMinistries/boardroom-prayer-room",
    database: "LDC Brain AI",
    databaseId: "hgxxxmtfmvguotkowxbu",
    nextVersion: "16.1.1",
    supabaseVersion: "2.89.0",
    stripeIntegrated: false,
    cronJobs: 0,
    status: "development",
  },
  {
    id: "iha-website",
    name: "IHA Website",
    description: "Nonprofit site — Institute for Human Advancement",
    tier: "ANCILLARY",
    url: "iha.org",
    repo: "TPCMinistries/iha-website",
    database: "LDC Brain AI",
    databaseId: "hgxxxmtfmvguotkowxbu",
    nextVersion: "16.1.1",
    supabaseVersion: "2.89.0",
    stripeIntegrated: true,
    cronJobs: 0,
    status: "development",
  },
  {
    id: "ai-media-empire",
    name: "AI Media Empire",
    description: "Media platform",
    tier: "ANCILLARY",
    repo: "TPCMinistries/the-ai-media-empire-ldc-aaa",
    database: "LDC Brain AI",
    databaseId: "hgxxxmtfmvguotkowxbu",
    nextVersion: "16.1.1",
    supabaseVersion: "2.89.0",
    stripeIntegrated: false,
    cronJobs: 0,
    status: "development",
  },
];

/** Tier colors and labels */
export const TIER_CONFIG: Record<ProjectTier, { label: string; color: string; bgColor: string; borderColor: string }> = {
  CORE: {
    label: "CORE",
    color: "text-red-700 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
  MAIN: {
    label: "MAIN",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  ANCILLARY: {
    label: "ANCILLARY",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
};

/** Database architecture */
export const ECOSYSTEM_DATABASES = [
  { name: "LDC Brain AI", id: "hgxxxmtfmvguotkowxbu", projects: 7, hasPII: false, description: "Shared hub — internal only" },
  { name: "Uplift Opps", id: "fbgmkqpxaaxbndhdbpzt", projects: 1, hasPII: true, description: "Staff/interns" },
  { name: "Uplift-KBCC-Workforce", id: "mputexoycdvahgjbpfbi", projects: 1, hasPII: true, description: "Student PII (DYCD)" },
  { name: "TPC Ministries", id: "naulwwnzrznslvhhxfed", projects: 2, hasPII: true, description: "Church members" },
  { name: "IHA Academy", id: "kvhtltaxrbwuhfcjhroz", projects: 1, hasPII: true, description: "Student records" },
  { name: "TMWYB", id: "", projects: 1, hasPII: true, description: "Emotional data (not connected)" },
  { name: "Hedge Fund", id: "", projects: 1, hasPII: true, description: "Financial data (not connected)" },
];

/** Ecosystem-wide stats */
export function getEcosystemSummary() {
  const projects = ECOSYSTEM_PROJECTS;
  return {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === "active").length,
    totalCronJobs: projects.reduce((sum, p) => sum + p.cronJobs, 0),
    totalDatabases: ECOSYSTEM_DATABASES.length,
    connectedDatabases: ECOSYSTEM_DATABASES.filter(d => d.id).length,
    stripeProjects: projects.filter(p => p.stripeIntegrated).length,
    tiers: {
      CORE: projects.filter(p => p.tier === "CORE").length,
      MAIN: projects.filter(p => p.tier === "MAIN").length,
      ANCILLARY: projects.filter(p => p.tier === "ANCILLARY").length,
    },
  };
}
