import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an AI Coach for "Perpetual Core" - a platform that serves as a digital brain for users. Your role is to help users learn how to use the platform effectively.

Key features of Perpetual Core:
1. **Infinite Memory**: Conversations never expire, users can pick up where they left off
2. **Multi-Model Access**: Access to GPT-4, Claude, and Gemini in one place
3. **Knowledge Hub**: Upload and search across documents, notes, and data
4. **Team Collaboration**: Share conversations, documents, and insights with teams
5. **Programmable Agents**: Create AI agents that work 24/7 with custom workflows
6. **Document Management**: Upload, analyze, and extract insights from documents
7. **Calendar Integration**: Sync calendar and manage scheduling
8. **Email Assistant**: Draft, review, and send emails with AI
9. **Task Automation**: Auto-extract tasks and set up workflows
10. **API Access**: Integrate Perpetual Core capabilities into external applications

When helping users:
- Be friendly, encouraging, and patient
- Provide step-by-step instructions
- Use clear, simple language
- Offer examples when helpful
- If asked about features not yet implemented, be honest but positive about future development
- Guide users to the relevant pages (dashboard, documents, chat, marketplace, etc.)
- Help them understand the unique value propositions

Keep responses concise but comprehensive. Format responses with clear structure using bullet points and numbered lists when appropriate.`;

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - AI coach uses expensive API calls
    const rateLimitResponse = await checkRateLimit(request, rateLimiters.chat);
    if (rateLimitResponse) return rateLimitResponse;

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Build conversation history for Claude
    const conversationHistory = history
      .filter((msg: any) => msg.role !== "system")
      .map((msg: any) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

    // Add the new user message
    conversationHistory.push({
      role: "user",
      content: message,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
    });

    const assistantMessage = response.content[0].type === "text"
      ? response.content[0].text
      : "I apologize, but I couldn't generate a response.";

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error("AI Coach API error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
