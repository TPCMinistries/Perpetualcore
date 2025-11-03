"use client";

import { LessonLayout } from "@/components/training/LessonLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Settings, TestTube, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function QuickStartLesson2() {
  const sections = [
    {
      title: "Why Start with a Template?",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            The fastest way to create your first AI Agent is to start with a pre-built template. Templates are professionally designed agents that solve common problems - you can use them as-is or customize them to your needs.
          </p>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Popular Agent Templates</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Customer Support Agent</span>
                </div>
                <p className="text-xs text-muted-foreground">Handles 80% of common customer questions automatically</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Email Organizer</span>
                </div>
                <p className="text-xs text-muted-foreground">Sorts, labels, and prioritizes your inbox</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Meeting Notes Agent</span>
                </div>
                <p className="text-xs text-muted-foreground">Summarizes meetings and extracts action items</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Content Moderator</span>
                </div>
                <p className="text-xs text-muted-foreground">Reviews user-generated content for policy violations</p>
              </div>
            </div>
          </div>

          <p>
            For this lesson, we'll create a <strong>Customer Support Agent</strong> - one of the most popular and immediately useful agents.
          </p>
        </div>
      ),
    },
    {
      title: "Step 1: Browse Templates",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Let's get started! First, you'll need to navigate to the Agents page and browse templates.
          </p>

          <Card className="p-6 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Action Required
            </h4>
            <ol className="space-y-3 ml-6 mb-4">
              <li className="list-decimal">
                Click the button below to open the <strong>Agent Templates</strong> page
              </li>
              <li className="list-decimal">
                Browse through the available templates
              </li>
              <li className="list-decimal">
                Find the <strong>"Customer Support Agent"</strong> template
              </li>
              <li className="list-decimal">
                Click <strong>"Use Template"</strong> to start creating your agent
              </li>
            </ol>

            <Link href="/dashboard/agents/templates" target="_blank">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                <Bot className="h-4 w-4 mr-2" />
                Browse Agent Templates
              </Button>
            </Link>

            <p className="text-sm text-muted-foreground mt-4">
              💡 Tip: The template page will open in a new tab so you can follow along with this lesson.
            </p>
          </Card>
        </div>
      ),
    },
    {
      title: "Step 2: Configure Your Agent",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Once you've selected the Customer Support Agent template, you'll see a configuration screen. Here's what each setting means:
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold">Agent Name</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Give your agent a descriptive name like "Support Bot" or "Customer Helper"
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                <code className="text-sm">Example: "Customer Support Bot"</code>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold">Personality</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Choose how the agent communicates: Professional, Friendly, or Concise
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                <code className="text-sm">Recommended: "Friendly" for customer support</code>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold">Tools & Capabilities</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Enable capabilities like searching documentation, sending emails, or creating tasks
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                <code className="text-sm">Recommended: Enable "Search Knowledge Base"</code>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Pro Tip:</strong> You don't need to configure everything perfectly now. You can always edit your agent later. Just fill in the basics and click "Create Agent"!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 3: Test Your Agent",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            After creating your agent, you'll be taken to the agent detail page where you can test it immediately.
          </p>

          <Card className="p-6 border-green-200 dark:border-green-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TestTube className="h-5 w-5 text-green-600" />
              Try These Test Prompts
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="text-sm font-medium mb-1">Test 1: Basic Question</p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded">
                  <code className="text-xs">"What are your business hours?"</code>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="text-sm font-medium mb-1">Test 2: Product Inquiry</p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded">
                  <code className="text-xs">"Tell me about your pricing plans"</code>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="text-sm font-medium mb-1">Test 3: Troubleshooting</p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded">
                  <code className="text-xs">"I can't log in to my account"</code>
                </div>
              </div>
            </div>
          </Card>

          <p>
            Watch how the agent responds! It should understand the context, provide helpful answers, and maintain the personality you selected.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>What to Look For:</strong> The agent should respond within 2-3 seconds, provide relevant answers, and ask clarifying questions when needed. If responses seem off, you can edit the agent's system prompt in the Configuration tab.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Understanding Agent Performance",
      type: "tip" as const,
      content: (
        <div className="space-y-4">
          <p>
            Now that your agent is created, you'll want to monitor how well it's performing. The agent detail page shows important metrics:
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <h4 className="font-semibold text-sm mb-2">Success Rate</h4>
              <p className="text-xs text-muted-foreground">
                Percentage of interactions that successfully resolved the issue. Aim for 80%+.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-2">Total Actions</h4>
              <p className="text-xs text-muted-foreground">
                How many times the agent has been triggered. This shows usage and impact.
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-sm mb-2">Response Time</h4>
              <p className="text-xs text-muted-foreground">
                How quickly the agent responds. Most agents respond in under 3 seconds.
              </p>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mt-4">
            <h4 className="font-semibold mb-3">Next Steps to Improve Your Agent</h4>
            <ul className="space-y-2 ml-6 text-sm">
              <li className="list-disc">Upload company FAQs to the Knowledge Base for more accurate answers</li>
              <li className="list-disc">Customize the system prompt to match your brand voice</li>
              <li className="list-disc">Enable additional tools like email sending or task creation</li>
              <li className="list-disc">Set up monitoring to track conversations and identify improvements</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const practiceExercise = (
    <div className="space-y-4">
      <p className="text-lg">
        Congratulations on creating your first AI Agent! Now let's practice what you've learned:
      </p>

      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <h3 className="font-semibold text-lg mb-4">Challenge: Create a Second Agent</h3>
        <p className="mb-4">
          Go back to the templates and create an <strong>Email Organizer Agent</strong>. This agent will:
        </p>
        <ul className="space-y-2 ml-6 mb-4">
          <li className="list-disc">Automatically sort incoming emails by priority</li>
          <li className="list-disc">Label emails by category (urgent, follow-up, newsletter, etc.)</li>
          <li className="list-disc">Flag important messages for your attention</li>
        </ul>

        <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm mb-1">Success Criteria</p>
            <p className="text-xs text-muted-foreground">
              You've completed this exercise when you have two active agents shown on your Agents dashboard.
            </p>
          </div>
        </div>
      </Card>

      <Link href="/dashboard/agents/templates" target="_blank">
        <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
          Start Practice Exercise
        </Button>
      </Link>
    </div>
  );

  const quiz = [
    {
      question: "What's the fastest way to create your first AI Agent?",
      options: [
        "Write code from scratch",
        "Use a pre-built template",
        "Copy from another platform",
        "Hire a developer",
      ],
      correctAnswer: 1,
      explanation: "Templates are pre-built, professionally designed agents that you can use immediately or customize to your needs.",
    },
    {
      question: "Which personality should you choose for a Customer Support Agent?",
      options: [
        "Formal and distant",
        "Friendly and helpful",
        "Technical and precise",
        "Casual and joking",
      ],
      correctAnswer: 1,
      explanation: "Friendly and helpful is ideal for customer support as it makes customers feel valued while maintaining professionalism.",
    },
    {
      question: "What's a good success rate target for a Customer Support Agent?",
      options: [
        "50%",
        "65%",
        "80%+",
        "100%",
      ],
      correctAnswer: 2,
      explanation: "80%+ is a realistic and strong success rate, meaning the agent successfully resolves most customer inquiries without human intervention.",
    },
  ];

  return (
    <LessonLayout
      lessonId="quick-start-2"
      pathId="quick-start"
      title="Create Your First AI Agent"
      description="Build a simple agent using templates and learn how to test and monitor it."
      estimatedTime={3}
      difficulty="beginner"
      sections={sections}
      practiceExercise={practiceExercise}
      quiz={quiz}
      previousLesson={{
        id: "quick-start-1",
        title: "Welcome & Platform Overview",
        href: "/dashboard/training/lessons/quick-start-1",
      }}
      nextLesson={{
        id: "quick-start-3",
        title: "Set Up Your First Workflow",
        href: "/dashboard/training/lessons/quick-start-3",
      }}
    />
  );
}
