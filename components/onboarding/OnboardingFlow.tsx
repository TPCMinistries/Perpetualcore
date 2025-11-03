"use client";

import { useState, useEffect } from "react";
import { X, Check, ArrowRight, ArrowLeft, Sparkles, FileText, Calendar, Mail, MessageSquare, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface OnboardingFlowProps {
  userProfile: {
    full_name: string;
    email: string;
    onboarding_completed?: boolean;
    onboarding_step?: number;
  };
}

const STEPS = [
  {
    id: 0,
    title: "Welcome to Perpetual Core",
    subtitle: "Your intelligent productivity platform",
  },
  {
    id: 1,
    title: "Key Features",
    subtitle: "Discover what Perpetual Core can do for you",
  },
  {
    id: 2,
    title: "Quick Actions",
    subtitle: "Get started with these essential features",
  },
  {
    id: 3,
    title: "All Set!",
    subtitle: "You're ready to boost your productivity",
  },
];

export function OnboardingFlow({ userProfile }: OnboardingFlowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check localStorage first as fallback
    const localOnboardingCompleted = localStorage.getItem("onboarding-completed") === "true";
    const dbOnboardingCompleted = userProfile.onboarding_completed;

    // Show onboarding if not completed in either DB or localStorage
    if (!localOnboardingCompleted && !dbOnboardingCompleted) {
      // Small delay for better UX
      setTimeout(() => {
        setIsOpen(true);
        const savedStep = localStorage.getItem("onboarding-step");
        setCurrentStep(userProfile.onboarding_step || (savedStep ? parseInt(savedStep) : 0));
      }, 500);
    }
  }, [userProfile]);

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      await updateOnboardingProgress(nextStep, false);
    } else {
      await completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage as fallback
      localStorage.setItem("onboarding-completed", "true");
      localStorage.setItem("onboarding-skipped", "true");

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: false,
          skipped: true,
          step: currentStep
        }),
      });

      // Close modal even if API fails
      setIsOpen(false);

      if (response.ok) {
        toast.info("You can always access the tour from Settings");
      } else {
        console.warn("Failed to save skip status, but closing anyway");
      }
    } catch (error) {
      // Close modal anyway
      setIsOpen(false);
      console.error("Failed to save progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOnboardingProgress = async (step: number, completed: boolean) => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, completed }),
      });
    } catch (error) {
      console.error("Failed to update onboarding progress:", error);
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage as fallback
      localStorage.setItem("onboarding-completed", "true");
      localStorage.setItem("onboarding-step", STEPS.length.toString());

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, step: STEPS.length }),
      });

      // Close modal even if API fails (database might not have columns yet)
      setIsOpen(false);

      if (response.ok) {
        toast.success("Welcome aboard! Let's get productive!");
      } else {
        // Silently fail - onboarding can be completed later
        console.warn("Onboarding API failed, but closing modal anyway");
        toast.success("Welcome aboard! Let's get productive!");
      }
    } catch (error) {
      // Close modal anyway - this prevents user from getting stuck
      setIsOpen(false);
      toast.success("Welcome aboard! Let's get productive!");
      console.error("Failed to complete onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 relative shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step content */}
        <div className="min-h-[400px] flex flex-col">
          {currentStep === 0 && <WelcomeStep userName={userProfile.full_name} />}
          {currentStep === 1 && <FeaturesStep />}
          {currentStep === 2 && <QuickActionsStep />}
          {currentStep === 3 && <CompleteStep />}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 0 || isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < STEPS.length - 1 && (
              <Button variant="outline" onClick={handleSkip} disabled={isLoading}>
                Skip Tour
              </Button>
            )}
            <Button onClick={handleNext} disabled={isLoading}>
              {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
              {currentStep === STEPS.length - 1 ? (
                <Check className="h-4 w-4 ml-2" />
              ) : (
                <ArrowRight className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function WelcomeStep({ userName }: { userName: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center flex-1">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold mb-4">
        Welcome{userName ? `, ${userName.split(' ')[0]}` : ''}!
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-6">
        Perpetual Core is your all-in-one intelligent productivity platform. Let's take a quick tour to help you get started.
      </p>
      <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">10+</div>
          <div className="text-sm text-muted-foreground">Integrated Tools</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">AI</div>
          <div className="text-sm text-muted-foreground">Powered</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-3xl font-bold text-primary mb-1">∞</div>
          <div className="text-sm text-muted-foreground">Possibilities</div>
        </Card>
      </div>
    </div>
  );
}

function FeaturesStep() {
  const features = [
    {
      icon: MessageSquare,
      title: "AI Chat Assistant",
      description: "Brainstorm ideas, get answers, and complete tasks with AI",
      color: "text-blue-500",
    },
    {
      icon: FileText,
      title: "Knowledge Library",
      description: "Upload documents and search them instantly with AI-powered RAG",
      color: "text-purple-500",
    },
    {
      icon: Zap,
      title: "Workflows & Agents",
      description: "Automate tasks and create custom AI agents for any use case",
      color: "text-yellow-500",
    },
    {
      icon: Calendar,
      title: "Calendar & Email",
      description: "Manage your schedule and communications in one place",
      color: "text-green-500",
    },
  ];

  return (
    <div className="flex-1">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Everything You Need in One Place</h2>
        <p className="text-muted-foreground">
          Perpetual Core brings together the tools you use every day
        </p>
      </div>
      <div className="grid gap-3">
        {features.map((feature, index) => (
          <Card key={index} className="p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
            <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${feature.color}`}>
              <feature.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
        <p className="text-sm text-center text-muted-foreground">
          <strong>Plus:</strong> Tasks, Analytics, Training Lessons, Integrations, and more!
        </p>
      </div>
    </div>
  );
}

function QuickActionsStep() {
  const handleActionClick = (href: string) => {
    // Mark onboarding as completed when user takes action
    localStorage.setItem("onboarding-completed", "true");
    window.location.href = href;
  };

  return (
    <div className="flex-1">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
        <p className="text-muted-foreground">
          Pick where you'd like to begin
        </p>
      </div>
      <div className="space-y-4">
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">Quick Start Guide</h3>
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Interactive 5-lesson guide (10 min)
              </p>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600" onClick={() => handleActionClick('/dashboard/training/lessons/quick-start-1')}>
                Start Guide
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">AI Chat</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Ask questions and brainstorm ideas
              </p>
              <Button size="sm" variant="outline" onClick={() => handleActionClick('/dashboard/chat')}>
                Open AI Chat
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Upload Documents</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Make your files searchable with AI
              </p>
              <Button size="sm" variant="outline" onClick={() => handleActionClick('/dashboard/knowledge')}>
                Go to Knowledge Library
              </Button>
            </div>
          </div>
        </Card>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Pro tip:</strong> Press <kbd className="px-2 py-1 text-xs bg-background rounded border">⌘K</kbd> or <kbd className="px-2 py-1 text-xs bg-background rounded border">Ctrl+K</kbd> anytime to quickly navigate anywhere in Perpetual Core.
          </p>
        </div>
      </div>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="flex flex-col items-center justify-center text-center flex-1">
      <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg animate-in zoom-in duration-300">
        <Check className="h-12 w-12 text-white" />
      </div>
      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
        You're All Set!
      </h1>
      <p className="text-lg text-muted-foreground max-w-md mb-8">
        Welcome to Perpetual Core! You're ready to transform how you work with AI-powered productivity.
      </p>

      <div className="grid grid-cols-1 gap-4 w-full max-w-md mb-6">
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/20">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">🎯 Next Steps</h3>
          <p className="text-sm text-muted-foreground">
            Start the Quick Start Guide from Settings, or explore features at your own pace. Everything is ready for you!
          </p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-900/20">
          <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">💡 Need Help?</h3>
          <p className="text-sm text-muted-foreground">
            Access this tour anytime from Settings. Check documentation or contact support whenever you need assistance.
          </p>
        </Card>
      </div>
    </div>
  );
}
