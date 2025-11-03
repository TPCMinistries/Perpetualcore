"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { CoachingSuggestion } from "@/components/ai-coach/SmartCoachingCard";

/**
 * Smart Coaching Hook - Context-aware coaching suggestions
 *
 * This hook analyzes user behavior, current page context, and usage patterns
 * to provide intelligent, proactive coaching suggestions.
 *
 * Features:
 * - Context-aware: Knows what page user is on
 * - Pattern detection: Recognizes workflow opportunities
 * - Proactive: Suggests next steps before users ask
 * - Adaptive: Learns from user interactions
 */

interface CoachingContext {
  currentPage: string;
  userLevel?: "beginner" | "intermediate" | "advanced";
  completedActions?: string[];
  timeOnPage?: number;
}

export function useSmartCoaching(context?: CoachingContext) {
  const pathname = usePathname();
  const [suggestions, setSuggestions] = useState<CoachingSuggestion[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    // Generate context-aware suggestions based on current page
    const newSuggestions = generateSuggestions({
      currentPage: pathname,
      ...context,
    });

    // Filter out dismissed suggestions
    const filteredSuggestions = newSuggestions.filter(
      (s) => !dismissedIds.includes(s.id)
    );

    setSuggestions(filteredSuggestions);
  }, [pathname, context, dismissedIds]);

  const dismissSuggestion = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);

    // Persist to localStorage
    try {
      localStorage.setItem("dismissed-suggestions", JSON.stringify([...dismissedIds, id]));
    } catch (error) {
      console.error("Failed to save dismissed suggestions:", error);
    }
  };

  const completeSuggestion = (id: string) => {
    // Mark as completed and track progress
    dismissSuggestion(id);

    // Track completion for analytics
    try {
      const completed = JSON.parse(localStorage.getItem("completed-suggestions") || "[]");
      localStorage.setItem("completed-suggestions", JSON.stringify([...completed, { id, timestamp: new Date().toISOString() }]));
    } catch (error) {
      console.error("Failed to save completion:", error);
    }
  };

  return {
    suggestions,
    dismissSuggestion,
    completeSuggestion,
  };
}

/**
 * Generate context-aware suggestions based on user's current state
 */
function generateSuggestions(context: CoachingContext): CoachingSuggestion[] {
  const suggestions: CoachingSuggestion[] = [];
  const page = context.currentPage;

  // Dashboard suggestions
  if (page === "/dashboard") {
    suggestions.push({
      id: "dashboard-quick-start",
      type: "learning-path",
      title: "Get Started with Perpetual Core",
      description: "Learn the essentials in 10 minutes. Create your first AI agent, workflow, and document.",
      action: {
        label: "Start Quick Tour",
        href: "/dashboard/training/quick-start",
      },
      dismissible: true,
      priority: "high",
    });

    suggestions.push({
      id: "dashboard-connect-integrations",
      type: "opportunity",
      title: "Connect Your Tools",
      description: "Integrate Gmail, Calendar, or Slack to unlock automation possibilities and save 5+ hours per week.",
      action: {
        label: "View Integrations",
        href: "/dashboard/settings/integrations",
      },
      dismissible: true,
    });
  }

  // Agents page suggestions
  if (page === "/dashboard/agents") {
    suggestions.push({
      id: "agents-first-agent",
      type: "quick-win",
      title: "Create Your First AI Agent",
      description: "Start with a template! Customer Support agents can handle 80% of common questions automatically.",
      action: {
        label: "Browse Templates",
        href: "/dashboard/agents/templates",
      },
      dismissible: true,
      priority: "high",
    });

    suggestions.push({
      id: "agents-workflow-combo",
      type: "opportunity",
      title: "Combine Agents with Workflows",
      description: "Did you know? Agents become 3x more powerful when connected to workflows. Automate entire processes!",
      action: {
        label: "Learn How",
        href: "/dashboard/training",
      },
      dismissible: true,
    });
  }

  // Workflows page suggestions
  if (page === "/dashboard/workflows") {
    suggestions.push({
      id: "workflows-first-workflow",
      type: "quick-win",
      title: "Build Your First Workflow",
      description: "Try our 'Daily Summary' template - automatically compile your tasks, emails, and calendar each morning.",
      action: {
        label: "Use Template",
        href: "/dashboard/workflows/templates",
      },
      dismissible: true,
      priority: "high",
    });

    suggestions.push({
      id: "workflows-schedule-automation",
      type: "tip",
      title: "Schedule Your Workflows",
      description: "Pro tip: Use cron expressions to run workflows automatically. Perfect for daily reports and cleanup tasks.",
      action: {
        label: "Learn More",
        href: "/dashboard/help?topic=scheduling",
      },
      dismissible: true,
    });
  }

  // Knowledge page suggestions
  if (page === "/dashboard/knowledge") {
    suggestions.push({
      id: "knowledge-upload-docs",
      type: "quick-win",
      title: "Upload Your First Document",
      description: "Add PDFs, documents, or knowledge bases. Our AI will index them for instant search and Q&A.",
      action: {
        label: "Upload Documents",
        onClick: () => {
          // Trigger upload modal
          document.getElementById("upload-button")?.click();
        },
      },
      dismissible: true,
    });

    suggestions.push({
      id: "knowledge-rag-agents",
      type: "opportunity",
      title: "Connect to AI Agents",
      description: "Your uploaded knowledge can power AI agents! They'll answer questions based on your documents.",
      action: {
        label: "Create Agent",
        href: "/dashboard/agents",
      },
      dismissible: true,
    });
  }

  // Developer pages suggestions
  if (page?.startsWith("/dashboard/developer")) {
    suggestions.push({
      id: "developer-api-keys",
      type: "tip",
      title: "Secure Your API Keys",
      description: "Always use environment variables for API keys in production. Never commit them to version control!",
      dismissible: true,
    });

    suggestions.push({
      id: "developer-webhooks",
      type: "opportunity",
      title: "Set Up Real-Time Notifications",
      description: "Webhooks let your apps react instantly to events. Perfect for triggering external processes!",
      action: {
        label: "Configure Webhooks",
        href: "/dashboard/developer/webhooks",
      },
      dismissible: true,
    });
  }

  // Scheduled Jobs page
  if (page === "/dashboard/scheduled-jobs") {
    suggestions.push({
      id: "scheduled-jobs-automation",
      type: "opportunity",
      title: "Automate Recurring Tasks",
      description: "Turn repetitive work into scheduled jobs. Great for daily backups, cleanup, or report generation.",
      action: {
        label: "Create Job",
        href: "/dashboard/scheduled-jobs/templates",
      },
      dismissible: true,
    });
  }

  // Settings page
  if (page?.startsWith("/dashboard/settings")) {
    suggestions.push({
      id: "settings-team-invite",
      type: "tip",
      title: "Invite Your Team",
      description: "Collaboration is better together! Invite team members to share agents, workflows, and knowledge.",
      action: {
        label: "Manage Team",
        href: "/dashboard/settings/team",
      },
      dismissible: true,
    });
  }

  // General suggestions (shown on most pages)
  const generalSuggestions: CoachingSuggestion[] = [
    {
      id: "general-keyboard-shortcuts",
      type: "tip",
      title: "Master Keyboard Shortcuts",
      description: "Press Cmd+K (or Ctrl+K) to open the command palette and navigate faster!",
      dismissible: true,
    },
    {
      id: "general-ai-coach",
      type: "learning-path",
      title: "Talk to Your AI Coach",
      description: "I'm here to help! Ask me anything about using Perpetual Core, best practices, or troubleshooting.",
      action: {
        label: "Open AI Coach",
        onClick: () => {
          // This would trigger the AI Coach modal
          const coachButton = document.querySelector('[title="AI Coach - Get Help"]') as HTMLElement;
          coachButton?.click();
        },
      },
      dismissible: true,
    },
  ];

  // Only add general suggestions on specific pages to avoid clutter
  if (["/dashboard", "/dashboard/agents", "/dashboard/workflows"].includes(page)) {
    // Randomly select one general suggestion to show
    const randomGeneral = generalSuggestions[Math.floor(Math.random() * generalSuggestions.length)];
    suggestions.push(randomGeneral);
  }

  return suggestions;
}

/**
 * Detect automation opportunities based on user patterns
 * This function analyzes user activity and suggests automations
 */
export function detectAutomationOpportunities(userActivity: any[]): CoachingSuggestion[] {
  const opportunities: CoachingSuggestion[] = [];

  // Example: Detect repeated manual tasks
  // If user manually processes emails every day, suggest email workflow
  // If user creates similar agents, suggest templates
  // If user checks analytics frequently, suggest scheduled reports

  // This would be connected to actual analytics in production
  // For now, returning example opportunities

  return opportunities;
}

/**
 * Track user progress through learning paths
 */
export function trackLearningProgress() {
  try {
    const completed = JSON.parse(localStorage.getItem("completed-suggestions") || "[]");
    const totalSuggestions = 20; // This would be dynamic based on user's learning path

    return {
      completed: completed.length,
      total: totalSuggestions,
      percentage: Math.round((completed.length / totalSuggestions) * 100),
    };
  } catch (error) {
    return { completed: 0, total: 0, percentage: 0 };
  }
}
