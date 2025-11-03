"use client";

import { LessonLayout } from "@/components/training/LessonLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug, CheckCircle2, Mail, Calendar, MessageSquare, Database, Shield, Zap, Play, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function QuickStartLesson5() {
  const sections = [
    {
      title: "Why Connect Your Tools?",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Perpetual Core becomes exponentially more powerful when connected to the tools you already use every day. Integrations enable AI Agents and Workflows to read your emails, manage your calendar, send messages, and much more - all automatically.
          </p>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">What Integrations Unlock</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="font-medium text-sm">Without Integrations:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI can only work with data you manually upload</li>
                  <li>• You have to copy-paste information between tools</li>
                  <li>• Workflows can't access real-time data</li>
                  <li>• Agents can't take actions on your behalf</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-sm">With Integrations:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AI automatically accesses your calendar, email, tasks</li>
                  <li>• Information flows between tools automatically</li>
                  <li>• Workflows use live data from all your apps</li>
                  <li>• Agents can send emails, create tasks, schedule meetings</li>
                </ul>
              </div>
            </div>
          </div>

          <p>
            In this lesson, you'll connect your most important tools to Perpetual Core. We'll start with email and calendar since those power many common automations.
          </p>
        </div>
      ),
    },
    {
      title: "Available Integrations",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p>
            Perpetual Core supports dozens of popular business tools. Here are some of the most commonly used integrations:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Email</h4>
                  <p className="text-xs text-muted-foreground">Gmail, Outlook, IMAP</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Read, send, and organize emails. Perfect for customer support agents and email workflows.
              </p>
            </Card>

            <Card className="p-4 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Calendar</h4>
                  <p className="text-xs text-muted-foreground">Google Calendar, Outlook</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Access and manage events. Essential for daily summaries and meeting prep workflows.
              </p>
            </Card>

            <Card className="p-4 border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Communication</h4>
                  <p className="text-xs text-muted-foreground">Slack, Teams, Discord</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Send messages and notifications. Great for delivering workflow results to your team.
              </p>
            </Card>

            <Card className="p-4 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Database className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Cloud Storage</h4>
                  <p className="text-xs text-muted-foreground">Drive, Dropbox, OneDrive</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Access and sync files. Enables automatic document backup and knowledge base syncing.
              </p>
            </Card>

            <Card className="p-4 border-pink-200 dark:border-pink-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Project Management</h4>
                  <p className="text-xs text-muted-foreground">Asana, Trello, Jira, Monday</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Create and manage tasks. Power workflows that convert emails or notes to actionable tasks.
              </p>
            </Card>

            <Card className="p-4 border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Developer Tools</h4>
                  <p className="text-xs text-muted-foreground">GitHub, GitLab, Linear</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Manage code and issues. Great for engineering teams to automate dev workflows.
              </p>
            </Card>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>New integrations are added regularly!</strong> Check the Integrations page for the full list of 50+ supported tools.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 1: Connect Gmail/Email",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Let's start by connecting your email. This is one of the most valuable integrations because it enables so many powerful automations.
          </p>

          <Card className="p-6 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              Connect Your Email
            </h4>
            <ol className="space-y-3 ml-6 mb-4">
              <li className="list-decimal">
                Click the button below to open the <strong>Integrations</strong> page
              </li>
              <li className="list-decimal">
                Find the <strong>Gmail</strong> or <strong>Outlook</strong> integration card
              </li>
              <li className="list-decimal">
                Click <strong>"Connect"</strong> to start the OAuth authorization flow
              </li>
              <li className="list-decimal">
                Sign in to your email account and grant the requested permissions
              </li>
              <li className="list-decimal">
                You'll be redirected back to Perpetual Core once connected
              </li>
            </ol>

            <Link href="/dashboard/integrations" target="_blank">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                <Plug className="h-4 w-4 mr-2" />
                Open Integrations
              </Button>
            </Link>

            <p className="text-sm text-muted-foreground mt-4">
              💡 Tip: The page will open in a new tab so you can reference these instructions.
            </p>
          </Card>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Security & Permissions
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              When you connect an integration, you'll see a permissions screen explaining what access Perpetual Core needs:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• <strong>Read emails:</strong> Required for workflows that analyze or respond to emails</li>
              <li>• <strong>Send emails:</strong> Allows agents and workflows to send messages on your behalf</li>
              <li>• <strong>Manage labels:</strong> Enables automatic email organization</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              <strong>Privacy First:</strong> Perpetual Core only accesses data when executing a workflow or agent action. Your data is never used for training AI models.
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Common Connection Issues</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Popup blocked:</strong> Allow popups for Perpetual Core in your browser settings</li>
                  <li>• <strong>Authorization failed:</strong> Make sure you're signed in to the correct account</li>
                  <li>• <strong>Permissions denied:</strong> You must grant all requested permissions for the integration to work</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Step 2: Connect Calendar",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Next, let's connect your calendar. This enables workflows like your Daily Summary to show today's meetings and AI to help with scheduling.
          </p>

          <Card className="p-6 border-green-200 dark:border-green-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Connect Your Calendar
            </h4>
            <ol className="space-y-3 ml-6 mb-4">
              <li className="list-decimal">
                Go to the Integrations page (if not already open)
              </li>
              <li className="list-decimal">
                Find the <strong>Google Calendar</strong> or <strong>Outlook Calendar</strong> integration
              </li>
              <li className="list-decimal">
                Click <strong>"Connect"</strong> and authorize access
              </li>
              <li className="list-decimal">
                Select which calendars to sync (you can choose multiple)
              </li>
              <li className="list-decimal">
                Wait for the initial sync to complete (usually 10-30 seconds)
              </li>
            </ol>

            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">What You Can Do With Calendar Integration:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✅ Get daily summaries of your schedule</li>
                <li>✅ Prep for meetings with automatic context gathering</li>
                <li>✅ Create new events from email or task workflows</li>
                <li>✅ Find available time slots for scheduling</li>
                <li>✅ Get reminders and notifications before meetings</li>
              </ul>
            </div>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Pro Tip:</strong> If you use multiple calendars (work, personal, team), you can choose which ones to sync. This gives you fine-grained control over what data AI can access.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 3: Test Your Integrations",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Now that you've connected email and calendar, let's verify everything is working correctly.
          </p>

          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <h4 className="font-semibold mb-4">Test 1: Daily Summary Workflow</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Remember the Daily Summary workflow you created in Lesson 3? Now it can actually access your calendar and email!
              </p>
              <ol className="text-sm space-y-2 ml-6 mb-4">
                <li className="list-decimal">Go to the <strong>Workflows</strong> page</li>
                <li className="list-decimal">Find your Daily Summary workflow</li>
                <li className="list-decimal">Click <strong>"Test Run"</strong></li>
                <li className="list-decimal">Check the output - it should now include your real calendar events and emails</li>
              </ol>
              <Link href="/dashboard/workflows" target="_blank">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                  Test Daily Summary
                </Button>
              </Link>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <h4 className="font-semibold mb-4">Test 2: Ask AI About Your Schedule</h4>
              <p className="text-sm text-muted-foreground mb-3">
                With calendar connected, AI Chat can now answer questions about your real schedule.
              </p>
              <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 mb-4">
                <p className="text-sm font-medium mb-2">Try asking:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• "What meetings do I have today?"</li>
                  <li>• "When is my next meeting?"</li>
                  <li>• "Do I have any free time this afternoon?"</li>
                  <li>• "What's on my schedule for tomorrow?"</li>
                </ul>
              </div>
              <Link href="/dashboard/chat" target="_blank">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  Try AI Chat
                </Button>
              </Link>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <h4 className="font-semibold mb-4">Test 3: Email-Powered Agent</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Your Customer Support Agent can now read and respond to real emails!
              </p>
              <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 mb-4">
                <p className="text-sm font-medium mb-2">Enhancement Ideas:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Configure the agent to monitor a support inbox</li>
                  <li>• Set up auto-responses for common questions</li>
                  <li>• Route complex questions to your team</li>
                  <li>• Track response times and customer satisfaction</li>
                </ul>
              </div>
              <Link href="/dashboard/agents" target="_blank">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                  Configure Agent
                </Button>
              </Link>
            </Card>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Success!</strong> If all three tests work, your integrations are properly configured. You're now unlocking the full power of Perpetual Core!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Next Steps & Best Practices",
      type: "tip" as const,
      content: (
        <div className="space-y-4">
          <p>
            Congratulations on completing the Quick Start guide! You've learned the fundamentals of Perpetual Core. Here's how to continue your journey:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-2">🚀 Expand Your Integrations</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Connect more tools as you discover automation opportunities:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Slack for team notifications</li>
                <li>• Google Drive for document syncing</li>
                <li>• Project management tools for task automation</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <h4 className="font-semibold text-sm mb-2">🎯 Create More Workflows</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Build on what you've learned:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Meeting prep workflow</li>
                <li>• Weekly report automation</li>
                <li>• Email-to-task converter</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-sm mb-2">🤖 Build Specialized Agents</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Create agents for specific use cases:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Sales outreach assistant</li>
                <li>• Research & analysis agent</li>
                <li>• Content creation helper</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-sm mb-2">📚 Continue Learning</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Explore advanced topics:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Advanced Automation path</li>
                <li>• AI Agents Mastery course</li>
                <li>• Developer Integration guide</li>
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Integration Best Practices</h4>
            <ul className="space-y-2 ml-6 text-sm">
              <li className="list-disc"><strong>Start small:</strong> Connect essential tools first, add more as needed</li>
              <li className="list-disc"><strong>Review permissions:</strong> Periodically check which apps have access to your data</li>
              <li className="list-disc"><strong>Test before automating:</strong> Always test workflows with new integrations before activating schedules</li>
              <li className="list-disc"><strong>Monitor activity:</strong> Check integration logs to ensure everything is working smoothly</li>
              <li className="list-disc"><strong>Revoke unused connections:</strong> Disconnect integrations you're no longer using</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              You're Ready!
            </h4>
            <p className="text-sm text-muted-foreground">
              You now have the foundation to build powerful AI-driven automations. You've created agents, built workflows, uploaded knowledge, and connected your tools. The possibilities are endless - start experimenting and see how much time Perpetual Core can save you!
            </p>
          </div>

          <Link href="/dashboard/training/learning-paths" target="_blank">
            <Button className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Explore More Learning Paths
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const practiceExercise = (
    <div className="space-y-4">
      <p className="text-lg">
        Fantastic work! You've completed the Quick Start guide. Here's a final challenge to put everything together:
      </p>

      <Card className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <h3 className="font-semibold text-lg mb-4">Final Challenge: Build an End-to-End Automation</h3>
        <p className="mb-4">
          Create a complete automation that combines everything you've learned:
        </p>
        <ol className="space-y-3 ml-6 mb-4">
          <li className="list-decimal">
            <strong>Set up a new integration:</strong> Connect Slack, Teams, or another communication tool
          </li>
          <li className="list-decimal">
            <strong>Create a "Weekly Review" workflow:</strong> Runs every Friday at 4 PM
          </li>
          <li className="list-decimal">
            <strong>Configure it to:</strong>
            <ul className="ml-6 mt-2 space-y-1">
              <li className="list-disc">Pull next week's calendar events</li>
              <li className="list-disc">Check for any unread important emails</li>
              <li className="list-disc">Query your Knowledge Base for any project deadlines</li>
              <li className="list-disc">Use AI to compile everything into a formatted summary</li>
              <li className="list-disc">Send the summary to your communication tool</li>
            </ul>
          </li>
          <li className="list-decimal">
            <strong>Test it:</strong> Run it manually and verify the output
          </li>
          <li className="list-decimal">
            <strong>Activate it:</strong> Turn on the Friday 4 PM schedule
          </li>
        </ol>

        <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm mb-1">Success Criteria</p>
            <p className="text-xs text-muted-foreground">
              You've completed this challenge when your Weekly Review workflow successfully runs and delivers a comprehensive summary using data from multiple integrations.
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <p className="text-sm font-medium mb-2">Bonus Points:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Add conditional logic (different format for busy vs. light weeks)</li>
            <li>• Include an AI Agent that can answer questions about the summary</li>
            <li>• Create a dashboard widget showing your weekly prep status</li>
          </ul>
        </div>
      </Card>

      <Link href="/dashboard/workflows/create" target="_blank">
        <Button className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
          Start Final Challenge
        </Button>
      </Link>
    </div>
  );

  const quiz = [
    {
      question: "Why are integrations important in Perpetual Core?",
      options: [
        "They make the interface look nicer",
        "They enable AI to access real data and take actions across tools",
        "They're only needed for enterprise customers",
        "They replace your existing tools",
      ],
      correctAnswer: 1,
      explanation: "Integrations unlock the full power of Perpetual Core by enabling AI Agents and Workflows to access real data from your tools and take automated actions on your behalf.",
    },
    {
      question: "What happens during the OAuth authorization flow when connecting an integration?",
      options: [
        "Perpetual Core gets your password",
        "You grant specific permissions for Perpetual Core to access certain data",
        "All your data is automatically uploaded to Perpetual Core",
        "Nothing, it's just for show",
      ],
      correctAnswer: 1,
      explanation: "OAuth is a secure authorization method where you grant specific, limited permissions to Perpetual Core. You never share your password, and you control exactly what data Perpetual Core can access.",
    },
    {
      question: "After connecting email and calendar integrations, what should you do?",
      options: [
        "Nothing, they work automatically",
        "Restart your computer",
        "Test them with a workflow or AI Chat to verify they work",
        "Disconnect them immediately",
      ],
      correctAnswer: 2,
      explanation: "It's best practice to test new integrations by running a workflow or asking AI a question that requires that data. This ensures permissions were granted correctly and the connection works.",
    },
  ];

  return (
    <LessonLayout
      lessonId="quick-start-5"
      pathId="quick-start"
      title="Connect Your Tools"
      description="Integrate your email, calendar, and other tools to unlock the full power of AI automation."
      estimatedTime={5}
      difficulty="beginner"
      sections={sections}
      practiceExercise={practiceExercise}
      quiz={quiz}
      previousLesson={{
        id: "quick-start-4",
        title: "Upload to Knowledge Base",
        href: "/dashboard/training/lessons/quick-start-4",
      }}
    />
  );
}
