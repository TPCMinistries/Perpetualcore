import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { userDescription } = await req.json();

    if (!userDescription || userDescription.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide more detail about your needs" },
        { status: 400 }
      );
    }

    // Use Claude to analyze user needs and suggest configuration
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this user's description of their needs and suggest the best configuration for an AI productivity platform.

User description: "${userDescription}"

Based on this, provide a JSON response with:
1. suggestedCategory: One of ["personal", "business", "creative", "technical", "education", "other"]
2. userRole: A short title (e.g., "Entrepreneur", "Content Creator", "Software Engineer")
3. primaryGoals: Array of 2-4 key goals (short phrases)
4. suggestedFeatures: Array of platform features they'd benefit from most
5. welcomeMessage: A personalized 1-2 sentence welcome message
6. quickActions: Array of 3 recommended first actions with { label, description, href }

Available hrefs: /dashboard/chat, /dashboard/documents, /dashboard/tasks, /dashboard/search, /dashboard/agents

Respond ONLY with valid JSON, no markdown or explanation.`,
        },
      ],
    });

    // Extract the text content
    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse the JSON response
    let analysis;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      let jsonStr = textContent.text.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      analysis = JSON.parse(jsonStr.trim());
    } catch {
      console.error("Failed to parse AI response:", textContent.text);
      // Fallback response
      analysis = {
        suggestedCategory: "personal",
        userRole: "Professional",
        primaryGoals: ["Organize information", "Get AI assistance", "Save time"],
        suggestedFeatures: ["AI Chat", "Document Library", "Task Management"],
        welcomeMessage: "Welcome! Let's set up your AI assistant based on your needs.",
        quickActions: [
          { label: "Start a Chat", description: "Ask your AI anything", href: "/dashboard/chat" },
          { label: "Upload Documents", description: "Build your knowledge base", href: "/dashboard/documents" },
          { label: "Create Tasks", description: "Track what needs to be done", href: "/dashboard/tasks" },
        ],
      };
    }

    return NextResponse.json({
      success: true,
      analysis,
      tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens,
    });
  } catch (error: any) {
    console.error("Error analyzing user needs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze needs" },
      { status: 500 }
    );
  }
}
