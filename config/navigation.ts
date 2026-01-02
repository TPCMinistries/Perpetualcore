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
  Contact,
  Lightbulb,
  Target,
  Church,
  Heart,
  PenSquare,
  Mic,
  MessagesSquare,
  // New icons for redesign
  LayoutDashboard,
  Workflow,
  Boxes,
  Link2,
  Plug,
  Database,
  Sheet,
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

  // CHAT - All chat options in one section
  {
    section: "Chat",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    items: [
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
        name: "Executive Suite",
        href: "/dashboard/assistants",
        icon: Users,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "15 specialist AI advisors - CEO, CFO, Legal, HR, Sales, Marketing, and more",
        },
      },
      {
        name: "Voice Chat",
        href: "/dashboard/chat?mode=voice",
        icon: Mic,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Hands-free voice conversations with AI",
        },
      },
      {
        name: "Chat History",
        href: "/dashboard/conversations",
        icon: MessagesSquare,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Browse and continue past conversations",
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
        name: "Ideas",
        href: "/dashboard/ideas",
        icon: Lightbulb,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Quick capture ideas, develop them, and track implementation",
        },
      },
      {
        name: "Content Studio",
        href: "/dashboard/content",
        icon: PenSquare,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Create, schedule, and publish content across all platforms",
        },
      },
      {
        name: "Expenses",
        href: "/dashboard/expenses",
        icon: DollarSign,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Track expenses from Telegram and manual entries with charts",
        },
      },
      {
        name: "Reminders",
        href: "/dashboard/reminders",
        icon: Bell,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "View and manage reminders created via Telegram or manually",
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
      {
        name: "Contacts",
        href: "/dashboard/contacts",
        icon: Contact,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Your network - track relationships, interactions, and connection opportunities",
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
          helpText: "Monitor system health and handle issues that need attention",
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

  // GROWTH - Sales and outreach tools
  {
    section: "Growth",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: false,
    visibleFor: ["beginner", "intermediate", "advanced"],
    items: [
      {
        name: "Leads",
        href: "/dashboard/leads",
        icon: Target,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Manage your sales pipeline and track potential customers",
        },
      },
      {
        name: "Outreach",
        href: "/dashboard/outreach",
        icon: Send,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Email sequences and automated outreach campaigns",
        },
      },
    ],
  },

  // MINISTRY - Church and coaching tools
  {
    section: "Ministry",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: false,
    visibleFor: ["beginner", "intermediate", "advanced"],
    items: [
      {
        name: "Ministry",
        href: "/dashboard/ministry",
        icon: Church,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Events, prayer requests, and discipleship tracking",
        },
      },
      {
        name: "Coaching",
        href: "/dashboard/coaching",
        icon: GraduationCap,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Client management and coaching session tracking",
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

// ============================================
// NEW STREAMLINED NAVIGATION (UX V2)
// ============================================

/**
 * Streamlined 5-section navigation structure
 * Designed for "living digitally" - intuitive, action-oriented
 */
export const NAVIGATION_CONFIG_V2: NavigationSection[] = [
  // CORE - Always visible, most essential features
  {
    section: "", // No header for core items
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    items: [
      {
        name: "Home",
        href: "/dashboard/home",
        icon: LayoutDashboard,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Your daily briefing - priorities, insights, and what needs attention",
        },
      },
      {
        name: "Inbox",
        href: "/dashboard/inbox",
        icon: Inbox,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Everything needing your attention - tasks, emails, notifications, bot results",
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
          helpText: "AI-powered search across all your documents, conversations, and data",
        },
      },
    ],
  },

  // CHAT - All chat options in one section
  {
    section: "Chat",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: false,
    items: [
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
        name: "Executive Suite",
        href: "/dashboard/assistants",
        icon: Users,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "15 specialist AI advisors - CEO, CFO, Legal, HR, Sales, Marketing, and more",
        },
      },
      {
        name: "Voice Chat",
        href: "/dashboard/chat?mode=voice",
        icon: Mic,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Hands-free voice conversations with AI",
        },
      },
      {
        name: "Chat History",
        href: "/dashboard/conversations",
        icon: MessagesSquare,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Browse and continue past conversations",
        },
      },
    ],
  },

  // WORK - Core productivity
  {
    section: "Work",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: false,
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
        name: "Tasks",
        href: "/dashboard/tasks",
        icon: CheckSquare,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Intelligent task management with AI extraction and prioritization",
        },
      },
      {
        name: "Documents",
        href: "/dashboard/library",
        icon: BookOpen,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          helpText: "Unified document library with AI-powered organization",
        },
      },
      {
        name: "Contacts",
        href: "/dashboard/contacts",
        icon: Contact,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "essential",
          isCore: true,
          helpText: "Your network - relationships, interactions, and opportunities",
        },
      },
      {
        name: "Calendar",
        href: "/dashboard/calendar",
        icon: Calendar,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Meetings, scheduling, and intelligent briefings",
        },
      },
      {
        name: "Ideas",
        href: "/dashboard/ideas",
        icon: Lightbulb,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Quick capture ideas, develop them, and track implementation",
        },
      },
      {
        name: "Content Studio",
        href: "/dashboard/content",
        icon: PenSquare,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Create, schedule, and publish content across all platforms",
        },
      },
      {
        name: "Expenses",
        href: "/dashboard/expenses",
        icon: DollarSign,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Track expenses from Telegram and manual entries with charts",
        },
      },
      {
        name: "Reminders",
        href: "/dashboard/reminders",
        icon: Bell,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "View and manage reminders created via Telegram or manually",
        },
      },
      {
        name: "Google Sheets",
        href: "/dashboard/integrations",
        icon: Sheet,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          badge: "new",
          helpText: "Import and export data to/from Google Sheets",
        },
      },
      {
        name: "Data Explorer",
        href: "/dashboard/data-explorer",
        icon: Database,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          badge: "new",
          helpText: "Browse and manage your database tables with a spreadsheet-like interface",
        },
      },
    ],
  },

  // AUTOMATE - All automation consolidated
  {
    section: "Automate",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: false,
    items: [
      {
        name: "Automation Hub",
        href: "/dashboard/automation",
        icon: Workflow,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          badge: "new",
          helpText: "All your automations in one place - bots, workflows, n8n, scheduled jobs",
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
        name: "Triggers",
        href: "/dashboard/automation/triggers",
        icon: Zap,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Webhooks, schedules, and event triggers for your automations",
        },
      },
    ],
  },

  // GROW - Sales and growth
  {
    section: "Grow",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    collapsible: true,
    defaultCollapsed: false,
    items: [
      {
        name: "Leads",
        href: "/dashboard/leads",
        icon: Target,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Sales pipeline and potential customer tracking",
        },
      },
      {
        name: "Outreach",
        href: "/dashboard/outreach",
        icon: Send,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Email sequences and automated outreach campaigns",
        },
      },
      {
        name: "Analytics",
        href: "/dashboard/analytics",
        icon: BarChart3,
        adaptiveConfig: {
          visibleFor: ["beginner", "intermediate", "advanced"],
          complexity: "standard",
          helpText: "Productivity metrics, ROI tracking, and insights",
        },
      },
    ],
  },

  // SETTINGS - Configuration and admin
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
          helpText: "Configure preferences, notifications, and account settings",
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
        name: "Integrations",
        href: "/dashboard/integrations",
        icon: Plug,
        adaptiveConfig: {
          visibleFor: ["intermediate", "advanced"],
          complexity: "standard",
          helpText: "Connect external services and apps",
        },
      },
      {
        name: "Developer",
        href: "/dashboard/developer",
        icon: Code,
        adaptiveConfig: {
          visibleFor: ["advanced"],
          complexity: "developer",
          helpText: "API keys, webhooks, and developer tools",
        },
      },
    ],
  },
];

/**
 * Get filtered navigation V2 based on user experience level
 */
export function getFilteredNavigationV2(
  userLevel: UserExperienceLevel
): NavigationSection[] {
  return NAVIGATION_CONFIG_V2.map((section) => {
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
