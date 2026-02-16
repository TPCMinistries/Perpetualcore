/**
 * Proactive Behavior Templates
 *
 * User-configurable templates for common proactive behaviors.
 * Each template defines defaults for schedule, config, and delivery
 * that users can customize when activating.
 */

import { BehaviorType, ScheduledBehavior } from "../inbox/types";
import { createRecurringBehavior } from "../inbox/scheduler";

/**
 * Template definition for a proactive behavior.
 */
export interface BehaviorTemplate {
  /** Unique template identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this behavior does */
  description: string;
  /** The behavior type (determines processing logic) */
  behavior_type: BehaviorType;
  /** Default cron schedule */
  default_schedule: string;
  /** Human-readable schedule description */
  schedule_description: string;
  /** Schema for user-configurable options */
  config_schema: Record<string, ConfigFieldSchema>;
  /** Default configuration values */
  default_config: Record<string, unknown>;
  /** Minimum plan required (null = available on free) */
  min_plan: string | null;
}

/** Schema for a single config field */
export interface ConfigFieldSchema {
  type: "select" | "boolean" | "number" | "text";
  label: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  default?: unknown;
}

/**
 * Available proactive behavior templates.
 *
 * Users can activate these from the settings page.
 * Each template can be customized with schedule and config overrides.
 */
export const PROACTIVE_BEHAVIOR_TEMPLATES: Record<string, BehaviorTemplate> = {
  morning_briefing: {
    id: "morning_briefing",
    name: "Morning Briefing",
    description:
      "Daily summary of your calendar, tasks, and important emails delivered to your preferred channel.",
    behavior_type: "morning_briefing",
    default_schedule: "0 8 * * 1-5",
    schedule_description: "Weekdays at 8:00 AM",
    config_schema: {
      delivery_channel: {
        type: "select",
        label: "Delivery Channel",
        description: "Where to receive your briefing",
        options: [
          { value: "telegram", label: "Telegram" },
          { value: "email", label: "Email" },
          { value: "in_app", label: "In-App" },
        ],
      },
      include_calendar: {
        type: "boolean",
        label: "Include Calendar",
        description: "Show today's events and meetings",
      },
      include_tasks: {
        type: "boolean",
        label: "Include Tasks",
        description: "Show overdue and due-today tasks",
      },
      include_emails: {
        type: "boolean",
        label: "Include Emails",
        description: "Show important unread emails",
      },
    },
    default_config: {
      delivery_channel: "telegram",
      include_calendar: true,
      include_tasks: true,
      include_emails: true,
    },
    min_plan: "starter",
  },

  email_digest: {
    id: "email_digest",
    name: "Email Digest",
    description:
      "Periodic summary of important emails, filtered by importance level.",
    behavior_type: "email_summary",
    default_schedule: "0 */4 * * *",
    schedule_description: "Every 4 hours",
    config_schema: {
      delivery_channel: {
        type: "select",
        label: "Delivery Channel",
        options: [
          { value: "telegram", label: "Telegram" },
          { value: "email", label: "Email" },
          { value: "in_app", label: "In-App" },
        ],
      },
      min_importance: {
        type: "select",
        label: "Minimum Importance",
        description: "Only include emails at or above this importance level",
        options: [
          { value: "low", label: "Low (all emails)" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High (important only)" },
        ],
      },
    },
    default_config: {
      delivery_channel: "telegram",
      min_importance: "medium",
    },
    min_plan: "starter",
  },

  follow_up_check: {
    id: "follow_up_check",
    name: "Follow-up Reminder",
    description:
      "Check for contacts you haven't followed up with and send reminders.",
    behavior_type: "follow_up_reminder",
    default_schedule: "0 9 * * 1-5",
    schedule_description: "Weekdays at 9:00 AM",
    config_schema: {
      delivery_channel: {
        type: "select",
        label: "Delivery Channel",
        options: [
          { value: "telegram", label: "Telegram" },
          { value: "email", label: "Email" },
          { value: "in_app", label: "In-App" },
        ],
      },
      days_overdue: {
        type: "number",
        label: "Days Overdue Threshold",
        description: "Remind when follow-up is overdue by this many days",
        min: 1,
        max: 30,
      },
    },
    default_config: {
      delivery_channel: "telegram",
      days_overdue: 3,
    },
    min_plan: "starter",
  },

  daily_digest: {
    id: "daily_digest",
    name: "Daily Digest",
    description:
      "End-of-day summary of everything that happened — completions, updates, and insights.",
    behavior_type: "daily_digest",
    default_schedule: "0 18 * * 1-5",
    schedule_description: "Weekdays at 6:00 PM",
    config_schema: {
      delivery_channel: {
        type: "select",
        label: "Delivery Channel",
        options: [
          { value: "telegram", label: "Telegram" },
          { value: "email", label: "Email" },
          { value: "in_app", label: "In-App" },
        ],
      },
    },
    default_config: {
      delivery_channel: "in_app",
    },
    min_plan: null, // Available on free plan
  },

  weekly_report: {
    id: "weekly_report",
    name: "Weekly Report",
    description:
      "Weekly summary of activity, metrics, and AI-generated insights delivered Friday afternoon.",
    behavior_type: "weekly_report",
    default_schedule: "0 17 * * 5",
    schedule_description: "Fridays at 5:00 PM",
    config_schema: {
      delivery_channel: {
        type: "select",
        label: "Delivery Channel",
        options: [
          { value: "email", label: "Email" },
          { value: "telegram", label: "Telegram" },
          { value: "in_app", label: "In-App" },
        ],
      },
    },
    default_config: {
      delivery_channel: "email",
    },
    min_plan: "pro",
  },
};

/** Plan hierarchy for checking minimum plan access */
const PLAN_HIERARCHY: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  team: 3,
  business: 4,
  enterprise: 5,
};

/**
 * Get available behavior templates filtered by user's plan.
 *
 * @param userPlan - The user's current plan type
 * @returns Array of available templates
 */
export function getAvailableTemplates(
  userPlan: string = "free"
): BehaviorTemplate[] {
  const userLevel = PLAN_HIERARCHY[userPlan] ?? 0;

  return Object.values(PROACTIVE_BEHAVIOR_TEMPLATES).filter((template) => {
    if (!template.min_plan) return true;
    const requiredLevel = PLAN_HIERARCHY[template.min_plan] ?? 0;
    return userLevel >= requiredLevel;
  });
}

/**
 * Get all templates (including those above the user's plan, marked as locked).
 *
 * @param userPlan - The user's current plan type
 * @returns Array of templates with `locked` flag
 */
export function getAllTemplatesWithAccess(
  userPlan: string = "free"
): Array<BehaviorTemplate & { locked: boolean }> {
  const userLevel = PLAN_HIERARCHY[userPlan] ?? 0;

  return Object.values(PROACTIVE_BEHAVIOR_TEMPLATES).map((template) => {
    const requiredLevel = template.min_plan
      ? PLAN_HIERARCHY[template.min_plan] ?? 0
      : 0;
    return {
      ...template,
      locked: userLevel < requiredLevel,
    };
  });
}

/**
 * Instantiate a proactive behavior from a template for a specific user.
 *
 * @param userId - The user who is activating this behavior
 * @param templateId - The template to instantiate
 * @param configOverrides - Optional config values to override defaults
 * @param scheduleOverride - Optional custom cron schedule
 * @returns The created ScheduledBehavior
 */
export async function instantiateBehavior(
  userId: string,
  templateId: string,
  configOverrides?: Record<string, unknown>,
  scheduleOverride?: string
): Promise<ScheduledBehavior> {
  const template = PROACTIVE_BEHAVIOR_TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Unknown behavior template: ${templateId}`);
  }

  const config = {
    ...template.default_config,
    ...(configOverrides || {}),
    template_id: templateId,
  };

  return createRecurringBehavior(userId, {
    name: template.name,
    description: template.description,
    behavior_type: template.behavior_type,
    schedule: scheduleOverride || template.default_schedule,
    config,
    is_active: true,
  });
}
