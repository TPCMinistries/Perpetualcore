"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  Lock,
  Play,
  Clock,
  Trophy,
  Target,
  Zap,
  Brain,
  Rocket,
  Users,
  Code,
  Sparkles,
  TrendingUp,
  BookOpen,
  Award,
  Star,
} from "lucide-react";
import Link from "next/link";
import { trackLearningProgress } from "@/hooks/useSmartCoaching";

interface LearningStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // in minutes
  status: "completed" | "in-progress" | "locked" | "available";
  href?: string;
  onClick?: () => void;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number; // total minutes
  completedSteps: number;
  totalSteps: number;
  icon: any;
  gradient: string;
  category: string;
  steps: LearningStep[];
}

export default function LearningPathsPage() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 20, percentage: 0 });

  // Get learning progress from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const learningProgress = trackLearningProgress();
      setProgress(learningProgress);
    }
  }, []);

  const learningPaths: LearningPath[] = [
    {
      id: "quick-start",
      title: "Quick Start Guide",
      description: "Get up and running with Perpetual Core in 10 minutes. Learn the essentials.",
      difficulty: "beginner",
      estimatedTime: 10,
      completedSteps: 2,
      totalSteps: 5,
      icon: Rocket,
      gradient: "from-blue-500 to-cyan-500",
      category: "Getting Started",
      steps: [
        {
          id: "qs-1",
          title: "Welcome & Platform Overview",
          description: "Understand what Perpetual Core can do for you",
          estimatedTime: 2,
          status: "completed",
        },
        {
          id: "qs-2",
          title: "Create Your First AI Agent",
          description: "Build a simple agent using templates",
          estimatedTime: 3,
          status: "completed",
          href: "/dashboard/agents/templates",
        },
        {
          id: "qs-3",
          title: "Set Up Your First Workflow",
          description: "Automate a simple task with workflows",
          estimatedTime: 3,
          status: "in-progress",
          href: "/dashboard/workflows/templates",
        },
        {
          id: "qs-4",
          title: "Upload Knowledge Base",
          description: "Add documents for AI to reference",
          estimatedTime: 1,
          status: "available",
          href: "/dashboard/knowledge",
        },
        {
          id: "qs-5",
          title: "Connect Your Tools",
          description: "Integrate with Gmail, Calendar, or Slack",
          estimatedTime: 1,
          status: "available",
          href: "/dashboard/settings/integrations",
        },
      ],
    },
    {
      id: "advanced-automation",
      title: "Advanced Automation",
      description: "Master complex workflows and multi-step automations to save hours every week.",
      difficulty: "advanced",
      estimatedTime: 45,
      completedSteps: 0,
      totalSteps: 6,
      icon: Zap,
      gradient: "from-purple-500 to-pink-500",
      category: "Automation",
      steps: [
        {
          id: "aa-1",
          title: "Workflow Builder Deep Dive",
          description: "Learn advanced workflow patterns",
          estimatedTime: 10,
          status: "available",
          href: "/dashboard/workflows",
        },
        {
          id: "aa-2",
          title: "Conditional Logic & Branching",
          description: "Create smart decision trees",
          estimatedTime: 8,
          status: "locked",
        },
        {
          id: "aa-3",
          title: "Error Handling & Retries",
          description: "Build resilient automations",
          estimatedTime: 7,
          status: "locked",
        },
        {
          id: "aa-4",
          title: "Scheduled Jobs & Cron",
          description: "Automate recurring tasks",
          estimatedTime: 10,
          status: "locked",
          href: "/dashboard/scheduled-jobs",
        },
        {
          id: "aa-5",
          title: "Combining Agents & Workflows",
          description: "Build powerful agent-workflow combos",
          estimatedTime: 5,
          status: "locked",
        },
        {
          id: "aa-6",
          title: "Real-world Automation Project",
          description: "Build an end-to-end automation",
          estimatedTime: 5,
          status: "locked",
        },
      ],
    },
    {
      id: "ai-agents-mastery",
      title: "AI Agents Mastery",
      description: "Create sophisticated AI agents that understand context and take autonomous actions.",
      difficulty: "intermediate",
      estimatedTime: 30,
      completedSteps: 1,
      totalSteps: 5,
      icon: Brain,
      gradient: "from-green-500 to-emerald-500",
      category: "AI Agents",
      steps: [
        {
          id: "am-1",
          title: "Agent Architecture Basics",
          description: "Understand how agents work",
          estimatedTime: 5,
          status: "completed",
        },
        {
          id: "am-2",
          title: "Personality & Prompt Engineering",
          description: "Craft effective agent personalities",
          estimatedTime: 8,
          status: "available",
          href: "/dashboard/agents",
        },
        {
          id: "am-3",
          title: "Tool Configuration",
          description: "Give agents the right capabilities",
          estimatedTime: 6,
          status: "locked",
        },
        {
          id: "am-4",
          title: "Knowledge Integration (RAG)",
          description: "Connect agents to your knowledge base",
          estimatedTime: 6,
          status: "locked",
        },
        {
          id: "am-5",
          title: "Agent Testing & Optimization",
          description: "Measure and improve agent performance",
          estimatedTime: 5,
          status: "locked",
        },
      ],
    },
    {
      id: "developer-integration",
      title: "Developer Integration",
      description: "Integrate Perpetual Core with your apps using APIs, webhooks, and custom code.",
      difficulty: "advanced",
      estimatedTime: 60,
      completedSteps: 0,
      totalSteps: 7,
      icon: Code,
      gradient: "from-orange-500 to-amber-500",
      category: "Developer",
      steps: [
        {
          id: "di-1",
          title: "API Authentication Setup",
          description: "Generate and manage API keys",
          estimatedTime: 5,
          status: "available",
          href: "/dashboard/developer/api-keys",
        },
        {
          id: "di-2",
          title: "Making Your First API Call",
          description: "Test the API with cURL or Postman",
          estimatedTime: 10,
          status: "locked",
        },
        {
          id: "di-3",
          title: "Webhook Configuration",
          description: "Receive real-time event notifications",
          estimatedTime: 10,
          status: "locked",
          href: "/dashboard/developer/webhooks",
        },
        {
          id: "di-4",
          title: "Building with SDKs",
          description: "Use JavaScript, Python, or REST",
          estimatedTime: 15,
          status: "locked",
        },
        {
          id: "di-5",
          title: "Custom Tool Development",
          description: "Extend Perpetual Core with custom functions",
          estimatedTime: 10,
          status: "locked",
        },
        {
          id: "di-6",
          title: "Rate Limits & Best Practices",
          description: "Optimize your integration",
          estimatedTime: 5,
          status: "locked",
        },
        {
          id: "di-7",
          title: "Build a Full Integration",
          description: "Complete end-to-end project",
          estimatedTime: 5,
          status: "locked",
        },
      ],
    },
    {
      id: "team-collaboration",
      title: "Team Collaboration",
      description: "Learn to work effectively with your team on shared agents, workflows, and knowledge.",
      difficulty: "intermediate",
      estimatedTime: 25,
      completedSteps: 0,
      totalSteps: 4,
      icon: Users,
      gradient: "from-indigo-500 to-purple-500",
      category: "Collaboration",
      steps: [
        {
          id: "tc-1",
          title: "Inviting Team Members",
          description: "Add your team and assign roles",
          estimatedTime: 5,
          status: "available",
          href: "/dashboard/settings/team",
        },
        {
          id: "tc-2",
          title: "Sharing Agents & Workflows",
          description: "Collaborate on automations",
          estimatedTime: 8,
          status: "locked",
        },
        {
          id: "tc-3",
          title: "Permissions & Access Control",
          description: "Manage who can do what",
          estimatedTime: 7,
          status: "locked",
        },
        {
          id: "tc-4",
          title: "Team Analytics Dashboard",
          description: "Track team productivity",
          estimatedTime: 5,
          status: "locked",
          href: "/dashboard/analytics",
        },
      ],
    },
  ];

  const difficultyColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusIcons = {
    completed: CheckCircle2,
    "in-progress": Play,
    available: Circle,
    locked: Lock,
  };

  const statusColors = {
    completed: "text-green-600 dark:text-green-400",
    "in-progress": "text-blue-600 dark:text-blue-400",
    available: "text-gray-400 dark:text-gray-500",
    locked: "text-gray-300 dark:text-gray-600",
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-orange-950/30 border border-purple-100 dark:border-purple-900/20 p-8 md:p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-900 via-pink-800 to-orange-900 dark:from-purple-100 dark:via-pink-100 dark:to-orange-100 bg-clip-text text-transparent">
                Learning Center
              </h1>
              <p className="text-purple-700 dark:text-purple-300 mt-1">
                Master Perpetual Core with guided, hands-on learning journeys
              </p>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h3 className="font-semibold text-lg">Your Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {progress.completed} of {progress.total} suggestions completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {progress.percentage}%
                </div>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
            <Progress value={progress.percentage} className="h-3" />
          </div>
        </div>
      </div>

      {/* Learning Paths Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {learningPaths.map((path) => {
          const PathIcon = path.icon;
          const progressPercent = Math.round((path.completedSteps / path.totalSteps) * 100);
          const isSelected = selectedPath === path.id;

          return (
            <Card
              key={path.id}
              className={`group hover:shadow-lg transition-all duration-300 cursor-pointer ${
                isSelected ? "ring-2 ring-purple-500 shadow-lg" : ""
              }`}
              onClick={() => setSelectedPath(isSelected ? null : path.id)}
            >
              <CardContent className="p-6">
                {/* Path Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${path.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg`}>
                    <PathIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{path.title}</h3>
                      <Badge className={difficultyColors[path.difficulty]} variant="outline">
                        {path.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {path.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {path.estimatedTime} min
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {path.totalSteps} steps
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {path.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Progress</span>
                    <span className="font-medium">
                      {path.completedSteps}/{path.totalSteps} completed
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>

                {/* Expandable Steps */}
                {isSelected && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 pt-4 border-t">
                    {path.steps.map((step, index) => {
                      const StatusIcon = statusIcons[step.status];
                      const statusColor = statusColors[step.status];
                      const isClickable = step.status !== "locked" && (step.href || step.onClick);

                      const StepContent = (
                        <div
                          className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                            isClickable
                              ? "hover:bg-purple-50 dark:hover:bg-purple-950/20 cursor-pointer"
                              : step.status === "locked"
                                ? "opacity-50"
                                : ""
                          }`}
                        >
                          <StatusIcon className={`h-5 w-5 ${statusColor} flex-shrink-0 mt-0.5`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                Step {index + 1}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {step.estimatedTime} min
                              </span>
                              {step.status === "completed" && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950/30">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Done
                                  </Badge>
                                </>
                              )}
                            </div>
                            <h4 className="font-medium text-sm mb-1">{step.title}</h4>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                          {isClickable && (
                            <div className="flex-shrink-0">
                              <Button size="sm" variant="ghost" className="h-8">
                                {step.status === "in-progress" ? "Continue" : "Start"}
                              </Button>
                            </div>
                          )}
                        </div>
                      );

                      if (step.href && step.status !== "locked") {
                        return (
                          <Link key={step.id} href={step.href}>
                            {StepContent}
                          </Link>
                        );
                      }

                      return <div key={step.id}>{StepContent}</div>;
                    })}
                  </div>
                )}

                {/* Expand/Collapse Hint */}
                {!isSelected && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-muted-foreground">
                      Click to view {path.totalSteps} steps
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievement Badges Preview */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                Unlock Achievements
                <Sparkles className="h-4 w-4 text-yellow-600" />
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete learning paths to earn badges and showcase your expertise. Track your journey from beginner to AI automation expert!
              </p>
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-full bg-white dark:bg-gray-900 border-2 border-yellow-400 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="h-12 w-12 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center opacity-40">
                  <Trophy className="h-6 w-6 text-gray-400" />
                </div>
                <div className="h-12 w-12 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center opacity-40">
                  <Target className="h-6 w-6 text-gray-400" />
                </div>
                <div className="h-12 w-12 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center opacity-40">
                  <Rocket className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
