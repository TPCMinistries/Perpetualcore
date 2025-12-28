import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion } from "@/lib/ai/router";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExtractedDecision {
  title: string;
  context?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  due_date?: string;
}

/**
 * POST /api/decisions/extract
 * Extract actionable decisions from text content using AI
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

    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Use AI to extract decisions from the content
    const systemPrompt = `You are an expert at extracting actionable decisions from text content like emails, meeting notes, and messages.

Your task is to identify specific decisions that need to be made and return them in a structured format.

Rules:
1. Only extract clear decisions that require action or a choice
2. Each decision should have a clear, concise title (max 100 chars)
3. Include relevant context from the original text
4. Infer priority based on urgency language (urgent, ASAP, immediately = urgent; important, critical = high; soon, this week = medium; when possible, eventually = low)
5. If a deadline is mentioned, include it
6. Do NOT include general tasks or FYIs - only actual decisions
7. Return an empty array if no decisions are found

Return ONLY valid JSON in this exact format:
{
  "decisions": [
    {
      "title": "Decision title here",
      "context": "Relevant context from the text",
      "priority": "medium",
      "due_date": "2024-01-15"
    }
  ]
}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: `Extract decisions from this content:\n\n${content}` },
    ];

    const result = await getChatCompletion("gpt-4o", messages);

    // Parse the AI response
    let extractedDecisions: ExtractedDecision[] = [];

    try {
      const responseText = result.response || result;
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                       responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        extractedDecisions = parsed.decisions || [];
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return empty array if parsing fails
      extractedDecisions = [];
    }

    return NextResponse.json({
      decisions: extractedDecisions,
      count: extractedDecisions.length,
    });
  } catch (error) {
    console.error("Decision extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract decisions" },
      { status: 500 }
    );
  }
}
