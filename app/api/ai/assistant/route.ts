import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion, ChatMessage } from "@/lib/ai/router";
import { AIModel } from "@/types";

interface AIRequest {
  message: string;
  context: {
    route: string;
    pageType: string;
    selectedItems: any[];
    pageData: Record<string, any>;
    workspace?: {
      id: string;
      name: string;
      aiMode?: string;
    };
    entity?: {
      id: string;
      name: string;
      type?: string;
      description?: string;
    };
    brand?: {
      id: string;
      name: string;
    };
  };
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  model?: AIModel;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AIRequest = await request.json();
    const { message, context, history, model = "auto" } = body;

    // Build the system prompt with context
    const systemPrompt = buildSystemPrompt(context, user.email || "User");

    // Build messages for the AI
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Call the AI router with the selected model
    const { response: aiResponse, usage } = await getChatCompletion(
      model,
      messages,
      "pro" // Assume pro tier for assistant users
    );

    // Parse any actions from the response
    const actions = parseActions(aiResponse);

    // Save conversation to database for memory
    await saveConversation(supabase, user.id, context, message, aiResponse);

    return NextResponse.json({
      response: aiResponse,
      actions,
      usage,
    });
  } catch (error) {
    console.error("AI Assistant error:", error);

    // Return a helpful error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // If it's an API key issue, provide a specific message
    if (errorMessage.includes("not initialized") || errorMessage.includes("API key")) {
      return NextResponse.json({
        response: "I'm currently unavailable because the AI service isn't configured. Please contact your administrator to set up the AI integration.",
        actions: [],
        error: "AI service not configured",
      });
    }

    return NextResponse.json(
      { error: "Failed to process request", details: errorMessage },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(context: any, userEmail: string): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Get workspace-specific mode instructions
  const workspaceModeInstructions = getWorkspaceModeInstructions(context.workspace?.aiMode);

  // Build entity context string
  const entityContext = context.entity
    ? `\nActive Entity: ${context.entity.name}${context.entity.type ? ` (${context.entity.type})` : ""}${context.entity.description ? `\nEntity Description: ${context.entity.description}` : ""}${context.brand ? `\nActive Brand: ${context.brand.name}` : ""}`
    : "";

  const basePrompt = `You are an AI assistant integrated into Perpetual Core, a productivity and knowledge management platform. You help users with tasks, answer questions, and can suggest actions within the platform.

Current Date: ${currentDate}
User: ${userEmail}
${context.workspace ? `Workspace: ${context.workspace.name} (${context.workspace.aiMode || "default"} mode)` : ""}${entityContext}

Current Context:
- Page: ${context.route}
- Page Type: ${context.pageType}
${context.selectedItems.length > 0 ? `- Selected Items: ${JSON.stringify(context.selectedItems, null, 2)}` : ""}
${Object.keys(context.pageData).length > 0 ? `- Page Data: ${JSON.stringify(context.pageData, null, 2)}` : ""}
${workspaceModeInstructions ? `\nWorkspace Mode Instructions:\n${workspaceModeInstructions}` : ""}
${context.entity ? `\nEntity Context Instructions:\nYou are currently working within the "${context.entity.name}" entity context. All tasks, projects, content, and operations should be scoped to this entity. When creating items or making suggestions, consider the entity's focus area and description.` : ""}

Your Capabilities:
1. Answer questions about the platform and its features
2. Help with tasks, projects, contacts, and documents
3. Provide insights and suggestions based on context
4. Draft communications (emails, messages)
5. Summarize content
6. Prioritize and organize work

Guidelines:
- Be concise and helpful
- Use the current context to provide relevant suggestions
- When you can perform an action, format it as [ACTION: action_type action_details]
- If you need more information, ask clarifying questions
- Stay focused on what the user is currently working on
- Don't mention that you're an AI or apologize unnecessarily

Available Actions (format: [ACTION: type details]):
- [ACTION: navigate /dashboard/path] - Navigate to another page
- [ACTION: create_task "Task title"] - Create a new task
- [ACTION: create_project "Project name"] - Create a new project
- [ACTION: search "query"] - Search the platform
- [ACTION: send_email to@email.com "Subject"] - Draft an email
`;

  // Add page-specific context
  const pageContexts: Record<string, string> = {
    inbox: `
You are helping with email and messages. You can:
- Summarize unread messages
- Help draft replies
- Categorize and prioritize messages
- Find specific messages
- Suggest follow-ups based on email content`,

    documents: `
You are helping with documents. You can:
- Summarize document content
- Extract key information
- Find similar documents
- Answer questions about document content
- Suggest document organization`,

    tasks: `
You are helping with task management. You can:
- Help prioritize tasks
- Break down tasks into subtasks
- Estimate effort for tasks
- Suggest next actions
- Identify blocked or overdue items`,

    projects: `
You are helping with project management. You can:
- Provide project status summaries
- Suggest next milestones
- Identify blockers or risks
- Help with project planning
- Review project progress`,

    automation: `
You are helping with automations. You can:
- Explain automation results
- Debug automation failures
- Suggest optimizations
- Help design new automations
- Analyze automation performance`,

    contacts: `
You are helping with contacts and relationships. You can:
- Show interaction history
- Draft communications
- Suggest follow-ups
- Find related contacts
- Provide relationship insights`,

    home: `
You are on the main dashboard. You can:
- Provide a daily briefing
- Highlight important items
- Suggest what to focus on
- Answer general questions
- Navigate to any feature`,

    analytics: `
You are helping with analytics and insights. You can:
- Explain metrics and trends
- Identify areas for improvement
- Compare performance over time
- Generate reports
- Suggest data-driven actions`,
  };

  if (pageContexts[context.pageType]) {
    return basePrompt + pageContexts[context.pageType];
  }

  return basePrompt;
}

function parseActions(response: string): any[] {
  const actions: any[] = [];

  // Look for action patterns like [ACTION: type details]
  const actionPattern = /\[ACTION:\s*(\w+)\s+(.+?)\]/g;
  let match;

  while ((match = actionPattern.exec(response)) !== null) {
    const actionType = match[1];
    const actionDetails = match[2].trim();

    switch (actionType) {
      case "navigate":
        actions.push({
          type: "navigate",
          payload: { url: actionDetails },
          label: `Go to ${actionDetails}`,
        });
        break;

      case "create_task":
        const taskTitle = actionDetails.replace(/^["']|["']$/g, "");
        actions.push({
          type: "create_task",
          payload: { title: taskTitle },
          label: `Create task: ${taskTitle}`,
        });
        break;

      case "create_project":
        const projectName = actionDetails.replace(/^["']|["']$/g, "");
        actions.push({
          type: "create_project",
          payload: { name: projectName },
          label: `Create project: ${projectName}`,
        });
        break;

      case "search":
        const query = actionDetails.replace(/^["']|["']$/g, "");
        actions.push({
          type: "search",
          payload: { query },
          label: `Search: ${query}`,
        });
        break;

      case "send_email":
        const emailMatch = actionDetails.match(/(\S+@\S+)\s+["'](.+?)["']/);
        if (emailMatch) {
          actions.push({
            type: "send_email",
            payload: { to: emailMatch[1], subject: emailMatch[2] },
            label: `Draft email to ${emailMatch[1]}`,
          });
        }
        break;

      default:
        actions.push({
          type: actionType,
          payload: { raw: actionDetails },
          label: `${actionType}: ${actionDetails}`,
        });
    }
  }

  return actions;
}

function getWorkspaceModeInstructions(aiMode?: string): string {
  switch (aiMode) {
    case "sales":
      return `You are in SALES MODE. Focus on:
- Lead qualification and scoring
- Pipeline management and deal progression
- Outreach and follow-up strategies
- CRM best practices
- Meeting scheduling and preparation
- Objection handling techniques
Be proactive about suggesting sales actions like logging calls, scheduling follow-ups, and tracking deals.`;

    case "research":
      return `You are in RESEARCH MODE. Focus on:
- Deep analysis and synthesis of information
- Finding connections between documents and ideas
- Summarizing and extracting key insights
- Citation and source tracking
- Note organization and knowledge management
- Exploring topics in depth
Be thorough and academic in your responses, cite sources when available.`;

    case "creative":
      return `You are in CREATIVE MODE. Focus on:
- Brainstorming and ideation
- Content creation and drafting
- Visual thinking and concept development
- Storytelling and narrative structure
- Innovation and out-of-the-box solutions
Be imaginative and encouraging, help explore multiple creative directions.`;

    default:
      return "";
  }
}

async function saveConversation(
  supabase: any,
  userId: string,
  context: any,
  userMessage: string,
  aiResponse: string
) {
  try {
    // Try to find existing conversation for this context
    const { data: existing } = await supabase
      .from("ai_assistant_conversations")
      .select("id, messages")
      .eq("user_id", userId)
      .eq("context_type", context.pageType)
      .eq("context_id", context.route)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const newMessages = [
      { role: "user", content: userMessage, timestamp: new Date().toISOString() },
      { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() },
    ];

    if (existing) {
      // Append to existing conversation (keep last 20 messages)
      const updatedMessages = [...(existing.messages || []), ...newMessages].slice(-20);
      await supabase
        .from("ai_assistant_conversations")
        .update({
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create new conversation
      await supabase.from("ai_assistant_conversations").insert({
        user_id: userId,
        context_type: context.pageType,
        context_id: context.route,
        messages: newMessages,
      });
    }
  } catch (error) {
    console.error("Failed to save conversation:", error);
    // Non-critical, don't throw
  }
}
