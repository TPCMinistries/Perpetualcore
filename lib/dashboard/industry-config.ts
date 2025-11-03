import {
  Scale,
  Heart,
  TrendingUp,
  Home,
  Palette,
  Calculator,
  Church,
  Briefcase,
  DollarSign,
  Server,
  User,
  BookOpen,
  Users,
  LucideIcon
} from "lucide-react";

export type IndustryType =
  | "law-firm"
  | "healthcare"
  | "sales"
  | "real-estate"
  | "agency"
  | "accounting"
  | "church"
  | "consulting"
  | "financial-advisor"
  | "it-services"
  | "non-profit"
  | "education"
  | "personal";

export interface IndustryConfig {
  key: IndustryType;
  name: string;
  icon: LucideIcon;
  headline: string;
  subheadline: string;
  primaryMetric: {
    label: string;
    icon: LucideIcon;
    color: string;
    description: string;
  };
  stats: {
    label: string;
    description: string;
    icon: LucideIcon;
  }[];
  quickActions: {
    label: string;
    description: string;
    href: string;
    icon: LucideIcon;
    color: string;
  }[];
  welcomeMessage: string;
}

export const INDUSTRY_CONFIGS: Record<IndustryType, IndustryConfig> = {
  "law-firm": {
    key: "law-firm",
    name: "Law Firm",
    icon: Scale,
    headline: "Your Firm's Institutional Brain",
    subheadline: "Preserving decades of legal expertise, accessible in seconds",
    primaryMetric: {
      label: "Attorney Hours Saved",
      icon: TrendingUp,
      color: "text-blue-600",
      description: "Time saved through instant precedent access"
    },
    stats: [
      {
        label: "Precedents Preserved",
        description: "Searchable legal documents",
        icon: Scale
      },
      {
        label: "Attorneys Onboarded",
        description: "With instant knowledge access",
        icon: User
      },
      {
        label: "Research Hours Saved",
        description: "This month",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Research Precedent",
        description: "Find similar cases instantly",
        href: "/dashboard/search",
        icon: Scale,
        color: "blue"
      },
      {
        label: "Draft Brief",
        description: "AI-assisted legal writing",
        href: "/dashboard/chat",
        icon: Briefcase,
        color: "purple"
      },
      {
        label: "Upload Case Files",
        description: "Add to firm knowledge",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Access your firm's collective legal wisdom. Every precedent, every strategy, every insight—instantly searchable."
  },

  "healthcare": {
    key: "healthcare",
    name: "Healthcare",
    icon: Heart,
    headline: "Your Practice's Clinical Knowledge",
    subheadline: "Preserving clinical expertise for better patient care",
    primaryMetric: {
      label: "Documentation Time Saved",
      icon: TrendingUp,
      color: "text-green-600",
      description: "Hours saved on clinical documentation"
    },
    stats: [
      {
        label: "Treatment Protocols",
        description: "Instantly accessible",
        icon: Heart
      },
      {
        label: "Patient Notes",
        description: "Organized and searchable",
        icon: User
      },
      {
        label: "Clinical Hours Saved",
        description: "This month",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Find Treatment Protocol",
        description: "Search clinical guidelines",
        href: "/dashboard/search",
        icon: Heart,
        color: "green"
      },
      {
        label: "Patient Documentation",
        description: "AI-assisted notes",
        href: "/dashboard/chat",
        icon: User,
        color: "blue"
      },
      {
        label: "Upload Clinical Data",
        description: "Add to knowledge base",
        href: "/dashboard/documents",
        icon: Server,
        color: "purple"
      }
    ],
    welcomeMessage: "Your practice's clinical wisdom at your fingertips. HIPAA-compliant and always available."
  },

  "sales": {
    key: "sales",
    name: "Sales Team",
    icon: TrendingUp,
    headline: "Your Team's Sales Intelligence",
    subheadline: "Every winning strategy, objection handler, and playbook—preserved forever",
    primaryMetric: {
      label: "Deals Closed Faster",
      icon: TrendingUp,
      color: "text-purple-600",
      description: "With instant access to winning strategies"
    },
    stats: [
      {
        label: "Playbooks Preserved",
        description: "From top performers",
        icon: TrendingUp
      },
      {
        label: "Reps Ramped",
        description: "With instant knowledge",
        icon: User
      },
      {
        label: "Win Rate Increase",
        description: "This quarter",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Handle Objection",
        description: "Find proven responses",
        href: "/dashboard/search",
        icon: TrendingUp,
        color: "purple"
      },
      {
        label: "Draft Proposal",
        description: "AI-powered templates",
        href: "/dashboard/chat",
        icon: Briefcase,
        color: "blue"
      },
      {
        label: "Upload Playbooks",
        description: "Preserve winning strategies",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Close more deals with your team's collective sales wisdom. Every top performer's strategy at your fingertips."
  },

  "real-estate": {
    key: "real-estate",
    name: "Real Estate",
    icon: Home,
    headline: "Your Brokerage's Market Intelligence",
    subheadline: "Local expertise and listing strategies preserved",
    primaryMetric: {
      label: "Listings Closed Faster",
      icon: Home,
      color: "text-orange-600",
      description: "With instant market insights"
    },
    stats: [
      {
        label: "Market Insights",
        description: "Neighborhood data preserved",
        icon: Home
      },
      {
        label: "Agents Trained",
        description: "With top performer tactics",
        icon: User
      },
      {
        label: "Commission Saved",
        description: "Through faster closes",
        icon: DollarSign
      }
    ],
    quickActions: [
      {
        label: "Market Analysis",
        description: "Neighborhood insights",
        href: "/dashboard/search",
        icon: Home,
        color: "orange"
      },
      {
        label: "Client Communication",
        description: "Draft professional emails",
        href: "/dashboard/chat",
        icon: User,
        color: "blue"
      },
      {
        label: "Upload Listings",
        description: "Build market knowledge",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Your local market expertise, accessible instantly. Close more listings with proven strategies."
  },

  "agency": {
    key: "agency",
    name: "Creative Agency",
    icon: Palette,
    headline: "Your Agency's Creative Intelligence",
    subheadline: "Campaign strategies and client briefs preserved",
    primaryMetric: {
      label: "Campaigns Delivered",
      icon: Palette,
      color: "text-pink-600",
      description: "Using preserved creative strategies"
    },
    stats: [
      {
        label: "Campaign Strategies",
        description: "Award-winning preserved",
        icon: Palette
      },
      {
        label: "Creatives Onboarded",
        description: "With instant access",
        icon: User
      },
      {
        label: "Client Retention",
        description: "With consistent quality",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Find Campaign Brief",
        description: "Search past work",
        href: "/dashboard/search",
        icon: Palette,
        color: "pink"
      },
      {
        label: "Generate Ideas",
        description: "AI creative partner",
        href: "/dashboard/chat",
        icon: Briefcase,
        color: "purple"
      },
      {
        label: "Upload Assets",
        description: "Build creative library",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Your agency's creative genius, always accessible. Every campaign, every winning idea preserved."
  },

  "accounting": {
    key: "accounting",
    name: "Accounting Firm",
    icon: Calculator,
    headline: "Your Firm's Tax & Accounting Expertise",
    subheadline: "Decades of tax strategies and client precedents preserved",
    primaryMetric: {
      label: "Tax Research Hours Saved",
      icon: Calculator,
      color: "text-emerald-600",
      description: "Through instant access to firm knowledge"
    },
    stats: [
      {
        label: "Tax Strategies",
        description: "From senior partners",
        icon: Calculator
      },
      {
        label: "CPAs Trained",
        description: "With instant expertise",
        icon: User
      },
      {
        label: "Client Positions",
        description: "Instantly searchable",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Tax Code Lookup",
        description: "Find relevant positions",
        href: "/dashboard/search",
        icon: Calculator,
        color: "emerald"
      },
      {
        label: "Client Communication",
        description: "Draft tax explanations",
        href: "/dashboard/chat",
        icon: User,
        color: "blue"
      },
      {
        label: "Upload Workpapers",
        description: "Preserve methodologies",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Your firm's tax expertise at your fingertips. Every strategy, every position, instantly accessible."
  },

  "church": {
    key: "church",
    name: "Church/Ministry",
    icon: Church,
    headline: "Your Ministry's Pastoral Wisdom",
    subheadline: "Preserving decades of spiritual leadership and church history",
    primaryMetric: {
      label: "Sermon Prep Time Saved",
      icon: Church,
      color: "text-indigo-600",
      description: "Through instant access to archives"
    },
    stats: [
      {
        label: "Sermons Archived",
        description: "Instantly searchable",
        icon: Church
      },
      {
        label: "Ministry Leaders",
        description: "With wisdom access",
        icon: User
      },
      {
        label: "Prayer Requests",
        description: "Never forgotten",
        icon: Heart
      }
    ],
    quickActions: [
      {
        label: "Sermon Research",
        description: "Biblical insights",
        href: "/dashboard/search",
        icon: Church,
        color: "indigo"
      },
      {
        label: "Prayer Management",
        description: "Track and follow up",
        href: "/dashboard/chat",
        icon: Heart,
        color: "purple"
      },
      {
        label: "Upload Messages",
        description: "Build sermon library",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Your church's spiritual wisdom preserved. Sermons, insights, and pastoral care knowledge always accessible."
  },

  "consulting": {
    key: "consulting",
    name: "Consulting Firm",
    icon: Briefcase,
    headline: "Your Firm's Consulting Expertise",
    subheadline: "Frameworks, methodologies, and client strategies preserved",
    primaryMetric: {
      label: "Client Engagements Won",
      icon: Briefcase,
      color: "text-violet-600",
      description: "Using preserved frameworks"
    },
    stats: [
      {
        label: "Frameworks Preserved",
        description: "From senior partners",
        icon: Briefcase
      },
      {
        label: "Consultants Ramped",
        description: "With instant access",
        icon: User
      },
      {
        label: "Win Rate Increase",
        description: "This quarter",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Find Framework",
        description: "Search methodologies",
        href: "/dashboard/search",
        icon: Briefcase,
        color: "violet"
      },
      {
        label: "Draft Proposal",
        description: "AI-powered templates",
        href: "/dashboard/chat",
        icon: TrendingUp,
        color: "blue"
      },
      {
        label: "Upload Deliverables",
        description: "Build firm IP",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Your firm's consulting wisdom at your fingertips. Every framework, every methodology, instantly accessible."
  },

  "financial-advisor": {
    key: "financial-advisor",
    name: "Financial Advisor",
    icon: DollarSign,
    headline: "Your Practice's Client Intelligence",
    subheadline: "Client relationships and investment strategies preserved",
    primaryMetric: {
      label: "Client Retention",
      icon: DollarSign,
      color: "text-cyan-600",
      description: "Through preserved relationship history"
    },
    stats: [
      {
        label: "Client Relationships",
        description: "Fully documented",
        icon: User
      },
      {
        label: "Investment Strategies",
        description: "Preserved and searchable",
        icon: DollarSign
      },
      {
        label: "AUM Growth",
        description: "Through better service",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Client History",
        description: "Full relationship context",
        href: "/dashboard/search",
        icon: User,
        color: "cyan"
      },
      {
        label: "Investment Analysis",
        description: "AI-powered insights",
        href: "/dashboard/chat",
        icon: DollarSign,
        color: "blue"
      },
      {
        label: "Upload Client Data",
        description: "Build knowledge base",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Your client relationships preserved. Complete history, preferences, and strategies at your fingertips."
  },

  "it-services": {
    key: "it-services",
    name: "IT Services/MSP",
    icon: Server,
    headline: "Your Team's Technical Knowledge",
    subheadline: "Troubleshooting playbooks and client configurations preserved",
    primaryMetric: {
      label: "Ticket Resolution Time",
      icon: Server,
      color: "text-sky-600",
      description: "Reduced through knowledge access"
    },
    stats: [
      {
        label: "Solutions Documented",
        description: "Instantly searchable",
        icon: Server
      },
      {
        label: "Techs Trained",
        description: "With expert knowledge",
        icon: User
      },
      {
        label: "Resolution Speed",
        description: "Increase this month",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Search Solutions",
        description: "Find fixes fast",
        href: "/dashboard/search",
        icon: Server,
        color: "sky"
      },
      {
        label: "Troubleshoot Issue",
        description: "AI technical assistant",
        href: "/dashboard/chat",
        icon: Briefcase,
        color: "blue"
      },
      {
        label: "Document Fix",
        description: "Build knowledge base",
        href: "/dashboard/documents",
        icon: TrendingUp,
        color: "green"
      }
    ],
    welcomeMessage: "Your team's technical expertise preserved. Every solution, every configuration, instantly accessible."
  },

  "non-profit": {
    key: "non-profit",
    name: "Non-Profit",
    icon: Users,
    headline: "Your Organization's Impact Intelligence",
    subheadline: "Grant strategies, donor relationships, and program knowledge preserved",
    primaryMetric: {
      label: "Grant Success Rate",
      icon: Heart,
      color: "text-rose-600",
      description: "Using preserved winning applications"
    },
    stats: [
      {
        label: "Grants Preserved",
        description: "Winning applications",
        icon: Heart
      },
      {
        label: "Staff Transitions",
        description: "Knowledge retained",
        icon: Users
      },
      {
        label: "Donor Relationships",
        description: "Fully documented",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Find Grant Template",
        description: "Search winning apps",
        href: "/dashboard/search",
        icon: Heart,
        color: "pink"
      },
      {
        label: "Donor Communication",
        description: "Draft thank you letters",
        href: "/dashboard/chat",
        icon: Users,
        color: "blue"
      },
      {
        label: "Upload Programs",
        description: "Document impact",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Your non-profit's institutional knowledge preserved. Every grant, every program strategy, every donor relationship—instantly accessible."
  },

  "education": {
    key: "education",
    name: "Education",
    icon: BookOpen,
    headline: "Your School's Teaching Excellence",
    subheadline: "Curriculum, lesson plans, and student insights preserved",
    primaryMetric: {
      label: "Teacher Prep Time Saved",
      icon: BookOpen,
      color: "text-amber-600",
      description: "Through shared lesson libraries"
    },
    stats: [
      {
        label: "Lesson Plans Preserved",
        description: "From master teachers",
        icon: BookOpen
      },
      {
        label: "Teachers Onboarded",
        description: "With instant resources",
        icon: User
      },
      {
        label: "Student Insights",
        description: "Tracked over time",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Find Lesson Plan",
        description: "Search curriculum",
        href: "/dashboard/search",
        icon: BookOpen,
        color: "orange"
      },
      {
        label: "Parent Communication",
        description: "Draft updates",
        href: "/dashboard/chat",
        icon: Users,
        color: "blue"
      },
      {
        label: "Upload Resources",
        description: "Build teaching library",
        href: "/dashboard/documents",
        icon: Server,
        color: "green"
      }
    ],
    welcomeMessage: "Your school's teaching excellence preserved. Best lesson plans, proven strategies, and student insights—always accessible."
  },

  "personal": {
    key: "personal",
    name: "Personal",
    icon: User,
    headline: "Your Personal Perpetual Core",
    subheadline: "Your knowledge, conversations, and insights—preserved forever",
    primaryMetric: {
      label: "Time Saved",
      icon: TrendingUp,
      color: "text-primary",
      description: "Through AI assistance"
    },
    stats: [
      {
        label: "Documents Organized",
        description: "Searchable library",
        icon: Server
      },
      {
        label: "Conversations Saved",
        description: "Never forgotten",
        icon: User
      },
      {
        label: "Insights Captured",
        description: "Always accessible",
        icon: TrendingUp
      }
    ],
    quickActions: [
      {
        label: "Ask Anything",
        description: "Your AI remembers everything",
        href: "/dashboard/chat",
        icon: User,
        color: "primary"
      },
      {
        label: "Search Knowledge",
        description: "Find anything instantly",
        href: "/dashboard/search",
        icon: Server,
        color: "blue"
      },
      {
        label: "Upload Documents",
        description: "Build your library",
        href: "/dashboard/documents",
        icon: TrendingUp,
        color: "green"
      }
    ],
    welcomeMessage: "Your personal AI assistant. Ask anything, upload anything—I remember everything."
  }
};

export function getIndustryConfig(industry?: string | null): IndustryConfig {
  if (!industry || !(industry in INDUSTRY_CONFIGS)) {
    return INDUSTRY_CONFIGS.personal;
  }
  return INDUSTRY_CONFIGS[industry as IndustryType];
}
