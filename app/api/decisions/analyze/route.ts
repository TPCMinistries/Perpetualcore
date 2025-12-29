import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion } from "@/lib/ai/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalysisResult {
  mode: "clarify" | "decisions" | "insight";
  message?: string;
  questions?: {
    id: string;
    question: string;
    type: "choice" | "text" | "date" | "priority";
    options?: string[];
    context?: string;
  }[];
  decisions?: {
    title: string;
    description?: string;
    context?: string;
    priority?: "low" | "medium" | "high" | "urgent";
    due_date?: string;
    options?: { title: string; pros?: string[]; cons?: string[] }[];
    stakeholders?: string[];
    related_to?: string;
  }[];
  insights?: {
    summary: string;
    key_points: string[];
    risks?: string[];
    recommendations?: string[];
  };
}

/**
 * POST /api/decisions/analyze
 * Intelligent decision assistant - analyzes input and either:
 * 1. Asks clarifying questions if input is abstract
 * 2. Extracts decisions if clear enough
 * 3. Provides insights and recommendations
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, context, previous_answers } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Build conversation context
    let conversationContext = "";
    if (previous_answers && Array.isArray(previous_answers)) {
      conversationContext = "\n\nPrevious clarifications provided:\n" +
        previous_answers.map((a: { question: string; answer: string }) =>
          `Q: ${a.question}\nA: ${a.answer}`
        ).join("\n\n");
    }

    // Intelligent analysis prompt
    const systemPrompt = `You are an intelligent executive decision assistant. Your role is to help transform thoughts, ideas, concerns, and situations into actionable decisions.

IMPORTANT: You understand that users may express themselves abstractly. Your job is to:
1. Understand the underlying intent and concerns
2. Ask smart clarifying questions when needed (not too many - 2-3 max)
3. Help structure vague ideas into concrete decisions
4. Identify hidden decisions that need to be made
5. Provide strategic insights

ANALYSIS MODES:

MODE 1: "clarify" - Use when input is abstract or lacks key details
Return questions to help understand:
- What outcome they're hoping for
- What constraints or considerations exist
- Who else is involved or affected
- What timeline they're working with
- What options they've considered

MODE 2: "decisions" - Use when you have enough information
Extract clear, actionable decisions including:
- A clear decision title (what needs to be decided)
- Context and background
- Options to consider (with pros/cons if relevant)
- Suggested priority
- Relevant stakeholders
- Due date if mentioned or implied

MODE 3: "insight" - Use when sharing strategic analysis
Provide:
- Summary of the situation
- Key points to consider
- Potential risks
- Recommendations

RESPONSE FORMAT (JSON only):
{
  "mode": "clarify" | "decisions" | "insight",
  "message": "Optional friendly message to the user",
  "questions": [  // Only for mode: "clarify"
    {
      "id": "unique_id",
      "question": "The question to ask",
      "type": "choice" | "text" | "date" | "priority",
      "options": ["Option 1", "Option 2"],  // For choice type
      "context": "Why this question matters"
    }
  ],
  "decisions": [  // For mode: "decisions"
    {
      "title": "Decision title",
      "description": "What this decision is about",
      "context": "Background and why it matters",
      "priority": "medium",
      "due_date": "2024-01-15",
      "options": [
        {"title": "Option A", "pros": ["Pro 1"], "cons": ["Con 1"]},
        {"title": "Option B", "pros": ["Pro 1"], "cons": ["Con 1"]}
      ],
      "stakeholders": ["Person or role involved"],
      "related_to": "Any related project or initiative"
    }
  ],
  "insights": {  // Can include with any mode
    "summary": "Brief summary",
    "key_points": ["Point 1", "Point 2"],
    "risks": ["Risk 1"],
    "recommendations": ["Recommendation 1"]
  }
}

Be conversational but efficient. Don't ask too many questions - be smart about inferring from context.
If the user provides clear decisions or a transcript with clear action items, extract them directly.
If the input is vague like "I'm thinking about expanding" - ask a few smart questions.`;

    const userMessage = context
      ? `Context: ${context}\n\nUser input: ${content}${conversationContext}`
      : `${content}${conversationContext}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userMessage },
    ];

    const result = await getChatCompletion("gpt-4o", messages);

    // Parse the AI response
    let analysis: AnalysisResult | null = null;

    try {
      const responseText = result.response || result;
      // Extract JSON from the response
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        analysis = JSON.parse(jsonStr);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback response
      analysis = {
        mode: "insight",
        message: "I had trouble processing that. Could you try rephrasing or providing more details?",
        insights: {
          summary: "Unable to fully analyze the input",
          key_points: ["Please try providing more context or details"],
          recommendations: ["Consider describing the situation more specifically"]
        }
      };
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Decision analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze input" },
      { status: 500 }
    );
  }
}
