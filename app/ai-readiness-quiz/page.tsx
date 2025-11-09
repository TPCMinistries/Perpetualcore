"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Rocket,
  Target,
  Clock,
  DollarSign,
  Users,
  Zap,
  Download,
} from "lucide-react";
import type { LeadSegment, SegmentationResult } from "@/lib/leads/segmentation";
import { getThankYouMessage } from "@/lib/leads/segmentation";

interface QuizAnswer {
  questionId: string;
  answer: string;
  points: number;
}

const questions = [
  {
    id: "time-spent",
    question: "How many hours per week does your team spend on repetitive tasks?",
    options: [
      { label: "0-5 hours", value: "0-5", points: 10 },
      { label: "5-15 hours", value: "5-15", points: 30 },
      { label: "15-30 hours", value: "15-30", points: 60 },
      { label: "30+ hours", value: "30+", points: 100 },
    ],
  },
  {
    id: "biggest-bottleneck",
    question: "What's your biggest productivity bottleneck?",
    options: [
      { label: "Email management & responses", value: "email", points: 25 },
      { label: "Content creation", value: "content", points: 25 },
      { label: "Data entry & reporting", value: "data", points: 25 },
      { label: "Customer support", value: "support", points: 25 },
    ],
  },
  {
    id: "ai-usage",
    question: "How is your team currently using AI?",
    options: [
      { label: "Not using AI at all", value: "none", points: 100 },
      { label: "Few people use ChatGPT occasionally", value: "minimal", points: 60 },
      { label: "Some team members use AI regularly", value: "moderate", points: 30 },
      { label: "We have an AI strategy in place", value: "advanced", points: 10 },
    ],
  },
  {
    id: "team-size",
    question: "How many people on your team would benefit from AI?",
    options: [
      { label: "1-5 people", value: "1-5", points: 20 },
      { label: "6-15 people", value: "6-15", points: 40 },
      { label: "16-50 people", value: "16-50", points: 70 },
      { label: "50+ people", value: "50+", points: 100 },
    ],
  },
  {
    id: "knowledge-management",
    question: "How do you currently manage company knowledge?",
    options: [
      { label: "It's all in people's heads", value: "tribal", points: 100 },
      { label: "Scattered across docs and Slack", value: "scattered", points: 70 },
      { label: "We have documentation but it's hard to search", value: "documented", points: 40 },
      { label: "We have a well-organized knowledge base", value: "organized", points: 10 },
    ],
  },
  {
    id: "growth-stage",
    question: "What's your primary business goal right now?",
    options: [
      { label: "Scale without adding headcount", value: "scale", points: 100 },
      { label: "Improve team efficiency", value: "efficiency", points: 80 },
      { label: "Reduce operational costs", value: "costs", points: 60 },
      { label: "Stay competitive", value: "competitive", points: 40 },
    ],
  },
  {
    id: "budget",
    question: "What's your monthly budget for productivity tools?",
    options: [
      { label: "Under $100/month", value: "under-100", points: 20 },
      { label: "$100-500/month", value: "100-500", points: 40 },
      { label: "$500-2000/month", value: "500-2000", points: 70 },
      { label: "$2000+/month", value: "2000+", points: 100 },
    ],
  },
];

export default function AIReadinessQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [segmentData, setSegmentData] = useState<SegmentationResult | null>(null);

  const progress = ((step + 1) / (questions.length + 2)) * 100;
  const totalScore = answers.reduce((sum, answer) => sum + answer.points, 0);
  const maxScore = questions.reduce((sum, q) => sum + Math.max(...q.options.map(o => o.points)), 0);
  const percentageScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const handleAnswer = (questionId: string, answer: string, points: number) => {
    const newAnswers = answers.filter(a => a.questionId !== questionId);
    newAnswers.push({ questionId, answer, points });
    setAnswers(newAnswers);

    setTimeout(() => {
      setStep(step + 1);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.firstName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          source: "quiz",
          leadMagnet: "ai-readiness-quiz",
          metadata: {
            quizScore: percentageScore,
            answers: answers,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to submit");

      const result = await response.json();

      setSubmitted(true);
      setSegmentData(result.segmentData);
      setStep(step + 1);
      toast.success("Success! Check your email for your personalized report.");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = () => {
    if (percentageScore >= 80) return { level: "Critical", color: "red", icon: AlertTriangle };
    if (percentageScore >= 60) return { level: "High", color: "orange", icon: TrendingUp };
    if (percentageScore >= 40) return { level: "Moderate", color: "yellow", icon: Target };
    return { level: "Low", color: "green", icon: CheckCircle2 };
  };

  const getRecommendation = () => {
    if (percentageScore >= 80) {
      return {
        title: "Your business is losing significant time and money!",
        description: "Based on your answers, you could save 20-30+ hours per week with AI automation. This translates to $50,000-$150,000 in annual savings.",
        action: "You need AI implementation NOW",
        potential: "30+ hours/week saved",
      };
    } else if (percentageScore >= 60) {
      return {
        title: "You have major AI opportunities!",
        description: "Your team is spending too much time on automatable tasks. With the right AI strategy, you could recover 15-20 hours per week.",
        action: "AI would dramatically improve your efficiency",
        potential: "15-20 hours/week saved",
      };
    } else if (percentageScore >= 40) {
      return {
        title: "AI could still help you scale faster!",
        description: "While you're doing okay, AI automation could help you grow without adding headcount. You have room for 10-15 hours of weekly savings.",
        action: "AI would accelerate your growth",
        potential: "10-15 hours/week saved",
      };
    } else {
      return {
        title: "You're ahead of the curve!",
        description: "You're already efficient, but AI could help you maintain your edge and scale even further. Even efficient teams find 5-10 hours of weekly savings.",
        action: "AI would help you stay competitive",
        potential: "5-10 hours/week saved",
      };
    }
  };

  // Intro Screen
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Readiness Assessment
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                Discover exactly how much time and money AI could save your business in just 2 minutes
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                { icon: Clock, text: "Takes only 2 minutes" },
                { icon: Target, text: "Get your personalized AI Readiness Score" },
                { icon: TrendingUp, text: "See your potential time & cost savings" },
                { icon: Download, text: "Receive a custom implementation roadmap" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setStep(1)}
              size="lg"
              className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl font-bold"
            >
              Start Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-xs text-center text-slate-500 dark:text-slate-500 mt-4">
              100% Free • No Credit Card • Instant Results
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Questions
  if (step <= questions.length) {
    const currentQuestion = questions[step - 1];
    const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full">
          <CardContent className="p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Question {step} of {questions.length}
                </span>
                <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {Math.round(progress)}% Complete
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3 mb-8">
              {currentQuestion.options.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(currentQuestion.id, option.value, option.points)}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all duration-300 ${
                    currentAnswer?.answer === option.value
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950 shadow-lg"
                      : "border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {option.label}
                    </span>
                    {currentAnswer?.answer === option.value && (
                      <CheckCircle2 className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous Question
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Email Capture
  if (step === questions.length + 1 && !submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                Great! Your Results Are Ready
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Enter your email to get your personalized AI Readiness Score + custom implementation plan
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                    className="h-12"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="h-12"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Work Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="h-12"
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="h-12"
                  placeholder="Your Company"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl font-bold"
              >
                {loading ? "Calculating..." : "Show My Results"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-500">
                100% Free • Instant Results • Unsubscribe Anytime
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results Screen
  const scoreLevel = getScoreLevel();
  const recommendation = getRecommendation();
  const ScoreLevelIcon = scoreLevel.icon;

  // Get segment-specific messaging
  const segment = segmentData?.segment || "product";
  const thankYouMessage = getThankYouMessage(segment);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Score Card */}
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Your AI Readiness Score
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Based on your answers, here's where you stand
              </p>
            </div>

            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-48 h-48 rounded-full border-8 border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {percentageScore}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                      out of 100
                    </div>
                  </div>
                </div>
                <div className={`absolute -top-2 -right-2 w-16 h-16 rounded-full bg-${scoreLevel.color}-100 dark:bg-${scoreLevel.color}-900 flex items-center justify-center`}>
                  <ScoreLevelIcon className={`h-8 w-8 text-${scoreLevel.color}-600 dark:text-${scoreLevel.color}-400`} />
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className={`inline-block px-6 py-2 rounded-full bg-${scoreLevel.color}-100 dark:bg-${scoreLevel.color}-900 mb-4`}>
                <span className={`text-${scoreLevel.color}-800 dark:text-${scoreLevel.color}-200 font-bold`}>
                  {scoreLevel.level} Priority for AI Implementation
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation Card */}
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {recommendation.title}
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-6">
              {recommendation.description}
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Time Savings
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {recommendation.potential}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Estimated Savings
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${Math.round(percentageScore * 50)}-${Math.round(percentageScore * 150)}/mo
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 rounded-lg p-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                {thankYouMessage.title}
              </h3>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                {thankYouMessage.description}
              </p>
              <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                {thankYouMessage.nextSteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              {segmentData && (
                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <strong>Estimated Value:</strong> {segmentData.estimatedValue}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA Card */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-lg mb-6 text-purple-100">
              {segment === "enterprise"
                ? "Let's discuss a custom enterprise implementation plan"
                : segment === "consulting"
                ? "Let's create a custom AI strategy for your team"
                : "Get started with AI automation today"}
            </p>
            <Button
              onClick={() => {
                if (segment === "enterprise") {
                  window.location.href = "/enterprise-demo";
                } else if (segment === "consulting") {
                  window.location.href = "/consultation";
                } else {
                  window.location.href = "/signup";
                }
              }}
              size="lg"
              className="bg-white text-purple-600 hover:bg-purple-50 h-14 px-8 text-lg font-bold"
            >
              {segmentData?.recommendedCTA || "Get Started"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-purple-100 mt-4">
              {segment === "enterprise"
                ? "Executive briefing • White-glove implementation • ROI guarantee"
                : segment === "consulting"
                ? "Strategy call • Implementation support • Custom roadmap"
                : "Free trial • No credit card • Start in minutes"}
            </p>
          </CardContent>
        </Card>

        {/* Email Confirmation */}
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">
              Check Your Email!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              We've sent your detailed results + the full AI Productivity Guide to{" "}
              <strong>{formData.email}</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
