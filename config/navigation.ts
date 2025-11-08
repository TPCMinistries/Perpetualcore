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
 * Complete navigation configuration with adaptive complexity
 * Premium $15M navigation with collapsible sections and optimal information hierarchy
 */
export const NAVIGATION_CONFIG: NavigationSection[] = [
  // SECTION 1: PINNED - Essential daily features (always visible, never collapses)
  {
    section: "Pinned",
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

  // SECTION 2: WORKSPACE - Core productivity tools (always visible)
  {
    section: "Workspace",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    items: [
      {
        name: "Knowledge",
        href: "/dashboard/knowledge",
        icon: BookOpen,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          helpText: "Your AI's memory - upload documents for context and reference",
        },
      },
      {
        name: "Documents",
        href: "/dashboard/documents",
        icon: FileText,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          helpText: "Manage files - AI automatically learns from your documents",
        },
      },
      {
        name: "Tasks",
        href: "/dashboard/tasks",
        icon: CheckSquare,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          helpText: "AI-extracted tasks from conversations - track your work",
        },
      },
      {
        name: "Team Chat",
        href: "/dashboard/conversations",
        icon: MessageCircle,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Collaborate with your team - AI assists in conversations",
        },
      },
      {
        name: "Inbox",
        href: "/dashboard/inbox",
        icon: Inbox,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Unified inbox for communications and AI notifications",
        },
      },
    ],
  },

  // SECTION 3: COMMUNICATIONS - Collapsible for intermediate+ users
  {
    section: "Communications",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: false,
    visibleFor: ["intermediate", "advanced"],
    items: [
      {
        name: "Email",
        href: "/dashboard/email",
        icon: Mail,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "AI email assistant - draft, respond, and organize intelligently",
        },
      },
      {
        name: "Meetings",
        href: "/dashboard/calendar",
        icon: Calendar,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Meeting transcription, action item extraction, and intelligent briefings",
        },
      },
      {
        name: "Notifications",
        href: "/dashboard/notifications",
        icon: Bell,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Manage notifications and alerts in one place",
        },
      },
    ],
  },

  // SECTION 4: AGENTS & AUTOMATION - Collapsible advanced features
  {
    section: "Agents & Automation",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: true,
    visibleFor: ["intermediate", "advanced"],
    items: [
      {
        name: "Assistants",
        href: "/dashboard/assistants",
        icon: Sparkles,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Pre-configured AI assistants for specific tasks",
        },
      },
      {
        name: "Workflows",
        href: "/dashboard/workflows",
        icon: Zap,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "advanced",
          badge: "beta",
          helpText: "Automate repetitive tasks with custom workflows",
        },
      },
      {
        name: "AI Agents",
        href: "/dashboard/agents",
        icon: Bot,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "advanced",
          badge: "beta",
          helpText: "Autonomous AI agents that work independently",
        },
      },
      {
        name: "Scheduled Jobs",
        href: "/dashboard/scheduled-jobs",
        icon: Clock,
        adaptiveConfig: {
          visibleFor: ["advanced"],
          complexity: "advanced",
          helpText: "Schedule AI tasks to run automatically",
        },
      },
    ],
  },

  // SECTION 5: INSIGHTS - Analytics (always visible for intermediate+)
  {
    section: "Insights",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    visibleFor: ["intermediate", "advanced"],
    items: [
      {
        name: "Activity",
        href: "/dashboard/activity",
        icon: Activity,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Recent activity and AI interactions across the platform",
        },
      },
      {
        name: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Productivity insights and AI usage analytics",
        },
      },
      {
        name: "Usage",
        href: "/dashboard/usage",
        icon: Zap,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Monitor API usage, tokens, and billing",
        },
      },
    ],
  },

  // SECTION 6: SETTINGS & MORE - Configuration and support
  {
    section: "Settings & More",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    items: [
      {
        name: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          helpText: "Configure preferences, integrations, and account settings",
        },
      },
      {
        name: "Beta Codes",
        href: "/dashboard/beta-codes",
        icon: Ticket,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Generate and manage beta invite codes",
        },
      },
      {
        name: "Admin Panel",
        href: "/admin",
        icon: ShieldCheck,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Super admin dashboard - manage users, organizations, and system settings",
          badge: "pro",
        },
      },
      {
        name: "Team",
        href: "/dashboard/team",
        icon: Users,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Manage team members and access permissions",
        },
      },
      {
        name: "Help & Learning",
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
          visibleFor: ["intermediate", "advanced"],
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
