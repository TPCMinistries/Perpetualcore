export type MarketplaceStatus =
  | "live"
  | "private"
  | "pilot"
  | "build"
  | "invitation"
  | "engagement";

export type MarketplaceCategoryId =
  | "run-coordinate"
  | "find-win"
  | "know-decide"
  | "hire-develop"
  | "create-distribute";

export type MarketplaceItem = {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  description: string;
  status: MarketplaceStatus;
  href: string;
  external?: boolean;
  categoryIds: MarketplaceCategoryId[];
  capabilities: string[];
  buyer: string;
  delivery: "Self-serve" | "Private access" | "Assisted" | "Installed";
};

export const MARKETPLACE_CATEGORIES: ReadonlyArray<{
  id: MarketplaceCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
}> = [
  {
    id: "run-coordinate",
    label: "Run and coordinate",
    shortLabel: "Run",
    description:
      "Give leaders and teams a shared operating layer for priorities, projects, memory, and follow-through.",
    accent: "#26f2a8",
  },
  {
    id: "find-win",
    label: "Find and win",
    shortLabel: "Win",
    description:
      "Discover opportunities, qualify the right work, and move from signal to submission without losing rigor.",
    accent: "#f7b955",
  },
  {
    id: "know-decide",
    label: "Know and decide",
    shortLabel: "Know",
    description:
      "Turn authorized evidence, organizational knowledge, and external intelligence into inspectable decisions.",
    accent: "#6dd7ff",
  },
  {
    id: "hire-develop",
    label: "Hire and develop",
    shortLabel: "Develop",
    description:
      "Coordinate people journeys and convert approved evidence into human-reviewed development actions.",
    accent: "#b99cff",
  },
  {
    id: "create-distribute",
    label: "Create and distribute",
    shortLabel: "Create",
    description:
      "Move long-form ideas into reusable media systems and governed distribution workflows.",
    accent: "#ff8fba",
  },
] as const;

export const MARKETPLACE_ITEMS: ReadonlyArray<MarketplaceItem> = [
  {
    slug: "sage",
    name: "Sage",
    eyebrow: "Personal operating system",
    headline: "A context-aware partner for operators carrying more than one company.",
    description:
      "Sage holds approved context across voice, web, and messaging, then helps an operator think, plan, and coordinate without starting over every morning.",
    status: "live",
    href: "https://sage.perpetualcore.com",
    external: true,
    categoryIds: ["run-coordinate", "know-decide"],
    capabilities: ["Ambient context", "Voice", "Planning", "Company graph"],
    buyer: "Founders and multi-entity operators",
    delivery: "Private access",
  },
  {
    slug: "atelier",
    name: "Atelier",
    eyebrow: "Agent-augmented workspace",
    headline: "The place teams turn AI capability into repeatable flows.",
    description:
      "Projects hold Flows, and Flows coordinate specialized products and agents for staff, interns, partners, and clients.",
    status: "live",
    href: "https://atelier.perpetualcore.com",
    external: true,
    categoryIds: ["run-coordinate", "create-distribute"],
    capabilities: ["Projects", "Flows", "Team execution", "Client workspaces"],
    buyer: "Teams coordinating recurring knowledge work",
    delivery: "Assisted",
  },
  {
    slug: "atlas",
    name: "Atlas",
    eyebrow: "AI-native COO",
    headline: "Install an operating system across a fund-backed company.",
    description:
      "Atlas helps operating partners and leadership teams map the company, prioritize the first high-leverage workflow, and expand toward a governed operating layer.",
    status: "pilot",
    href: "/products/atlas",
    categoryIds: ["run-coordinate", "know-decide"],
    capabilities: ["Operating reviews", "Workflow mapping", "Portfolio visibility"],
    buyer: "Funds, operating partners, and portfolio-company leaders",
    delivery: "Installed",
  },
  {
    slug: "atlas-discovery",
    name: "Atlas Discovery",
    eyebrow: "Productized diagnostic",
    headline: "Find the right operating-system wedge before committing to an install.",
    description:
      "A focused diagnostic that maps operations, ranks AI opportunities, defines outcome evaluation, and produces a decision-ready install scope.",
    status: "engagement",
    href: "/products/atlas-discovery",
    categoryIds: ["run-coordinate", "find-win"],
    capabilities: ["Operational map", "Opportunity ranking", "Outcome scope"],
    buyer: "Operating partners and executive teams",
    delivery: "Installed",
  },
  {
    slug: "rfp-engine",
    name: "RFP Engine",
    eyebrow: "Opportunity and proposal system",
    headline: "Find the right RFP. Draft it in your voice. Ship it clean.",
    description:
      "Continuous discovery, fit-aware opportunity management, and structured drafting for teams that cannot afford to miss or mishandle the right solicitation.",
    status: "live",
    href: "https://rfp.perpetualcore.com",
    external: true,
    categoryIds: ["find-win"],
    capabilities: ["Discovery", "Matching", "Drafting", "Submission workflow"],
    buyer: "Capture teams, grant writers, and executive directors",
    delivery: "Self-serve",
  },
  {
    slug: "rfp-sentry",
    name: "RFP Sentry",
    eyebrow: "Bid intelligence",
    headline: "Qualify the bid and surface compliance risk before the writing starts.",
    description:
      "A fit and compliance gate for capture teams that want an honest bid/no-bid decision and earlier visibility into submission risk.",
    status: "build",
    href: "/products/rfp-sentry",
    categoryIds: ["find-win", "know-decide"],
    capabilities: ["Bid/no-bid", "Fit scoring", "Compliance flags"],
    buyer: "Capture managers and proposal teams",
    delivery: "Private access",
  },
  {
    slug: "sentinel",
    name: "Sentinel",
    eyebrow: "Diligence and intelligence",
    headline: "Evidence-backed diligence for consequential people and company decisions.",
    description:
      "A governed research surface for attorneys, investigators, journalists, and operators working beyond the limits of commodity background checks.",
    status: "live",
    href: "https://sentinel.perpetualcore.com",
    external: true,
    categoryIds: ["know-decide"],
    capabilities: ["Investigations", "Source trails", "Risk review", "Diligence"],
    buyer: "Legal, investigative, media, and operating teams",
    delivery: "Self-serve",
  },
  {
    slug: "vellum",
    name: "Vellum",
    eyebrow: "Institutional memory",
    headline: "Make the organization’s approved knowledge durable and queryable.",
    description:
      "Vellum connects calls, documents, voice notes, policies, and channels without pretending that every source belongs in one unrestricted store.",
    status: "build",
    href: "/products/vellum",
    categoryIds: ["run-coordinate", "know-decide"],
    capabilities: ["Knowledge", "Provenance", "Search", "Institutional memory"],
    buyer: "Executive directors, founders, and program leaders",
    delivery: "Private access",
  },
  {
    slug: "janice",
    name: "Janice",
    eyebrow: "People operations",
    headline: "Run hiring, onboarding, and multi-party people workflows in one lifecycle.",
    description:
      "Templated intake, signatures, per-person workspaces, and multi-tenant coordination for organizations where people operations are the operation.",
    status: "live",
    href: "https://janice.perpetualcore.com",
    external: true,
    categoryIds: ["hire-develop", "run-coordinate"],
    capabilities: ["Hiring", "Onboarding", "Intake", "People workspaces"],
    buyer: "Nonprofits, agencies, and people-heavy organizations",
    delivery: "Assisted",
  },
  {
    slug: "development-intelligence",
    name: "Development Intelligence",
    eyebrow: "Evidence-linked development",
    headline: "Turn authorized conversations into coaching people can inspect and trust.",
    description:
      "A governed agent system for meeting and interview analysis, exact evidence review, human-approved coaching actions, and observable progress over time.",
    status: "private",
    href: "/products/development-intelligence",
    categoryIds: ["hire-develop", "know-decide"],
    capabilities: ["Meeting analysis", "Evidence review", "Coaching", "Human approval"],
    buyer: "Workforce leaders, interviewers, and executive teams",
    delivery: "Private access",
  },
  {
    slug: "press",
    name: "Press",
    eyebrow: "Media production system",
    headline: "Turn a long-form archive into a governed, reusable media operation.",
    description:
      "Transcription, transcript-led editing, clip scoring, captioning, and voice workflows running as one installable production system.",
    status: "invitation",
    href: "/products/press",
    categoryIds: ["create-distribute"],
    capabilities: ["Transcription", "Clip scoring", "Voice", "Distribution"],
    buyer: "Operators, educators, and media-led brands",
    delivery: "Installed",
  },
] as const;

export const MARKETPLACE_STATUS_LABELS: Record<MarketplaceStatus, string> = {
  live: "Live",
  private: "Private release",
  pilot: "In pilot",
  build: "In build",
  invitation: "By invitation",
  engagement: "Engagement",
};
