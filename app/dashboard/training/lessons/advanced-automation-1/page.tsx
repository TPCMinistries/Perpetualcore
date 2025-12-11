"use client";

import { LessonLayout } from "@/components/training/LessonLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Layers, Code, Play, Settings, Zap } from "lucide-react";
import Link from "next/link";

export default function AdvancedAutomation1() {
  const sections = [
    {
      title: "Beyond Basic Workflows",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            You've learned how to create simple workflows with templates. Now it's time to master the Workflow Builder - a powerful visual tool that lets you design complex automations from scratch.
          </p>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">What You'll Learn</h4>
            <ul className="space-y-2 ml-6 text-sm">
              <li className="list-disc">The anatomy of a workflow - triggers, steps, and outputs</li>
              <li className="list-disc">How to use the drag-and-drop visual builder</li>
              <li className="list-disc">Working with data: inputs, outputs, and transformations</li>
              <li className="list-disc">Advanced step types and their use cases</li>
              <li className="list-disc">Best practices for workflow design</li>
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Template Workflows</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Quick to set up</li>
                <li>✓ Pre-configured steps</li>
                <li>✓ Best for common use cases</li>
                <li>✗ Limited customization</li>
              </ul>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Custom Workflows</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Fully customizable</li>
                <li>✓ Unlimited step combinations</li>
                <li>✓ Tailored to your exact needs</li>
                <li>⚠ Requires more setup time</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Workflow Anatomy: Understanding the Parts",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p>
            Every workflow consists of three core components. Understanding these is essential for building effective automations.
          </p>

          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <h4 className="font-semibold">Trigger</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                The event that starts your workflow execution.
              </p>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                  <p className="font-medium text-xs mb-1">⏰ Schedule</p>
                  <p className="text-xs text-muted-foreground">Time-based triggers (cron)</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                  <p className="font-medium text-xs mb-1">🔔 Event</p>
                  <p className="text-xs text-muted-foreground">App events (new email, task created)</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                  <p className="font-medium text-xs mb-1">🌐 Webhook</p>
                  <p className="text-xs text-muted-foreground">External API calls</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <h4 className="font-semibold">Steps</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                The actions your workflow performs, executed in sequence.
              </p>
              <div className="space-y-2">
                <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                  <p className="font-medium text-xs mb-1">Data Operations</p>
                  <p className="text-xs text-muted-foreground">Fetch, transform, filter, aggregate data</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                  <p className="font-medium text-xs mb-1">Integration Actions</p>
                  <p className="text-xs text-muted-foreground">Send email, create task, post to Slack</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                  <p className="font-medium text-xs mb-1">AI Operations</p>
                  <p className="text-xs text-muted-foreground">Analyze text, generate content, classify data</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                  <p className="font-medium text-xs mb-1">Control Flow</p>
                  <p className="text-xs text-muted-foreground">Conditions, loops, delays</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                  3
                </div>
                <h4 className="font-semibold">Outputs</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                The results of your workflow - data to store, messages to send, or actions to take.
              </p>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="text-xs text-muted-foreground">
                  Outputs can be returned as JSON data, sent as notifications, stored in databases, or passed to other workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "The Visual Workflow Builder",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            The Workflow Builder is a drag-and-drop canvas where you design your automation visually. Let's explore its interface.
          </p>

          <Card className="p-6 border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Workflow className="h-5 w-5 text-blue-600" />
              Open the Workflow Builder
            </h4>
            <ol className="space-y-2 ml-6 mb-4 text-sm">
              <li className="list-decimal">Click the button below to open the Workflows page</li>
              <li className="list-decimal">Click "Create New Workflow" (not a template)</li>
              <li className="list-decimal">You'll see the visual builder canvas</li>
            </ol>

            <Link href="/dashboard/workflows/create" target="_blank">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                <Workflow className="h-4 w-4 mr-2" />
                Open Workflow Builder
              </Button>
            </Link>
          </Card>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Builder Interface Tour</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <Layers className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Left Sidebar: Step Library</p>
                  <p className="text-xs text-muted-foreground">Browse and search all available steps. Drag them onto the canvas.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Workflow className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Center Canvas: Workflow Design</p>
                  <p className="text-xs text-muted-foreground">Visual representation of your workflow. Connect steps with arrows.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Settings className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Right Panel: Step Configuration</p>
                  <p className="text-xs text-muted-foreground">Configure selected step's settings and parameters.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Play className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Top Bar: Actions</p>
                  <p className="text-xs text-muted-foreground">Test, save, activate, and view execution history.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Pro Tip:</strong> Use keyboard shortcuts for faster workflow building: Space to search steps, Cmd+Z to undo, Cmd+S to save.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Working with Data: Inputs & Outputs",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p>
            The real power of workflows comes from passing data between steps. Each step can receive inputs and produce outputs that feed into subsequent steps.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Data Flow Example</h4>
            <div className="space-y-3">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-medium">Step 1</div>
                  <p className="font-medium text-sm">Fetch Emails</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Input: filter = "is:unread"</p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                  <code className="text-xs">{`Output: emails = [{"from": "...", "subject": "...", "body": "..."}]`}</code>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-blue-600">↓ Data flows down</div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded text-xs font-medium">Step 2</div>
                  <p className="font-medium text-sm">AI: Summarize</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Input: emails (from Step 1)</p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                  <code className="text-xs">Output: summary = "You have 5 unread emails about..."</code>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="text-blue-600">↓ Data flows down</div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 rounded text-xs font-medium">Step 3</div>
                  <p className="font-medium text-sm">Send Slack Message</p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Input: summary (from Step 2)</p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                  <code className="text-xs">Output: message_sent = true</code>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Referencing Previous Steps</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Use the syntax <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{stepName.outputField}}"}</code> to reference data from previous steps:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{step1.emails}}"}</code> - All emails from step 1</li>
                <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{step1.emails[0].subject}}"}</code> - First email's subject</li>
                <li>• <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{step2.summary}}"}</code> - Summary from step 2</li>
              </ul>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2">Data Transformations</h4>
              <p className="text-xs text-muted-foreground mb-2">
                Built-in functions let you transform data on the fly:
              </p>
              <div className="space-y-1">
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded">
                  <code className="text-xs">{"{{step1.emails | length}}"}</code> <span className="text-xs text-muted-foreground">- Count items</span>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded">
                  <code className="text-xs">{"{{step1.email.subject | uppercase}}"}</code> <span className="text-xs text-muted-foreground">- Convert to uppercase</span>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded">
                  <code className="text-xs">{"{{step1.emails | filter('urgent')}}"}</code> <span className="text-xs text-muted-foreground">- Filter by keyword</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Advanced Step Types",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p>
            Beyond basic integration steps, Perpetual Core provides powerful specialized step types for complex workflows.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Code className="h-4 w-4 text-blue-600" />
                Code Step
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Write custom JavaScript/Python for complex transformations
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border text-xs">
                <code>
                  {`// Example: Parse custom data
const result = data.map(item => ({
  name: item.fullName,
  email: item.contact.email
}));
return result;`}
                </code>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                AI Step
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Use AI for classification, extraction, generation
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border text-xs">
                <p className="text-muted-foreground">
                  Prompt: "Classify this email as: urgent, normal, or spam"
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2">HTTP Request</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Call any external API
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border text-xs">
                <code>POST https://api.example.com/data</code>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2">Database Query</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Query databases (Postgres, MySQL, MongoDB)
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border text-xs">
                <code>SELECT * FROM users WHERE active = true</code>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2">Sub-Workflow</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Call another workflow as a step
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border text-xs text-muted-foreground">
                Enables workflow reusability and modularity
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-sm mb-2">Iterator/Loop</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Repeat steps for each item in a list
              </p>
              <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border text-xs text-muted-foreground">
                Process 100 emails one by one
              </div>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: "Workflow Design Best Practices",
      type: "tip" as const,
      content: (
        <div className="space-y-4">
          <p>
            Following these best practices will help you build reliable, maintainable workflows.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <h4 className="font-semibold text-sm mb-2 text-green-700 dark:text-green-400">✓ DO</h4>
              <ul className="text-xs space-y-2">
                <li>• Give steps descriptive names</li>
                <li>• Add comments explaining complex logic</li>
                <li>• Test each step individually first</li>
                <li>• Handle errors gracefully</li>
                <li>• Use sub-workflows for reusable logic</li>
                <li>• Keep workflows focused on one task</li>
                <li>• Version control your workflows</li>
              </ul>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
              <h4 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-400">✗ DON'T</h4>
              <ul className="text-xs space-y-2">
                <li>• Create overly complex workflows (&gt;20 steps)</li>
                <li>• Hardcode values - use variables instead</li>
                <li>• Ignore error handling</li>
                <li>• Skip testing before activating</li>
                <li>• Use the same workflow for multiple unrelated tasks</li>
                <li>• Forget to add logging for debugging</li>
                <li>• Leave workflows without documentation</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Performance Tips</h4>
            <ul className="space-y-2 text-sm ml-6">
              <li className="list-disc"><strong>Minimize API calls:</strong> Batch requests when possible</li>
              <li className="list-disc"><strong>Use caching:</strong> Store frequently accessed data</li>
              <li className="list-disc"><strong>Filter early:</strong> Reduce data before processing</li>
              <li className="list-disc"><strong>Parallel execution:</strong> Run independent steps simultaneously</li>
              <li className="list-disc"><strong>Set timeouts:</strong> Prevent workflows from running indefinitely</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const practiceExercise = (
    <div className="space-y-4">
      <p className="text-lg">
        Now it's time to build a custom workflow from scratch using the visual builder!
      </p>

      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <h3 className="font-semibold text-lg mb-4">Challenge: Build a "Content Aggregator" Workflow</h3>
        <p className="mb-4">
          Create a workflow that collects content from multiple sources and generates a digest:
        </p>
        <ol className="space-y-3 ml-6 mb-4">
          <li className="list-decimal">
            <strong>Trigger:</strong> Schedule (daily at 9 AM)
          </li>
          <li className="list-decimal">
            <strong>Step 1:</strong> Fetch RSS feeds from 3 different sources
          </li>
          <li className="list-decimal">
            <strong>Step 2:</strong> Filter articles for relevant keywords
          </li>
          <li className="list-decimal">
            <strong>Step 3:</strong> Use AI to summarize each article (1-2 sentences)
          </li>
          <li className="list-decimal">
            <strong>Step 4:</strong> Combine summaries into a formatted digest
          </li>
          <li className="list-decimal">
            <strong>Step 5:</strong> Send digest via email or Slack
          </li>
        </ol>

        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm">
            <strong>Challenge Mode:</strong> Add a Code step that calculates reading time for each article based on word count.
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border">
          <div className="h-5 w-5 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
            ✓
          </div>
          <div>
            <p className="font-medium text-sm mb-1">Success Criteria</p>
            <p className="text-xs text-muted-foreground">
              Your workflow should successfully fetch, filter, summarize, and deliver content in a single automated execution.
            </p>
          </div>
        </div>
      </Card>

      <Link href="/dashboard/workflows/create" target="_blank">
        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
          Start Building
        </Button>
      </Link>
    </div>
  );

  const quiz = [
    {
      question: "What are the three core components of every workflow?",
      options: [
        "Header, Body, Footer",
        "Trigger, Steps, Outputs",
        "Input, Process, Storage",
        "Start, Middle, End",
      ],
      correctAnswer: 1,
      explanation: "Every workflow consists of a Trigger (what starts it), Steps (actions performed), and Outputs (results produced).",
    },
    {
      question: "How do you reference data from a previous step in a workflow?",
      options: [
        "Copy and paste the data manually",
        "Use the syntax {{stepName.outputField}}",
        "Wait for the step to email you the data",
        "Previous step data is not accessible",
      ],
      correctAnswer: 1,
      explanation: "The {{stepName.outputField}} syntax allows you to reference outputs from any previous step in your workflow.",
    },
    {
      question: "Which step type would you use to process each item in a list individually?",
      options: [
        "Code Step",
        "AI Step",
        "Iterator/Loop Step",
        "Filter Step",
      ],
      correctAnswer: 2,
      explanation: "Iterator/Loop steps repeat a set of actions for each item in a list, perfect for batch processing data.",
    },
  ];

  return (
    <LessonLayout
      lessonId="advanced-automation-1"
      pathId="advanced-automation"
      title="Workflow Builder Deep Dive"
      description="Master the visual workflow builder and learn to create complex automations from scratch."
      estimatedTime={8}
      difficulty="advanced"
      sections={sections}
      practiceExercise={practiceExercise}
      quiz={quiz}
      nextLesson={{
        id: "advanced-automation-2",
        title: "Conditional Logic & Branching",
        href: "/dashboard/training/lessons/advanced-automation-2",
      }}
    />
  );
}
