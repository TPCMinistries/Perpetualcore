"use client";

import { LessonLayout } from "@/components/training/LessonLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Search, Brain, FileText, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function QuickStartLesson4() {
  const sections = [
    {
      title: "What is the Knowledge Base?",
      type: "text" as const,
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            The <strong>Knowledge Base</strong> is where you upload documents, PDFs, spreadsheets, and other data. Once uploaded, AI can instantly search, analyze, and reference this information to answer questions and help with tasks.
          </p>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">How It Works</h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-sm">You Upload Documents</p>
                  <p className="text-xs text-muted-foreground">PDFs, Word docs, spreadsheets, text files, presentations</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-sm">AI Processes Content</p>
                  <p className="text-xs text-muted-foreground">Extracts text, creates searchable index, understands context</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium text-sm">Instant Answers</p>
                  <p className="text-xs text-muted-foreground">Ask questions in natural language, get accurate answers with citations</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-semibold mb-2 text-sm">What You Can Upload</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Company policies & procedures</li>
                <li>• Product documentation</li>
                <li>• Meeting notes & transcripts</li>
                <li>• Research papers & reports</li>
                <li>• Customer FAQs</li>
                <li>• Training materials</li>
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
                <li>• Power AI Agents with knowledge</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Step 1: Navigate to Knowledge Base",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Let's upload your first documents! The Knowledge Base is organized into <strong>collections</strong> that group related documents together.
          </p>

          <Card className="p-6 border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              Action Required
            </h4>
            <ol className="space-y-3 ml-6 mb-4">
              <li className="list-decimal">
                Click the button below to open the <strong>Knowledge Library</strong>
              </li>
              <li className="list-decimal">
                You'll see existing collections or the option to create a new one
              </li>
              <li className="list-decimal">
                Click <strong>"Create Collection"</strong> to start organizing your documents
              </li>
            </ol>

            <Link href="/dashboard/knowledge" target="_blank">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                <BookOpen className="h-4 w-4 mr-2" />
                Open Knowledge Library
              </Button>
            </Link>

            <p className="text-sm text-muted-foreground mt-4">
              💡 Tip: Collections help organize documents by topic, project, or department.
            </p>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Example Collections</h4>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="font-medium text-sm mb-1">📚 Company Handbook</p>
                <p className="text-xs text-muted-foreground">Policies, benefits, procedures</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="font-medium text-sm mb-1">🚀 Product Documentation</p>
                <p className="text-xs text-muted-foreground">User guides, API docs, tutorials</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="font-medium text-sm mb-1">💼 Project Files</p>
                <p className="text-xs text-muted-foreground">Proposals, contracts, reports</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="font-medium text-sm mb-1">🎓 Training Materials</p>
                <p className="text-xs text-muted-foreground">Onboarding, courses, guides</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Step 2: Upload Your Documents",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Once you've created a collection, you can upload documents. Perpetual Core supports a wide range of file types and can process them automatically.
          </p>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Supported File Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-red-600" />
                <p className="text-xs font-medium">PDF</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                <p className="text-xs font-medium">Word</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <p className="text-xs font-medium">Excel</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                <p className="text-xs font-medium">PowerPoint</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                <p className="text-xs font-medium">Text</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                <p className="text-xs font-medium">Markdown</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
                <p className="text-xs font-medium">CSV</p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded border text-center">
                <FileText className="h-6 w-6 mx-auto mb-1 text-pink-600" />
                <p className="text-xs font-medium">JSON</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-600" />
                Upload Methods
              </h4>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Drag & Drop:</strong> Drag files directly onto the upload area</li>
                <li>• <strong>File Picker:</strong> Click to browse your computer</li>
                <li>• <strong>Bulk Upload:</strong> Upload multiple files at once (up to 100)</li>
                <li>• <strong>URL Import:</strong> Import documents from web URLs</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Processing Time:</strong> Most documents are processed within 30 seconds. Large files (50+ pages) may take a few minutes. You'll get a notification when processing is complete!
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">For This Exercise</h4>
            <p className="text-sm text-muted-foreground">
              Upload at least <strong>2-3 documents</strong> to your collection. These can be work documents, PDFs you've saved, or any text-based files. The more relevant content you add, the more useful your Knowledge Base becomes!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 3: Test Knowledge Base Search",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Now that your documents are uploaded and processed, let's test the Knowledge Base by asking questions!
          </p>

          <Card className="p-6 border-green-200 dark:border-green-800">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-green-600" />
              Try These Search Methods
            </h4>

            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <p className="font-medium text-sm mb-2">1. Keyword Search</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Search for specific terms or phrases that appear in your documents
                </p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                  <code className="text-xs">Example: "vacation policy" or "API authentication"</code>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <p className="font-medium text-sm mb-2">2. Natural Language Questions</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Ask questions in plain English - AI understands context
                </p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                  <code className="text-xs">Example: "How many vacation days do I get?" or "What's the process for expense reimbursement?"</code>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border">
                <p className="font-medium text-sm mb-2">3. Semantic Search</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Find information by concept, even if the exact words don't match
                </p>
                <div className="p-2 bg-gray-50 dark:bg-gray-950 rounded border border-dashed">
                  <code className="text-xs">Example: Search "time off" to find documents about "vacation", "PTO", or "leave"</code>
                </div>
              </div>
            </div>
          </Card>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Understanding AI Answers
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              When AI answers your question, it will:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4">
              <li>• Provide a clear, natural language answer</li>
              <li>• <strong>Cite the source documents</strong> so you can verify information</li>
              <li>• Show relevant excerpts from the documents</li>
              <li>• Indicate confidence level if uncertain</li>
              <li>• Suggest related documents or topics</li>
            </ul>
          </div>

          <Link href="/dashboard/search" target="_blank">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              <Search className="h-4 w-4 mr-2" />
              Try Knowledge Base Search
            </Button>
          </Link>
        </div>
      ),
    },
    {
      title: "Step 4: Use Knowledge in AI Chat",
      type: "interactive" as const,
      content: (
        <div className="space-y-4">
          <p>
            Your Knowledge Base doesn't just work in search - it also powers AI Chat, Agents, and Workflows. Let's see how!
          </p>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Knowledge-Powered AI Chat</h4>
            <p className="text-sm text-muted-foreground mb-3">
              When you chat with AI, it can access your Knowledge Base to provide accurate, personalized answers based on YOUR documents.
            </p>
            <div className="space-y-2">
              <div className="p-3 bg-white dark:bg-gray-900 rounded border">
                <p className="text-xs font-medium mb-1">💬 Example Conversation</p>
                <div className="space-y-2">
                  <p className="text-xs"><strong>You:</strong> "Summarize our Q4 product roadmap"</p>
                  <p className="text-xs text-muted-foreground"><strong>AI:</strong> *Reads your uploaded roadmap document* "Based on your Q4 roadmap document, you're planning to launch 3 major features..."</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Try It Now
            </h4>
            <ol className="space-y-2 ml-6 mb-4 text-sm">
              <li className="list-decimal">Open AI Chat using the button below</li>
              <li className="list-decimal">Ask a question about content in your uploaded documents</li>
              <li className="list-decimal">Watch as AI retrieves and uses that information to answer</li>
              <li className="list-decimal">Check the citations to see which documents were referenced</li>
            </ol>

            <Link href="/dashboard/chat" target="_blank">
              <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                Open AI Chat
              </Button>
            </Link>
          </Card>

          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm">
              <strong>Pro Tip:</strong> You can explicitly tell AI which collection to use by saying "Search my Product Documentation collection for..." This narrows the scope for more precise answers.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Advanced Knowledge Base Features",
      type: "tip" as const,
      content: (
        <div className="space-y-4">
          <p>
            You've learned the basics! Here are some advanced features to explore as you grow your Knowledge Base:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-sm mb-2">🏷️ Document Metadata</h4>
              <p className="text-xs text-muted-foreground">
                Add tags, categories, and custom fields to make documents easier to find and organize.
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-sm mb-2">🔄 Auto-Sync</h4>
              <p className="text-xs text-muted-foreground">
                Connect to Google Drive, Dropbox, or SharePoint to automatically sync new documents.
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
              <h4 className="font-semibold text-sm mb-2">👥 Team Sharing</h4>
              <p className="text-xs text-muted-foreground">
                Share collections with teammates or keep them private. Control who can view and edit.
              </p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-sm mb-2">📊 Usage Analytics</h4>
              <p className="text-xs text-muted-foreground">
                See which documents are accessed most, common questions, and search trends.
              </p>
            </div>
            <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg border border-pink-200">
              <h4 className="font-semibold text-sm mb-2">🤖 Agent Integration</h4>
              <p className="text-xs text-muted-foreground">
                Configure AI Agents to use specific collections as their knowledge source.
              </p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-sm mb-2">🔒 Version Control</h4>
              <p className="text-xs text-muted-foreground">
                Track document versions and roll back to previous versions if needed.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-4">
            <h4 className="font-semibold mb-3">Best Practices</h4>
            <ul className="space-y-2 ml-6 text-sm">
              <li className="list-disc"><strong>Organize by topic:</strong> Create separate collections for different departments, projects, or use cases</li>
              <li className="list-disc"><strong>Keep documents updated:</strong> Replace old versions when policies or information changes</li>
              <li className="list-disc"><strong>Use descriptive names:</strong> Name files clearly so they're easy to find in search results</li>
              <li className="list-disc"><strong>Start small:</strong> Begin with your most frequently referenced documents, expand over time</li>
              <li className="list-disc"><strong>Test regularly:</strong> Ask questions to verify AI is finding the right information</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const practiceExercise = (
    <div className="space-y-4">
      <p className="text-lg">
        Excellent work setting up your Knowledge Base! Now let's put it to the test with a practical exercise:
      </p>

      <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
        <h3 className="font-semibold text-lg mb-4">Challenge: Build a Department Knowledge Collection</h3>
        <p className="mb-4">
          Create a specialized collection for a specific purpose:
        </p>
        <ul className="space-y-2 ml-6 mb-4">
          <li className="list-disc">Create a new collection (e.g., "Customer Support Resources", "Engineering Docs", "Sales Playbook")</li>
          <li className="list-disc">Upload at least 5 related documents to this collection</li>
          <li className="list-disc">Use the search feature to ask 3 different questions about the content</li>
          <li className="list-disc">Open AI Chat and have it answer a question using your new collection</li>
          <li className="list-disc">Bonus: Configure a Customer Support Agent to use this collection as its knowledge source</li>
        </ul>

        <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm mb-1">Success Criteria</p>
            <p className="text-xs text-muted-foreground">
              You've completed this exercise when you have a collection with 5+ documents, you've successfully searched it, and AI Chat can answer questions using that knowledge.
            </p>
          </div>
        </div>
      </Card>

      <Link href="/dashboard/knowledge" target="_blank">
        <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
          Start Practice Exercise
        </Button>
      </Link>
    </div>
  );

  const quiz = [
    {
      question: "What happens after you upload a document to the Knowledge Base?",
      options: [
        "It's just stored for later download",
        "AI processes it to create a searchable index",
        "It's automatically shared with your team",
        "You need to manually tag every paragraph",
      ],
      correctAnswer: 1,
      explanation: "AI automatically processes uploaded documents, extracting text and creating a searchable index so you can immediately ask questions and find information.",
    },
    {
      question: "Which search method allows you to find concepts even if exact words don't match?",
      options: [
        "Keyword search",
        "File name search",
        "Semantic search",
        "Alphabetical search",
      ],
      correctAnswer: 2,
      explanation: "Semantic search understands meaning and context, so searching for 'time off' can find documents about 'vacation', 'PTO', or 'leave' even if those exact words aren't in your query.",
    },
    {
      question: "How can AI Agents use the Knowledge Base?",
      options: [
        "They can't access the Knowledge Base",
        "Only to find file names",
        "As a knowledge source to answer questions accurately",
        "Only if you manually copy information",
      ],
      correctAnswer: 2,
      explanation: "AI Agents can be configured to use specific Knowledge Base collections as their knowledge source, allowing them to provide accurate, company-specific answers to user questions.",
    },
  ];

  return (
    <LessonLayout
      lessonId="quick-start-4"
      pathId="quick-start"
      title="Upload to Knowledge Base"
      description="Learn how to upload documents and unlock AI-powered search and question answering."
      estimatedTime={4}
      difficulty="beginner"
      sections={sections}
      practiceExercise={practiceExercise}
      quiz={quiz}
      previousLesson={{
        id: "quick-start-3",
        title: "Set Up Your First Workflow",
        href: "/dashboard/training/lessons/quick-start-3",
      }}
      nextLesson={{
        id: "quick-start-5",
        title: "Connect Your Tools",
        href: "/dashboard/training/lessons/quick-start-5",
      }}
    />
  );
}
