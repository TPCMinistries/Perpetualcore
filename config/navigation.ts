import {
  Home,
  MessageSquare,
  FileText,
  Calendar,
  Mail,
  Inbox,
  CheckSquare,
  Search,
  Bell,
  BarChart3,
  Zap,
  Bot,
  Clock,
  Sparkles,
  Activity,
  BookOpen,
  GraduationCap,
  Users,
  HelpCircle,
  Headphones,
  Rocket,
  Key,
  Webhook,
  Shield,
  ShieldCheck,
  Code,
  MessageCircle,
  Settings,
  DollarSign,
  Smartphone,
  Send,
  Ticket,
  Share2,
  Brain,
  FolderKanban,
  UsersRound,
  Radar,
} from "lucide-react";
import { UserExperienceLevel, AdaptiveNavConfig } from "@/types/user-experience";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  adaptiveConfig: AdaptiveNavConfig;
}

export interface NavigationSection {
  section: string;
  color: string;
  bgColor: string;
  items: NavigationItem[];
  /**
   * Entire section visible only for these levels
   * If undefined, section is always visible (items control their own visibility)
   */
  visibleFor?: UserExperienceLevel[];
  /**
   * Whether this section should be collapsible
   */
  collapsible?: boolean;
  /**
   * Default collapsed state
   */
  defaultCollapsed?: boolean;
}

/**
 * Task-based navigation - optimized for clarity and discoverability
 * Organized by user intent rather than technical categories
 */
export const NAVIGATION_CONFIG: NavigationSection[] = [
  // FAVORITES - No header, most-used features at top
  {
    section: "", // Empty = no header displayed
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Your personalized home - see overview, insights, and quick actions",
        },
      },
      {
        name: "AI Chat",
        href: "/dashboard/chat",
        icon: MessageSquare,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Talk to multiple AI models - auto-selects the best one for your task",
        },
      },
      {
        name: "Search",
        href: "/dashboard/search",
        icon: Search,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "AI-powered search across all your documents and conversations",
        },
      },
    ],
  },

  // WORK - Core productivity features (restructured with Projects & Teams first)
  {
    section: "Work",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    items: [
      {
        name: "Projects",
        href: "/dashboard/projects",
        icon: FolderKanban,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Project workspaces with Kanban boards, team files, chat, and milestones",
        },
      },
      {
        name: "Teams",
        href: "/dashboard/teams",
        icon: UsersRound,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Manage departments and project teams with context-aware AI",
        },
      },
      {
        name: "Library",
        href: "/dashboard/library",
        icon: BookOpen,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          helpText: "Unified document library with AI-powered organization across all your spaces",
        },
      },
      {
        name: "Tasks",
        href: "/dashboard/tasks",
        icon: CheckSquare,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Intelligent task management - global or project-scoped with AI extraction",
        },
      },
      {
        name: "Meetings",
        href: "/dashboard/calendar",
        icon: Calendar,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Meeting transcription, action item extraction, and intelligent briefings",
        },
      },
    ],
  },

  // AI TOOLS - Intelligent automation
  {
    section: "AI Tools",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: true,
    visibleFor: ["beginner", "intermediate", "advanced"],
    items: [
      {
        name: "Command Center",
        href: "/dashboard/command-center",
        icon: Radar,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          badge: "new",
          helpText: "Exception-based management - monitor system health and handle failures",
        },
      },
      {
        name: "Executive Suite",
        href: "/dashboard/assistants",
        icon: Users,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Build your AI executive team - 15 specialist advisors including CEO, CFO, Legal, HR, Sales, Marketing, Social Media, and more",
        },
      },
      {
        name: "AI Agents",
        href: "/dashboard/agents",
        icon: Bot,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Autonomous AI agents that work independently on complex tasks",
        },
      },
      {
        name: "Workflows",
        href: "/dashboard/workflows",
        icon: Zap,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Automate repetitive tasks with intelligent workflow automation",
        },
      },
    ],
  },

  // INSIGHTS - Analytics and monitoring (collapsible, collapsed by default)
  {
    section: "Insights",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: true,
    visibleFor: ["beginner", "intermediate", "advanced"],
    items: [
      {
        name: "Intelligence",
        href: "/dashboard/intelligence",
        icon: Brain,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "View insights, patterns, preferences, and AI-generated suggestions",
        },
      },
      {
        name: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Comprehensive analytics - productivity metrics and ROI tracking",
        },
      },
      {
        name: "Activity",
        href: "/dashboard/activity",
        icon: Activity,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Activity feed - real-time tracking of AI interactions and workflows",
        },
      },
      {
        name: "Usage",
        href: "/dashboard/usage",
        icon: Zap,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Monitor API usage, tokens, and billing",
        },
      },
    ],
  },

  // SETTINGS - Bottom of sidebar (collapsible, collapsed by default)
  {
    section: "Settings",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: true,
    items: [
      {
        name: "Preferences",
        href: "/dashboard/settings",
        icon: Settings,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          helpText: "Configure preferences, integrations, and account settings",
        },
      },
      {
        name: "Team",
        href: "/dashboard/team",
        icon: Users,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Manage team members and access permissions",
        },
      },
      {
        name: "Share & Invite",
        href: "/dashboard/share",
        icon: Share2,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Invite teammates, friends, or students to join your AI brain",
        },
      },
      {
        name: "Help",
        href: "/dashboard/help",
        icon: HelpCircle,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          helpText: "Browse FAQs, tutorials, and documentation",
        },
      },
      {
        name: "Support",
        href: "/dashboard/support",
        icon: Headphones,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Contact support team for personalized assistance",
        },
      },
    ],
  },

  // SECTION 7: DEVELOPER - Collapsible technical tools (advanced only)
  {
    section: "Developer",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: true,
    visibleFor: ["advanced"],
    items: [
      {
        name: "API Keys",
        href: "/dashboard/developer/api-keys",
        icon: Key,
        adaptiveConfig: {
          visibleFor: ["advanced"],
          complexity: "developer",
          helpText: "Generate API keys for programmatic access",
        },
      },
      {
        name: "API Docs",
        href: "/dashboard/developer/docs",
        icon: Code,
        adaptiveConfig: {
          visibleFor: ["advanced"],
          complexity: "developer",
          helpText: "Complete API documentation and integration guides",
        },
      },
      {
        name: "Webhooks",
        href: "/dashboard/developer/webhooks",
        icon: Webhook,
        adaptiveConfig: {
          visibleFor: ["advanced"],
          complexity: "developer",
          helpText: "Configure webhooks for real-time event notifications",
        },
      },
      {
        name: "Audit Logs",
        href: "/dashboard/audit-logs",
        icon: Shield,
        adaptiveConfig: {
          visibleFor: ["advanced"],
          complexity: "developer",
          helpText: "Security audit logs and action tracking",
        },
      },
      {
        name: "Changelog",
        href: "/dashboard/changelog",
        icon: Rocket,
        adaptiveConfig: {
          visibleFor: ["advanced"],
          complexity: "developer",
          helpText: "Latest features and platform improvements",
        },
      },
    ],
  },
];

/**
 * Get filtered navigation based on user experience level
 */
export function getFilteredNavigation(
  userLevel: UserExperienceLevel
): NavigationSection[] {
  return NAVIGATION_CONFIG.map((section) => {
    // Check if entire section should be hidden
    if (section.visibleFor && !section.visibleFor.includes(userLevel)) {
      return null;
    }

    // Filter items within the section
    const filteredItems = section.items.filter((item) =>
      item.adaptiveConfig.visibleFor.includes(userLevel)
    );

    // Only return section if it has visible items
    if (filteredItems.length === 0) {
      return null;
    }

    return {
      ...section,
      items: filteredItems,
    };
  }).filter(Boolean) as NavigationSection[];
}

/**
 * Count visible items per experience level
 */
export function getNavigationStats() {
  return {
    beginner: getFilteredNavigation("beginner").reduce(
      (count, section) => count + section.items.length,
      0
    ),
    intermediate: getFilteredNavigation("intermediate").reduce(
      (count, section) => count + section.items.length,
      0
    ),
    advanced: getFilteredNavigation("advanced").reduce(
      (count, section) => count + section.items.length,
      0
    ),
  };
}
