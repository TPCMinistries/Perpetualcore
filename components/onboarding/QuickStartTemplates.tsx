"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Users,
  Mail,
  Calendar,
  FileText,
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Target,
  BarChart3,
  MessageSquare,
  Clock,
  Bot,
  Sparkles,
  X,
} from "lucide-react";

interface QuickStartTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  steps: string[];
  features: string[];
  setupTime: string;
}

const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    id: "sales-pipeline",
    title: "Sales Pipeline Manager",
    description: "Track leads, manage deals, and close more sales with AI assistance",
    icon: <Target className="h-6 w-6" />,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    steps: [
      "Creating Sales Engine team",
      "Setting up lead tracking",
      "Configuring AI sales advisor",
      "Importing sample leads",
    ],
    features: ["Lead scoring", "Deal pipeline", "Email follow-ups", "Sales forecasting"],
    setupTime: "2 min",
  },
  {
    id: "email-automation",
    title: "Email Productivity System",
    description: "Let AI handle email drafts, follow-ups, and inbox organization",
    icon: <Mail className="h-6 w-6" />,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    steps: [
      "Connecting email provider",
      "Setting up smart filters",
      "Configuring AI responder",
      "Creating email templates",
    ],
    features: ["Smart categorization", "AI draft suggestions", "Auto follow-ups", "Template library"],
    setupTime: "3 min",
  },
  {
    id: "project-hub",
    title: "Project Command Center",
    description: "Organize projects, track tasks, and keep your team aligned",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    steps: [
      "Creating project workspace",
      "Setting up task boards",
      "Configuring team notifications",
      "Adding project templates",
    ],
    features: ["Kanban boards", "Time tracking", "Team collaboration", "Progress reports"],
    setupTime: "2 min",
  },
  {
    id: "meeting-assistant",
    title: "Meeting Intelligence",
    description: "Never miss action items with AI meeting prep and follow-up",
    icon: <Calendar className="h-6 w-6" />,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    steps: [
      "Connecting calendar",
      "Setting up meeting briefs",
      "Configuring AI note-taker",
      "Creating follow-up automations",
    ],
    features: ["Meeting prep briefs", "Auto action items", "Follow-up emails", "Calendar sync"],
    setupTime: "2 min",
  },
  {
    id: "content-engine",
    title: "Content Creation Engine",
    description: "Generate, organize, and publish content with AI assistance",
    icon: <FileText className="h-6 w-6" />,
    color: "text-pink-600",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    steps: [
      "Setting up content workspace",
      "Configuring AI writer",
      "Creating content calendar",
      "Adding brand guidelines",
    ],
    features: ["AI content generation", "Editorial calendar", "Brand voice", "Multi-format export"],
    setupTime: "3 min",
  },
  {
    id: "automation-starter",
    title: "Workflow Automation",
    description: "Automate repetitive tasks and connect your tools",
    icon: <Zap className="h-6 w-6" />,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    steps: [
      "Setting up automation hub",
      "Installing starter workflows",
      "Connecting integrations",
      "Scheduling first automation",
    ],
    features: ["Visual workflow builder", "500+ integrations", "Scheduled triggers", "Error handling"],
    setupTime: "4 min",
  },
];

interface QuickStartTemplatesProps {
  onDismiss?: () => void;
  compact?: boolean;
}

export function QuickStartTemplates({ onDismiss, compact = false }: QuickStartTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<QuickStartTemplate | null>(null);
  const [setupProgress, setSetupProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  const handleSelectTemplate = async (template: QuickStartTemplate) => {
    setSelectedTemplate(template);
    setIsSettingUp(true);
    setSetupProgress(0);
    setCurrentStep(0);

    // Simulate setup steps
    for (let i = 0; i < template.steps.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
      setSetupProgress(((i + 1) / template.steps.length) * 100);
    }

    // Actually set up the template
    try {
      await fetch("/api/onboarding/quick-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: template.id }),
      });
    } catch (error) {
      console.error("Quick start setup error:", error);
    }

    setIsSettingUp(false);
    setIsComplete(true);
  };

  const handleGoToDashboard = () => {
    // Navigate based on template
    const routes: Record<string, string> = {
      "sales-pipeline": "/dashboard/leads",
      "email-automation": "/dashboard/inbox",
      "project-hub": "/dashboard/projects",
      "meeting-assistant": "/dashboard/calendar",
      "content-engine": "/dashboard/documents",
      "automation-starter": "/dashboard/automation",
    };

    router.push(routes[selectedTemplate?.id || ""] || "/dashboard/home");
  };

  if (compact) {
    return (
      <Card className="border-dashed border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900">
              <Rocket className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Quick Start Templates</p>
              <p className="text-xs text-muted-foreground">Set up your workspace in minutes</p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push("/dashboard/getting-started")}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Explore
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Setup in progress view
  if (isSettingUp && selectedTemplate) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-16 h-16 rounded-2xl ${selectedTemplate.bg} flex items-center justify-center mx-auto mb-6`}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className={`h-8 w-8 ${selectedTemplate.color}`} />
            </motion.div>
          </motion.div>

          <h3 className="text-xl font-semibold mb-2">Setting up {selectedTemplate.title}</h3>
          <p className="text-muted-foreground mb-6">{selectedTemplate.steps[currentStep]}</p>

          <Progress value={setupProgress} className="h-2 mb-4" />

          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {selectedTemplate.steps.length}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Setup complete view
  if (isComplete && selectedTemplate) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </motion.div>

          <h3 className="text-xl font-semibold mb-2">{selectedTemplate.title} is Ready!</h3>
          <p className="text-muted-foreground mb-6">
            Your workspace has been configured with all the features you need.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {selectedTemplate.features.map((feature, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => {
              setSelectedTemplate(null);
              setIsComplete(false);
            }}>
              Set Up Another
            </Button>
            <Button onClick={handleGoToDashboard} className="bg-emerald-600 hover:bg-emerald-700">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Template selection view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="h-6 w-6 text-violet-600" />
            Quick Start Templates
          </h2>
          <p className="text-muted-foreground mt-1">
            Choose a template to instantly set up your workspace
          </p>
        </div>
        {onDismiss && (
          <Button variant="ghost" size="icon" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_START_TEMPLATES.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] border-2 ${
                selectedTemplate?.id === template.id
                  ? "border-violet-500 shadow-violet-100"
                  : "border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${template.bg}`}>
                    <div className={template.color}>{template.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{template.title}</h3>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        {template.setupTime}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {template.features.slice(0, 3).map((feature, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {template.features.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.features.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't see what you need?{" "}
          <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/dashboard/chat")}>
            Ask AI to help you set up
          </Button>
        </p>
      </div>
    </div>
  );
}
