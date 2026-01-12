/**
 * User Experience Level Types
 * Controls feature visibility and UI complexity
 */

export type UserExperienceLevel = "beginner" | "intermediate" | "advanced";

/**
 * Dashboard Mode Types
 * Controls whether to show simple AI Employees view or full dashboard
 */
export type DashboardMode = "simple" | "full";

export const DASHBOARD_MODES: Record<
  DashboardMode,
  {
    label: string;
    description: string;
  }
> = {
  simple: {
    label: "Simple Mode",
    description: "AI Employees dashboard - clean, focused, task-oriented",
  },
  full: {
    label: "Full Mode",
    description: "Complete dashboard with all features and tools",
  },
};

export type FeatureComplexity = "essential" | "standard" | "advanced" | "developer";

export interface AdaptiveNavConfig {
  /**
   * Experience levels that can see this feature
   */
  visibleFor: UserExperienceLevel[];

  /**
   * Complexity classification
   */
  complexity: FeatureComplexity;

  /**
   * Whether this is a core feature (always visible)
   */
  isCore?: boolean;

  /**
   * Beta/Coming Soon badge
   */
  badge?: "beta" | "new" | "coming-soon" | "pro";

  /**
   * Tooltip for beginners
   */
  helpText?: string;
}

/**
 * Experience Level Definitions
 */
export const EXPERIENCE_LEVELS: Record<
  UserExperienceLevel,
  {
    label: string;
    description: string;
    icon: string;
    features: string[];
  }
> = {
  beginner: {
    label: "Beginner",
    description: "New to AI tools - show me the essentials",
    icon: "🌱",
    features: [
      "Simple, focused interface",
      "Guided tours and tooltips",
      "Only core features visible",
      "In-app help and tutorials",
    ],
  },
  intermediate: {
    label: "Intermediate",
    description: "Familiar with AI - I want more options",
    icon: "🚀",
    features: [
      "Balanced feature set",
      "Productivity tools visible",
      "Some advanced features",
      "Contextual help available",
    ],
  },
  advanced: {
    label: "Advanced",
    description: "Power user - show me everything",
    icon: "⚡",
    features: [
      "All features unlocked",
      "Developer tools visible",
      "Advanced automations",
      "Full customization",
    ],
  },
};

/**
 * Determine if a feature should be visible for a given experience level
 */
export function shouldShowFeature(
  config: AdaptiveNavConfig,
  userLevel: UserExperienceLevel
): boolean {
  // Core features always visible
  if (config.isCore) return true;

  // Check if user's level is in the allowed list
  return config.visibleFor.includes(userLevel);
}

/**
 * Get recommended experience level based on user activity
 */
export function getRecommendedLevel(metrics: {
  daysActive: number;
  featuresUsed: number;
  conversationsCount: number;
  documentsUploaded: number;
}): UserExperienceLevel {
  const {
 daysActive,
    featuresUsed,
    conversationsCount,
    documentsUploaded,
  } = metrics;

  // Score system
  let score = 0;

  if (daysActive > 7) score += 2;
  if (daysActive > 30) score += 2;

  if (featuresUsed > 5) score += 2;
  if (featuresUsed > 10) score += 2;

  if (conversationsCount > 10) score += 1;
  if (conversationsCount > 50) score += 2;

  if (documentsUploaded > 5) score += 1;
  if (documentsUploaded > 20) score += 2;

  // Classify
  if (score <= 3) return "beginner";
  if (score <= 7) return "intermediate";
  return "advanced";
}
