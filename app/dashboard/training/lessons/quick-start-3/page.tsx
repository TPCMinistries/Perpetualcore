"use client";

import { LessonLayout } from "@/components/training/LessonLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Play, Settings2, TestTube2, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function QuickStartLesson3() {
  const sections = [
    {
      title: "What Are Workflows?",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            While AI Agents are intelligent and autonomous, <strong>Workflows</strong> are structured automations that connect different steps together in a predictable sequence. Think of them as recipes that execute automatically.
          </p>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Workflows vs. AI Agents</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-sm mb-2">✨ AI Agents</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Make intelligent decisions</li>
                  <li>• Adapt to context</li>
                  <li>• Handle unpredictable situations</li>
                  <li>• Best for customer support, analysis</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-sm mb-2">⚡ Workflows</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Follow predefined steps</li>
                  <li>• Consistent and reliable</li>
                  <li>• Perfect for repetitive tasks</li>
                  <li>• Best for data sync, notifications</li>
                </ul>
              </div>
            </div>
          </div>

          <p>
            For this lesson, we'll create a <strong>Daily Summary Workflow</strong> that compiles your calendar, tasks, and emails into a morning briefing.
          </p>
        </div>
      ),
    },
    {
      title: "Step 1: Choose a Workflow Template",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Just like with AI Agents, the fastest way to create a workflow is to start with a pre-built template. Templates handle common automation needs and can be customized.
          </p>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-sm">Daily Summary</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Compiles your schedule, tasks, and important emails every morning
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-sm">Email to Task</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically creates tasks from flagged emails
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <h4 className="font-semibold text-sm">Document Backup</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Syncs important files to cloud storage automatically
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <h4 className="font-semibold text-sm">Meeting Prep</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Gathers context and notes before scheduled meetings
              </p>
            </div>
          </div>

          <Card className="p-6 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Action Required
            </h4>
            <ol className="space-y-3 ml-6 mb-4">
              <li className="list-decimal">
                Click the button below to open the <strong>Workflow Templates</strong> page
              </li>
              <li className="list-decimal">
                Find the <strong>"Daily Summary"</strong> template
              </li>
              <li className="list-decimal">
                Click <strong>"Use Template"</strong> to start creating your workflow
              </li>
            </ol>

            <Link href="/dashboard/workflows/templates" target="_blank">
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                <Zap className="h-4 w-4 mr-2" />
                Browse Workflow Templates
              </Button>
            </Link>

            <p className="text-sm text-muted-foreground mt-4">
              💡 Tip: The page will open in a new tab so you can follow along.
            </p>
          </Card>
        </div>
      ),
    },
    {
      title: "Step 2: Configure Workflow Steps",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Workflows are made up of <strong>steps</strong> that execute in order. Each step performs one action, like "Get calendar events" or "Send email."
          </p>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Daily Summary Workflow Steps</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">Get Today's Calendar Events</p>
                  <p className="text-xs text-muted-foreground">Fetches all meetings scheduled for today</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">Get Unread Important Emails</p>
                  <p className="text-xs text-muted-foreground">Checks inbox for flagged or high-priority messages</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Get Today's Tasks</p>
                  <p className="text-xs text-muted-foreground">Retrieves tasks due today or marked as priority</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  4
                </div>
                <div>
                  <p className="font-medium text-sm">Format Summary</p>
                  <p className="text-xs text-muted-foreground">Uses AI to compile everything into a readable brief</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                  5
                </div>
                <div>
                  <p className="font-medium text-sm">Send Summary</p>
                  <p className="text-xs text-muted-foreground">Delivers the summary via email or Slack</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold">Step Configuration</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Each step needs to be configured with specific settings:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• <strong>Calendar:</strong> Select which calendar to check</li>
                <li>• <strong>Email:</strong> Choose filtering criteria (flagged, from specific senders)</li>
                <li>• <strong>Tasks:</strong> Select task list and due date range</li>
                <li>• <strong>Summary:</strong> Customize the format and tone</li>
                <li>• <strong>Delivery:</strong> Choose email, Slack, or both</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Pro Tip:</strong> Templates come pre-configured with smart defaults. You can use them as-is and customize later once you see how they work!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 3: Set Up the Trigger",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            A <strong>trigger</strong> determines when your workflow runs. Workflows can be triggered by schedules, events, or manually.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-sm mb-2">⏰ Schedule</h4>
              <p className="text-xs text-muted-foreground">
                Run at specific times (e.g., every weekday at 8 AM)
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-2">🔔 Event</h4>
              <p className="text-xs text-muted-foreground">
                Triggered by actions (e.g., new email received, task created)
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <h4 className="font-semibold text-sm mb-2">👆 Manual</h4>
              <p className="text-xs text-muted-foreground">
                Run on-demand whenever you click "Execute"
              </p>
            </div>
          </div>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200">
            <h4 className="font-semibold mb-3">Recommended Trigger for Daily Summary</h4>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <p className="font-medium text-sm mb-2">Schedule: Every Weekday at 8:00 AM</p>
              <p className="text-xs text-muted-foreground mb-3">
                This ensures you get your summary every Monday through Friday at the start of your workday.
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                <code className="text-xs">Cron: 0 8 * * 1-5</code>
              </div>
            </div>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Don't worry about cron syntax!</strong> The template includes a visual schedule picker where you can simply select "Every weekday at 8 AM" from a dropdown.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 4: Test Your Workflow",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Before activating your workflow on a schedule, you should test it to make sure everything works correctly.
          </p>

          <Card className="p-6 border-green-200 dark:border-green-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <TestTube2 className="h-5 w-5 text-green-600" />
              How to Test Your Workflow
            </h4>
            <ol className="space-y-3 ml-6">
              <li className="list-decimal">
                <strong>Click "Test Run"</strong> - This executes the workflow immediately without waiting for the schedule
              </li>
              <li className="list-decimal">
                <strong>Watch the execution log</strong> - You'll see each step run in real-time with green checkmarks
              </li>
              <li className="list-decimal">
                <strong>Check your delivery method</strong> - Verify the summary arrived in your email or Slack
              </li>
              <li className="list-decimal">
                <strong>Review the content</strong> - Make sure the summary includes the right information
              </li>
            </ol>
          </Card>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Common Testing Issues</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Empty summary:</strong> You might not have any events or tasks today - that's okay!</li>
                  <li>• <strong>Connection errors:</strong> Make sure you've connected your calendar and email integrations</li>
                  <li>• <strong>Permission denied:</strong> Check that you granted the necessary OAuth permissions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Success!</strong> Once your test run completes successfully, click "Activate Workflow" to turn on the schedule. Your Daily Summary will now run automatically every weekday morning.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Understanding Workflow Logs & Monitoring",
      type: "tip" as const,
      content: (
        <div className="space-y-4">
          <p>
            After your workflow is active, you can monitor its performance and troubleshoot any issues using the execution logs.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-2">📊 Execution History</h4>
              <p className="text-xs text-muted-foreground">
                See every time your workflow ran, how long it took, and whether it succeeded or failed.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <h4 className="font-semibold text-sm mb-2">🔍 Step-by-Step Logs</h4>
              <p className="text-xs text-muted-foreground">
                Click any execution to see detailed logs for each step, including input/output data.
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-sm mb-2">⚠️ Error Alerts</h4>
              <p className="text-xs text-muted-foreground">
                Get notified if a workflow fails so you can fix issues quickly.
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-sm mb-2">📈 Performance Metrics</h4>
              <p className="text-xs text-muted-foreground">
                Track success rate, average execution time, and total runs.
              </p>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mt-4">
            <h4 className="font-semibold mb-3">Next Steps with Workflows</h4>
            <ul className="space-y-2 ml-6 text-sm">
              <li className="list-disc">Add conditional logic to handle different scenarios (e.g., different summary format on Mondays)</li>
              <li className="list-disc">Chain workflows together - trigger one workflow when another completes</li>
              <li className="list-disc">Combine workflows with AI Agents for intelligent automation</li>
              <li className="list-disc">Create error handling steps to retry failed operations</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const practiceExercise = (
    <div className="space-y-4">
      <p className="text-lg">
        Great work creating your Daily Summary workflow! Now let's practice by creating another useful workflow:
      </p>

      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <h3 className="font-semibold text-lg mb-4">Challenge: Create an "Email to Task" Workflow</h3>
        <p className="mb-4">
          Go back to the workflow templates and create an <strong>Email to Task</strong> workflow. This workflow will:
        </p>
        <ul className="space-y-2 ml-6 mb-4">
          <li className="list-disc">Watch for emails you flag or star in your inbox</li>
          <li className="list-disc">Automatically create a task with the email subject as the title</li>
          <li className="list-disc">Include a link to the original email in the task description</li>
          <li className="list-disc">Set the due date based on keywords in the email (e.g., "urgent," "tomorrow")</li>
        </ul>

        <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm mb-1">Success Criteria</p>
            <p className="text-xs text-muted-foreground">
              You've completed this exercise when you have two active workflows shown on your Workflows dashboard, and you've successfully tested the Email to Task workflow.
            </p>
          </div>
        </div>
      </Card>

      <Link href="/dashboard/workflows/templates" target="_blank">
        <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
          Start Practice Exercise
        </Button>
      </Link>
    </div>
  );

  const quiz = [
    {
      question: "What's the main difference between AI Agents and Workflows?",
      options: [
        "Agents are faster than workflows",
        "Agents make intelligent decisions, workflows follow predefined steps",
        "Workflows are more expensive",
        "Agents can't be scheduled",
      ],
      correctAnswer: 1,
      explanation: "AI Agents can understand context and make intelligent decisions, while Workflows follow a predefined sequence of steps. Both are powerful for different use cases!",
    },
    {
      question: "What is a 'trigger' in a workflow?",
      options: [
        "The final step that delivers results",
        "An error that stops execution",
        "What determines when the workflow runs",
        "The most important step in the workflow",
      ],
      correctAnswer: 2,
      explanation: "A trigger determines when your workflow executes - whether on a schedule, in response to an event, or manually.",
    },
    {
      question: "Why should you test a workflow before activating it?",
      options: [
        "Testing is optional and not necessary",
        "To verify each step works correctly and produces the expected output",
        "Because workflows don't work without testing",
        "To make the workflow run faster",
      ],
      correctAnswer: 1,
      explanation: "Testing ensures all steps are configured correctly, permissions are granted, and the workflow produces the expected results before you rely on it to run automatically.",
    },
  ];

  return (
    <LessonLayout
      lessonId="quick-start-3"
      pathId="quick-start"
      title="Set Up Your First Workflow"
      description="Learn how to create automated workflows that save you time every day."
      estimatedTime={4}
      difficulty="beginner"
      sections={sections}
      practiceExercise={practiceExercise}
      quiz={quiz}
      previousLesson={{
        id: "quick-start-2",
        title: "Create Your First AI Agent",
        href: "/dashboard/training/lessons/quick-start-2",
      }}
      nextLesson={{
        id: "quick-start-4",
        title: "Upload to Knowledge Base",
        href: "/dashboard/training/lessons/quick-start-4",
      }}
    />
  );
}
