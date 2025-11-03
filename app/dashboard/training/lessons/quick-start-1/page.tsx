"use client";

import { LessonLayout } from "@/components/training/LessonLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Bot, Zap, Brain, BookOpen, Target } from "lucide-react";

export default function QuickStartLesson1() {
  const sections = [
    {
      title: "Welcome to Perpetual Core!",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Welcome! You're about to discover how Perpetual Core can transform the way you work. This platform brings together powerful AI capabilities, automation tools, and intelligent workflows to help you accomplish more in less time.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 my-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-600" />
              What You'll Learn
            </h3>
            <ul className="space-y-2 ml-6">
              <li className="list-disc">Core features and capabilities of Perpetual Core</li>
              <li className="list-disc">How AI Agents can work autonomously for you</li>
              <li className="list-disc">Ways to automate repetitive tasks with Workflows</li>
              <li className="list-disc">How to organize and search your knowledge</li>
              <li className="list-disc">Best practices for getting started quickly</li>
            </ul>
          </div>

          <p>
            By the end of this Quick Start guide (just 10 minutes!), you'll have created your first AI agent, set up a simple workflow, and learned how to leverage the platform's core features.
          </p>
        </div>
      ),
    },
    {
      title: "Core Platform Features",
      type: "text" as const,
      content: (
        <div className="space-y-6">
          <p className="text-lg">
            Perpetual Core is built around four powerful pillars that work together seamlessly:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>
                <h4 className="font-semibold">AI Agents</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Autonomous AI assistants that can monitor, analyze, and take actions on your behalf. Think of them as smart helpers that never sleep.
              </p>
            </Card>

            <Card className="p-6 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="font-semibold">Workflows</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Multi-step automations that connect different tools and actions. Perfect for eliminating repetitive tasks.
              </p>
            </Card>

            <Card className="p-6 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-semibold">Knowledge Base</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload documents, PDFs, and data that AI can search, analyze, and reference when answering questions.
              </p>
            </Card>

            <Card className="p-6 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-orange-600" />
                </div>
                <h4 className="font-semibold">AI Chat</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Chat with AI to get instant answers, draft content, analyze data, or brainstorm ideas - all in natural language.
              </p>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: "How AI Agents Work",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p>
            AI Agents are the heart of Perpetual Core. Unlike traditional automation that follows rigid rules, AI Agents can understand context, make decisions, and adapt to different situations.
          </p>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Real-World Example: Customer Support Agent</h4>
            <p className="text-sm mb-4">
              Imagine an AI Agent monitoring your customer support inbox:
            </p>
            <ol className="space-y-2 ml-6 text-sm">
              <li className="list-decimal"><strong>It monitors</strong> incoming support emails 24/7</li>
              <li className="list-decimal"><strong>It understands</strong> the customer's question and sentiment</li>
              <li className="list-decimal"><strong>It searches</strong> your knowledge base for relevant answers</li>
              <li className="list-decimal"><strong>It drafts</strong> a helpful, personalized response</li>
              <li className="list-decimal"><strong>It routes</strong> complex issues to your team with context</li>
            </ol>
            <p className="text-sm mt-4 text-muted-foreground">
              This all happens automatically, saving your team hours every day while providing faster support to customers.
            </p>
          </div>

          <p>
            In the next lesson, you'll create your first AI Agent using pre-built templates. It's easier than you think!
          </p>
        </div>
      ),
    },
    {
      title: "Understanding Workflows",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p>
            While AI Agents are intelligent and autonomous, Workflows are structured automations that connect different steps together. They're perfect for tasks that follow a predictable sequence.
          </p>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Real-World Example: Daily Summary Workflow</h4>
            <p className="text-sm mb-4">
              Every morning at 8 AM, this workflow:
            </p>
            <ol className="space-y-2 ml-6 text-sm">
              <li className="list-decimal">Checks your calendar for today's meetings</li>
              <li className="list-decimal">Scans your inbox for important emails</li>
              <li className="list-decimal">Reviews your task list for priorities</li>
              <li className="list-decimal">Compiles everything into a formatted summary</li>
              <li className="list-decimal">Sends it to Slack or email</li>
            </ol>
            <p className="text-sm mt-4 text-muted-foreground">
              You start every day with perfect clarity, without lifting a finger.
            </p>
          </div>

          <p>
            You'll set up your first workflow in Lesson 3. Many users save 5+ hours per week with just a few simple workflows!
          </p>
        </div>
      ),
    },
    {
      title: "Your Knowledge Base",
      type: "tip" as const,
      content: (
        <div className="space-y-4">
          <p>
            The Knowledge Base is where you upload documents, PDFs, spreadsheets, and other data. Once uploaded, AI can instantly search, analyze, and reference this information.
          </p>

          <div className="grid md:grid-cols-2 gap-4 my-6">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">What You Can Upload</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Company policies & procedures</li>
                <li>• Product documentation</li>
                <li>• Meeting notes & transcripts</li>
                <li>• Research papers & reports</li>
                <li>• Customer data & FAQs</li>
              </ul>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">What AI Can Do</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Answer questions using your docs</li>
                <li>• Find specific information instantly</li>
                <li>• Summarize long documents</li>
                <li>• Compare data across files</li>
                <li>• Generate insights from patterns</li>
              </ul>
            </div>
          </div>

          <p>
            In Lesson 4, you'll upload your first documents and see how AI can instantly make them searchable and actionable.
          </p>
        </div>
      ),
    },
  ];

  const quiz = [
    {
      question: "What is the main advantage of AI Agents over traditional automation?",
      options: [
        "They're faster",
        "They can understand context and make decisions",
        "They're cheaper",
        "They require no setup",
      ],
      correctAnswer: 1,
      explanation: "AI Agents can understand context, adapt to different situations, and make intelligent decisions - unlike traditional automation that follows rigid rules.",
    },
    {
      question: "Which feature would you use to automatically compile a daily summary from multiple sources?",
      options: [
        "AI Chat",
        "Knowledge Base",
        "Workflows",
        "Calendar",
      ],
      correctAnswer: 2,
      explanation: "Workflows are perfect for structured, multi-step automations like compiling summaries from different sources on a schedule.",
    },
    {
      question: "What happens to documents you upload to the Knowledge Base?",
      options: [
        "They're just stored for later download",
        "AI can search, analyze, and reference them",
        "They're automatically shared with your team",
        "They're converted to a different format",
      ],
      correctAnswer: 1,
      explanation: "Documents in the Knowledge Base become instantly searchable and usable by AI for answering questions, generating insights, and more.",
    },
  ];

  return (
    <LessonLayout
      lessonId="quick-start-1"
      pathId="quick-start"
      title="Welcome & Platform Overview"
      description="Understand what Perpetual Core can do for you and learn about its core features."
      estimatedTime={2}
      difficulty="beginner"
      sections={sections}
      quiz={quiz}
      nextLesson={{
        id: "quick-start-2",
        title: "Create Your First AI Agent",
        href: "/dashboard/training/lessons/quick-start-2",
      }}
    />
  );
}
