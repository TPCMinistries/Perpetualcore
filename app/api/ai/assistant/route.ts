import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AIRequest {
  message: string;
  context: {
    route: string;
    pageType: string;
    selectedItems: any[];
    pageData: Record<string, any>;
  };
  history: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AIRequest = await request.json();
    const { message, context, history } = body;

    // Build the prompt with context
    const systemPrompt = buildSystemPrompt(context);
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    // Call your AI provider (OpenAI, Anthropic, etc.)
    // This is a placeholder - replace with your actual AI integration
    const aiResponse = await callAI(messages);

    // Parse any actions from the response
    const actions = parseActions(aiResponse);

    // Save conversation to database for memory
    await saveConversation(supabase, user.id, context, message, aiResponse);

    return NextResponse.json({
      response: aiResponse,
      actions,
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(context: any): string {
  const basePrompt = `You are an AI assistant integrated into a productivity platform called Perpetual Core. You help users with tasks, answer questions, and can take actions within the platform.

Current Context:
- Page: ${context.route}
- Page Type: ${context.pageType}
- Selected Items: ${context.selectedItems.length > 0 ? JSON.stringify(context.selectedItems) : "None"}
- Page Data: ${Object.keys(context.pageData).length > 0 ? JSON.stringify(context.pageData) : "None"}

Guidelines:
1. Be concise and helpful
2. Use the context to provide relevant suggestions
3. When appropriate, suggest actions the user can take
4. If you need to perform an action, indicate it clearly
5. Stay focused on what the user is currently working on

Available Actions (you can suggest these):
- Navigate to another page
- Search for something
- Create a new item (task, document, etc.)
- Summarize content
- Draft communications
`;

  // Add page-specific context
  const pageContexts: Record<string, string> = {
    inbox: `
You are helping with email and messages. You can:
- Summarize unread messages
- Help draft replies
- Categorize and prioritize messages
- Find specific messages`,
    documents: `
You are helping with documents. You can:
- Summarize document content
- Extract key information
- Find similar documents
- Suggest improvements`,
    tasks: `
You are helping with task management. You can:
- Help prioritize tasks
- Break down tasks into subtasks
- Estimate time for tasks
- Suggest next actions`,
    automation: `
You are helping with automations. You can:
- Explain automation results
- Debug failures
- Suggest optimizations
- Help create new automations`,
    contacts: `
You are helping with contacts. You can:
- Show interaction history
- Draft communications
- Suggest follow-ups
- Find related contacts`,
  };

  if (pageContexts[context.pageType]) {
    return basePrompt + pageContexts[context.pageType];
  }

  return basePrompt;
}

async function callAI(messages: any[]): Promise<string> {
  // Placeholder - replace with your actual AI provider integration
  // Example with OpenAI:
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages,
  // });
  // return response.choices[0].message.content;

  // For now, return a helpful placeholder response
  const lastUserMessage = messages[messages.length - 1].content;

  // Simple pattern matching for demo
  if (lastUserMessage.toLowerCase().includes("summarize")) {
    return "I can help summarize content for you. To do this effectively, I would need access to the specific content you'd like summarized. Could you select the items or navigate to the content you'd like me to analyze?";
  }

  if (lastUserMessage.toLowerCase().includes("help") || lastUserMessage.toLowerCase().includes("what can")) {
    return "I'm here to help! Based on your current page, I can assist with:\n\n• Answering questions about your data\n• Helping draft communications\n• Suggesting next actions\n• Searching for specific items\n• Explaining features\n\nJust let me know what you'd like to do!";
  }

  if (lastUserMessage.toLowerCase().includes("prioritize")) {
    return "To help prioritize effectively, I look at:\n\n1. Due dates and deadlines\n2. Importance and impact\n3. Dependencies on other tasks\n4. Your past patterns\n\nWould you like me to analyze your current tasks and suggest a priority order?";
  }

  return "I understand. How can I help you with that? Feel free to provide more details or ask me to perform a specific action.";
}

function parseActions(response: string): any[] {
  // Parse any action indicators from the AI response
  // This is a simplified version - you might use a more sophisticated parsing
  const actions: any[] = [];

  // Look for action patterns like [ACTION: navigate to /dashboard/tasks]
  const actionPattern = /\[ACTION:\s*(.*?)\]/g;
  let match;

  while ((match = actionPattern.exec(response)) !== null) {
    const actionText = match[1];
    if (actionText.startsWith("navigate to")) {
      const url = actionText.replace("navigate to", "").trim();
      actions.push({ type: "navigate", payload: { url } });
    }
  }

  return actions;
}

async function saveConversation(
  supabase: any,
  userId: string,
  context: any,
  userMessage: string,
  aiResponse: string
) {
  try {
    await supabase.from("ai_assistant_conversations").insert({
      user_id: userId,
      context_type: context.pageType,
      context_id: context.route,
      messages: [
        { role: "user", content: userMessage, timestamp: new Date().toISOString() },
        { role: "assistant", content: aiResponse, timestamp: new Date().toISOString() },
      ],
    });
  } catch (error) {
    console.error("Failed to save conversation:", error);
    // Non-critical, don't throw
  }
}
