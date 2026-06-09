import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Seed training modules with starter content
 * Uses createAdminClient to bypass RLS (server-side seed operation)
 * Idempotent: checks for existing modules by title before inserting
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Auth check: verify super admin
    const userClient = await import("@/lib/supabase/server").then((m) =>
      m.createClient()
    );
    const {
      data: { user },
    } = await (await userClient).auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await (await userClient)
      .from("user_profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get organization and user for FK references
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("id", user.id)
      .single();

    if (!userProfile?.organization_id) {
      return NextResponse.json(
        { error: "User must belong to an organization to seed training modules." },
        { status: 400 }
      );
    }

    const organizationId = userProfile.organization_id;
    const createdBy = user.id;

    // Define training modules and their lessons
    const moduleDefs = [
      {
        module: {
          title: "Getting Started with Perpetual Core",
          description:
            "Learn the fundamentals of Perpetual Core: navigating your dashboard, setting up your first AI advisor, and managing documents. Perfect for new users who want to get productive fast.",
          category: "Onboarding",
          difficulty_level: "beginner" as const,
          estimated_duration_minutes: 30,
          is_mandatory: false,
          requires_completion: true,
          passing_score_percentage: 80,
          certificate_enabled: true,
          is_published: true,
          is_public: true,
          tags: ["onboarding", "getting-started", "basics"],
        },
        lessons: [
          {
            title: "Welcome to Your AI Operating System",
            description:
              "An overview of Perpetual Core's capabilities, your dashboard layout, and how to navigate between features.",
            lesson_order: 1,
            content_type: "document" as const,
            content_text: `# Welcome to Perpetual Core

## What is Perpetual Core?

Perpetual Core is your AI-powered operating system — a unified platform that brings together intelligent advisors, document management, automation workflows, and team collaboration in one place.

## Your Dashboard

When you first log in, you'll see your **Command Center** dashboard. Here's what each section does:

### Quick Actions
- **New Chat** — Start a conversation with your AI advisor
- **Upload Document** — Add files for AI-powered analysis
- **Create Task** — Track work items and projects

### Navigation
- **Home** — Your personalized dashboard with briefings and insights
- **Chat** — Interact with AI advisors across multiple models
- **Documents** — Upload, organize, and search your knowledge base
- **Projects** — Manage tasks, milestones, and team assignments
- **Marketplace** — Discover pre-built agents and workflows

## Getting Help

At any point, you can ask your AI advisor for help. Just type your question in the chat and it will guide you through any feature.

## Next Steps

In the next lesson, we'll set up your first AI advisor and configure it for your specific needs.`,
            estimated_duration_minutes: 8,
            is_required: true,
          },
          {
            title: "Setting Up Your First AI Advisor",
            description:
              "Configure an AI advisor tailored to your role, preferences, and communication style.",
            lesson_order: 2,
            content_type: "document" as const,
            content_text: `# Setting Up Your First AI Advisor

## What Are AI Advisors?

AI Advisors are intelligent assistants tailored to specific roles and tasks. Unlike generic chatbots, they understand your context, remember your preferences, and work with your data.

## Choosing Your Model

Perpetual Core supports multiple AI models, each with different strengths:

| Model | Best For | Speed | Cost |
|-------|----------|-------|------|
| GPT-4o Mini | Quick tasks, brainstorming | Fast | Low |
| GPT-4o | Complex analysis, writing | Medium | Medium |
| Claude Sonnet | Nuanced reasoning, long documents | Medium | Medium |
| Claude Opus | Deep analysis, strategic planning | Slower | Higher |

The system automatically routes your requests to the optimal model based on task complexity — you don't need to choose manually unless you want to.

## Personalizing Your Advisor

1. Go to **Settings > AI Preferences**
2. Set your **communication style** (concise, detailed, casual, formal)
3. Add your **role and industry** for contextual responses
4. Configure **memory settings** to control what your advisor remembers

## Tips for Great Results

- **Be specific** — "Draft a follow-up email to the client about the Q4 proposal" works better than "write an email"
- **Provide context** — Upload relevant documents so your advisor has background
- **Iterate** — Ask for revisions. "Make it more concise" or "Add more data points"

## Practice

Try asking your advisor: "Summarize what I should focus on this week based on my recent activity."`,
            estimated_duration_minutes: 12,
            is_required: true,
          },
          {
            title: "Uploading and Managing Documents",
            description:
              "Learn to upload, organize, and search documents with AI-powered intelligence.",
            lesson_order: 3,
            content_type: "document" as const,
            content_text: `# Uploading and Managing Documents

## Why Documents Matter

Your AI advisor becomes exponentially more useful when it has access to your documents. Upload contracts, reports, meeting notes, and research — then ask questions about them.

## Uploading Documents

1. Navigate to **Documents** in the sidebar
2. Click **Upload** or drag-and-drop files
3. Supported formats: PDF, DOCX, TXT, MD, images, audio, video

### What Happens After Upload

When you upload a document, Perpetual Core:
1. **Extracts text** from PDFs and images (OCR)
2. **Generates a summary** of key points
3. **Creates embeddings** for semantic search
4. **Identifies entities** (people, dates, amounts, organizations)
5. **Detects action items** and deadlines

## Organizing Your Knowledge Base

- **Collections** — Group related documents (e.g., "Q4 Contracts", "Board Materials")
- **Tags** — Add tags for cross-cutting categories
- **Smart Collections** — Auto-organize based on rules (e.g., all PDFs mentioning "budget")

## Searching Your Documents

Use natural language to find anything:
- "Find the contract with Acme Corp from last quarter"
- "Show me all documents mentioning revenue targets"
- "What did we agree on in the partnership meeting?"

## Pro Tips

- Upload meeting recordings — Perpetual Core transcribes and indexes them
- Link documents to projects for full context
- Use the document chat to ask questions about specific files

Congratulations! You've completed the Getting Started module. You now know how to navigate your dashboard, configure AI advisors, and manage your knowledge base.`,
            estimated_duration_minutes: 10,
            is_required: true,
          },
        ],
      },
      {
        module: {
          title: "Mastering AI Advisors",
          description:
            "Take your AI advisor skills to the next level. Learn about multi-model routing, persistent memory, prompt engineering, and how to build custom advisor personas for your team.",
          category: "Product Training",
          difficulty_level: "intermediate" as const,
          estimated_duration_minutes: 50,
          is_mandatory: false,
          requires_completion: true,
          passing_score_percentage: 80,
          certificate_enabled: true,
          is_published: true,
          is_public: true,
          tags: ["ai-advisors", "prompt-engineering", "advanced-chat"],
        },
        lessons: [
          {
            title: "Understanding Multi-Model Routing",
            description:
              "How Perpetual Core intelligently routes your requests to the optimal AI model for each task.",
            lesson_order: 1,
            content_type: "document" as const,
            content_text: `# Understanding Multi-Model Routing

## The Problem with Single-Model Systems

Most AI platforms force you to choose one model for everything. But different tasks need different capabilities:
- Quick Q&A doesn't need a frontier model
- Legal document review needs high accuracy
- Creative brainstorming benefits from diverse approaches

## How Routing Works

Perpetual Core's **Intelligent Model Router** analyzes your request and selects the best model:

### Routing Criteria
1. **Task complexity** — Simple lookups use fast models; complex analysis uses frontier models
2. **Domain specificity** — Legal, medical, and financial queries route to models with stronger domain knowledge
3. **Response length** — Short answers vs. long-form documents affect model selection
4. **Cost optimization** — Automatically balances quality with cost

### Model Tiers

| Tier | When Used | Models |
|------|-----------|--------|
| **Fast** | Quick answers, formatting, simple tasks | GPT-4o Mini |
| **Standard** | Most business tasks, writing, analysis | GPT-4o, Claude Sonnet |
| **Premium** | Complex reasoning, strategy, research | Claude Opus, GPT-4 Turbo |

## Overriding the Router

You can manually select a model by clicking the model selector in the chat header. This is useful when:
- You want a specific model's "personality"
- You're testing responses across models
- You need maximum quality regardless of cost

## Cost Tracking

View your model usage and costs in **Settings > Usage & Billing**. The router typically saves 40-60% compared to always using frontier models.`,
            estimated_duration_minutes: 10,
            is_required: true,
          },
          {
            title: "Leveraging Persistent Memory",
            description:
              "How your AI advisor remembers context across conversations and how to manage its memory.",
            lesson_order: 2,
            content_type: "document" as const,
            content_text: `# Leveraging Persistent Memory

## What is Persistent Memory?

Unlike standard chatbots that forget everything between sessions, Perpetual Core's AI advisors maintain **persistent memory** — they remember your preferences, past conversations, and important context.

## Types of Memory

### Short-Term Memory
- Current conversation context
- Automatically managed
- Cleared when conversation ends

### Long-Term Memory
- Learned preferences and patterns
- Key facts about you and your work
- Stored permanently until you remove them

### Organizational Memory
- Shared knowledge across your team
- Company-specific terminology and context
- Institutional knowledge from documents

## Managing Memory

### Viewing What's Remembered
Go to **Settings > AI Memory** to see what your advisor has stored. You'll find:
- Facts it has learned ("User prefers concise communication")
- Key entities ("Works at Acme Corp, reports to Jane Smith")
- Behavioral patterns ("Usually asks for follow-up emails after meetings")

### Adding Memory Manually
Tell your advisor directly:
- "Remember that our fiscal year starts in April"
- "Note: always use metric units in reports"
- "Remember that Project Phoenix is our top priority this quarter"

### Removing Memory
- Delete specific memories from the settings page
- Tell your advisor: "Forget that I mentioned [topic]"
- Clear all memory for a fresh start

## Best Practices

1. **Front-load context** in your first few conversations
2. **Correct mistakes** — "Actually, we use Slack not Teams"
3. **Review memory periodically** to prune outdated information
4. **Share relevant memories** across team advisors for consistency`,
            estimated_duration_minutes: 12,
            is_required: true,
          },
          {
            title: "Prompt Engineering for Business",
            description:
              "Write better prompts that get consistently excellent results from your AI advisor.",
            lesson_order: 3,
            content_type: "document" as const,
            content_text: `# Prompt Engineering for Business

## Why Prompts Matter

The quality of your AI advisor's output is directly proportional to the quality of your input. Great prompts lead to great results.

## The CRISP Framework

Use this framework for consistently excellent results:

### C — Context
Provide background information.
- Bad: "Write a proposal"
- Good: "We're a B2B SaaS company pitching our analytics platform to a Fortune 500 retailer"

### R — Role
Define who the AI should be.
- "Act as a senior financial analyst"
- "You're a marketing strategist with 15 years of experience"

### I — Instructions
Be specific about what you want.
- "Write a 500-word executive summary"
- "Create a bullet-point list of 10 risks"

### S — Specifics
Include constraints and requirements.
- "Use formal tone, no jargon"
- "Include data from Q3 earnings"
- "Format as a table with 4 columns"

### P — Purpose
Explain the end goal.
- "This will be presented to the board next Tuesday"
- "This email needs to re-engage a churned customer"

## Advanced Techniques

### Chain-of-Thought
Ask the AI to show its reasoning:
"Walk me through your analysis step by step before giving your recommendation."

### Few-Shot Examples
Show what you want:
"Here's an example of the format I want: [example]. Now create one for [new topic]."

### Iterative Refinement
Build on previous outputs:
"Good start. Now make the tone more authoritative and add specific metrics."

## Common Prompts by Role

| Role | Example Prompt |
|------|---------------|
| Executive | "Summarize this 50-page report into 5 key decisions I need to make" |
| Sales | "Draft a follow-up email for a prospect who went silent after our demo" |
| Marketing | "Generate 10 LinkedIn post ideas about AI in healthcare" |
| Legal | "Review this contract and flag any non-standard liability clauses" |
| HR | "Create interview questions for a senior product manager role" |`,
            estimated_duration_minutes: 15,
            is_required: true,
          },
          {
            title: "Building Custom Advisor Personas",
            description:
              "Create specialized AI advisors for different team functions and use cases.",
            lesson_order: 4,
            content_type: "document" as const,
            content_text: `# Building Custom Advisor Personas

## What Are Advisor Personas?

Advisor personas are pre-configured AI assistants tailored for specific roles or functions. Instead of one generic chatbot, your team gets specialized advisors:
- **Legal Advisor** — Reviews contracts, answers compliance questions
- **Sales Coach** — Helps reps craft pitches and handle objections
- **HR Assistant** — Answers policy questions, drafts job descriptions
- **Financial Analyst** — Runs projections, analyzes spending

## Creating a Custom Advisor

### Step 1: Navigate to Advisors
Go to **Dashboard > AI Advisors > Create New**

### Step 2: Define the Persona
- **Name** — Give it a memorable name (e.g., "Scout" for sales)
- **Description** — What this advisor specializes in
- **System Prompt** — The core instructions that shape behavior
- **Model Preference** — Which AI model to use by default

### Step 3: Add Knowledge
- Upload domain-specific documents
- Add FAQ pairs for common questions
- Link to relevant collections

### Step 4: Configure Behavior
- **Tone** — Professional, friendly, technical
- **Response Length** — Concise vs. detailed
- **Guardrails** — Topics to avoid, information to never share
- **Escalation Rules** — When to defer to a human

### Step 5: Test and Deploy
- Run test conversations
- Share with your team
- Monitor usage and refine

## Example System Prompt

Here's a system prompt for a Sales Coach advisor:

\`\`\`
You are Scout, a senior sales coach at [Company]. Your job is to help sales reps:
1. Craft personalized outreach messages
2. Handle common objections
3. Prepare for discovery calls
4. Review proposals before sending

Always reference our sales playbook and latest pricing. Never share internal commission structures or competitor analysis marked as confidential.

Tone: Encouraging but direct. Use data to support recommendations.
\`\`\`

## Best Practices

- Start with 2-3 advisors, not 10
- Review system prompts quarterly
- Collect feedback from users to improve personas
- Use analytics to see which advisors get the most usage

Congratulations! You've completed the Mastering AI Advisors module. You're now equipped to leverage multi-model routing, persistent memory, advanced prompting, and custom personas.`,
            estimated_duration_minutes: 13,
            is_required: true,
          },
        ],
      },
      {
        module: {
          title: "Advanced Automation",
          description:
            "Build powerful automated workflows that connect your AI advisors, documents, and external tools. Learn to create triggers, chains, and scheduled operations that run your business on autopilot.",
          category: "Product Training",
          difficulty_level: "advanced" as const,
          estimated_duration_minutes: 45,
          is_mandatory: false,
          requires_completion: true,
          passing_score_percentage: 80,
          certificate_enabled: true,
          is_published: true,
          is_public: true,
          tags: ["automation", "workflows", "advanced", "integrations"],
        },
        lessons: [
          {
            title: "Automation Architecture Overview",
            description:
              "Understand the building blocks of automation: triggers, actions, conditions, and chains.",
            lesson_order: 1,
            content_type: "document" as const,
            content_text: `# Automation Architecture Overview

## Why Automate?

The most valuable work isn't doing repetitive tasks — it's deciding which tasks to automate. Perpetual Core's automation engine lets you build workflows that:
- Run 24/7 without human intervention
- Chain AI analysis with real-world actions
- React to events across your entire tool stack
- Scale your team's output without scaling headcount

## Building Blocks

Every automation consists of four components:

### 1. Triggers
What starts the automation:
- **Webhook** — External service sends a signal
- **Schedule** — Run at specific times (daily, weekly, custom cron)
- **Event** — Something happens in Perpetual Core (document uploaded, task completed)
- **Email** — Incoming email matches criteria
- **API** — Direct API call to start

### 2. Conditions
Logic that determines whether to proceed:
- If/else branching
- Data filtering
- Threshold checks (e.g., "only if deal value > $10k")
- Time-based conditions (e.g., "only during business hours")

### 3. Actions
What the automation does:
- Send emails or messages
- Create tasks or work items
- Call AI for analysis or generation
- Update database records
- Call external APIs
- Upload or transform documents

### 4. Chains
Multiple actions linked together:
- Sequential (A then B then C)
- Parallel (A and B at the same time)
- Conditional (if X then A, else B)
- Loop (repeat for each item in a list)

## Example: Daily Briefing Automation

\`\`\`
Trigger: Schedule (every weekday at 7:00 AM)
  └─ Action: Fetch yesterday's emails, calendar, and tasks
  └─ Action: Send to AI for analysis and summarization
  └─ Condition: Are there any urgent items?
      ├─ Yes → Action: Send Slack alert + detailed briefing email
      └─ No  → Action: Send standard daily digest email
\`\`\`

## Getting Started

Navigate to **Dashboard > Automation** to see your automation hub. The next lessons will walk you through building real automations step by step.`,
            estimated_duration_minutes: 12,
            is_required: true,
          },
          {
            title: "Building Your First Workflow",
            description:
              "Step-by-step guide to creating an automated workflow with triggers, AI processing, and actions.",
            lesson_order: 2,
            content_type: "document" as const,
            content_text: `# Building Your First Workflow

## What We'll Build

In this lesson, you'll create a **New Document Intelligence Pipeline** — an automation that:
1. Triggers when a document is uploaded
2. Extracts key information with AI
3. Creates tasks from action items
4. Notifies relevant team members

## Step 1: Create the Automation

1. Go to **Dashboard > Automation > Create New**
2. Name it "Document Intelligence Pipeline"
3. Add a description: "Automatically analyze new documents and extract action items"

## Step 2: Set the Trigger

1. Select trigger type: **Event**
2. Choose event: **Document Uploaded**
3. Add filter: **File type is PDF or DOCX** (optional)

## Step 3: Add AI Analysis Action

1. Click **Add Action**
2. Select: **AI Analysis**
3. Configure:
   - Model: Claude Sonnet (good balance of speed and quality)
   - Prompt: "Analyze this document and extract: 1) A 3-sentence summary, 2) Key entities (people, organizations, dates), 3) Action items with owners and deadlines, 4) Risk factors"
   - Input: \`{{trigger.document.content}}\`

## Step 4: Create Tasks from Action Items

1. Click **Add Action** (after AI Analysis)
2. Select: **Create Tasks**
3. Configure:
   - Source: \`{{previous.action_items}}\`
   - For each item, create a task with:
     - Title: \`{{item.description}}\`
     - Due date: \`{{item.deadline}}\`
     - Assignee: \`{{item.owner}}\` (auto-match to team members)

## Step 5: Send Notifications

1. Click **Add Action** (parallel)
2. Select: **Send Notification**
3. Configure:
   - Channel: Slack / Email
   - Recipients: Document uploader + mentioned team members
   - Message: "New document analyzed: {{trigger.document.name}} — {{ai_analysis.summary}}"

## Step 6: Test and Activate

1. Click **Test** to run with a sample document
2. Review the output at each step
3. Fix any issues
4. Click **Activate** to make it live

## Monitoring

Once active, monitor your automation in the Automation Hub:
- **Run history** — See every execution
- **Error log** — Catch and fix failures
- **Performance** — Average run time and success rate

Pro tip: Start with a notification-only version (skip task creation) to validate the AI analysis quality before creating real tasks.`,
            estimated_duration_minutes: 18,
            is_required: true,
          },
          {
            title: "Advanced Patterns and Integrations",
            description:
              "Learn about n8n integration, error handling, retry logic, and production-grade automation patterns.",
            lesson_order: 3,
            content_type: "document" as const,
            content_text: `# Advanced Patterns and Integrations

## n8n Integration

Perpetual Core integrates with **n8n** for complex, multi-step workflows that span external services. This gives you access to 500+ integrations:

### Connecting n8n
1. Go to **Settings > Integrations > n8n**
2. Enter your n8n instance URL
3. Add your API key
4. Test the connection

### When to Use n8n vs. Built-in Automation
| Use Case | Best Tool |
|----------|-----------|
| Simple AI + notification | Built-in |
| Document processing pipeline | Built-in |
| Cross-platform data sync | n8n |
| Complex conditional logic with 5+ branches | n8n |
| Scheduled reports with external data | n8n |

## Error Handling Patterns

Production automations need robust error handling:

### Retry Logic
\`\`\`
Configure:
- Max retries: 3
- Retry delay: exponential (1s, 4s, 16s)
- Retry on: timeout, rate_limit, server_error
- Don't retry on: auth_error, validation_error
\`\`\`

### Fallback Actions
When the primary action fails, execute an alternative:
- Primary: Send via Slack → Fallback: Send via email
- Primary: Use Claude Opus → Fallback: Use GPT-4o

### Dead Letter Queue
Failed automations after all retries go to a dead letter queue:
- Review failures in **Automation > Failed Runs**
- Manually retry or dismiss
- Set up alerts for repeated failures

## Production Patterns

### Idempotency
Design automations that can run multiple times safely:
- Check if the action was already taken before executing
- Use unique identifiers to prevent duplicates
- Track processed items in a log table

### Rate Limiting
Respect external API limits:
- Add delays between API calls
- Use batch processing for bulk operations
- Monitor your API usage dashboards

### Scheduling Best Practices
- Avoid scheduling everything at the top of the hour
- Use random offsets for non-time-sensitive jobs
- Consider timezone implications for global teams
- Document your automation schedule in a central registry

## Monitoring Dashboard

Set up a monitoring dashboard to track all automations:
- **Success rate** — Target 99%+ for critical flows
- **Average latency** — Catch slowdowns early
- **Error trends** — Spot patterns before they become outages
- **Cost tracking** — Monitor AI usage per automation

Congratulations! You've completed the Advanced Automation module. You're now equipped to build production-grade automations that run your business on autopilot.`,
            estimated_duration_minutes: 15,
            is_required: true,
          },
        ],
      },
    ];

    // Check which modules already exist (idempotent)
    const moduleTitles = moduleDefs.map((m) => m.module.title);
    const { data: existingModules } = await supabase
      .from("training_modules")
      .select("id, title")
      .in("title", moduleTitles);

    const existingTitles = new Set(
      (existingModules || []).map((m) => m.title)
    );
    const newModuleDefs = moduleDefs.filter(
      (m) => !existingTitles.has(m.module.title)
    );

    if (newModuleDefs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All training modules already exist. Nothing to seed.",
        inserted: 0,
        skipped: moduleDefs.length,
      });
    }

    const results: Array<{
      module: string;
      moduleId: string;
      lessonsInserted: number;
    }> = [];

    for (const def of newModuleDefs) {
      // Insert the module
      const { data: module, error: moduleError } = await supabase
        .from("training_modules")
        .insert({
          ...def.module,
          organization_id: organizationId,
          created_by: createdBy,
          published_at: new Date().toISOString(),
        })
        .select("id, title")
        .single();

      if (moduleError) {
        console.error(
          `Error inserting module "${def.module.title}":`,
          moduleError
        );
        continue;
      }

      // Insert lessons for the module
      const lessonsToInsert = def.lessons.map((lesson) => ({
        ...lesson,
        module_id: module.id,
      }));

      const { data: lessons, error: lessonsError } = await supabase
        .from("training_lessons")
        .insert(lessonsToInsert)
        .select("id");

      if (lessonsError) {
        console.error(
          `Error inserting lessons for "${def.module.title}":`,
          lessonsError
        );
      }

      results.push({
        module: module.title,
        moduleId: module.id,
        lessonsInserted: lessons?.length || 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.length} training modules. Skipped ${existingTitles.size} existing.`,
      inserted: results.length,
      skipped: existingTitles.size,
      modules: results,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to seed training modules";
    console.error("Training seed error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
