import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic();

interface ParsedEntity {
  name: string;
  type: "business" | "ministry" | "nonprofit" | "personal" | "saas" | "consulting";
  description: string;
  brands?: {
    name: string;
    description: string;
  }[];
  projects: ParsedProject[];
}

interface ParsedProject {
  name: string;
  description: string;
  emoji: string;
  priority: "low" | "medium" | "high" | "urgent";
  tasks: ParsedTask[];
}

interface ParsedTask {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  subtasks?: string[];
}

interface BrainDumpResponse {
  entities: ParsedEntity[];
  summary: string;
  suggestions: string[];
}

// POST /api/onboarding/brain-dump - Parse brain dump into structured data
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brainDump } = await req.json();

    if (!brainDump || brainDump.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide more detail about your businesses and projects" },
        { status: 400 }
      );
    }

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, organization_id")
      .eq("id", user.id)
      .single();

    const userName = profile?.full_name?.split(" ")[0] || "there";

    // Use Claude to parse the brain dump - simplified prompt for reliable output
    const systemPrompt = `Parse the user's brain dump into JSON. Output ONLY valid JSON, no other text.

Format:
{"entities":[{"name":"Name","type":"business|ministry|nonprofit|personal","description":"Brief desc","projects":[{"name":"Project","description":"Desc","emoji":"📋","priority":"medium","tasks":[{"title":"Task","priority":"medium"}]}]}],"summary":"Summary","suggestions":["Tip"]}

Rules:
- Create 1 entity per distinct business/org mentioned
- Create 2-4 projects per entity
- Create 2-4 tasks per project (keep task titles short)
- Use types: business, ministry, nonprofit, personal
- Skip brands array to save space
- Output ONLY the JSON object`;

    const userPrompt = `Parse this into entities/projects/tasks JSON:

${brainDump}

Output JSON only:`;

    let response;
    try {
      response = await anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 4096,
        messages: [
          { role: "user", content: userPrompt }
        ],
        system: systemPrompt,
      });
    } catch (apiError: any) {
      console.error("Anthropic API error:", apiError);
      return NextResponse.json(
        { error: `AI service error: ${apiError.message || "Please try again"}` },
        { status: 500 }
      );
    }

    // Extract the text content
    const textContent = response.content.find(c => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse the JSON response
    let parsed: BrainDumpResponse;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = textContent.text;
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      jsonStr = jsonStr.trim();

      // Try to repair truncated JSON
      if (!jsonStr.endsWith('}')) {
        // Find where entities array ends and try to close it
        const lastValidBracket = jsonStr.lastIndexOf('}');
        if (lastValidBracket > 0) {
          jsonStr = jsonStr.substring(0, lastValidBracket + 1);
          // Count brackets to close properly
          const openBraces = (jsonStr.match(/\{/g) || []).length;
          const closeBraces = (jsonStr.match(/\}/g) || []).length;
          const openBrackets = (jsonStr.match(/\[/g) || []).length;
          const closeBrackets = (jsonStr.match(/\]/g) || []).length;

          // Add missing closing brackets
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            jsonStr += ']';
          }
          for (let i = 0; i < openBraces - closeBraces; i++) {
            jsonStr += '}';
          }
        }
      }

      parsed = JSON.parse(jsonStr);

      // Ensure required fields exist
      if (!parsed.summary) parsed.summary = "Brain dump organized into entities and projects.";
      if (!parsed.suggestions) parsed.suggestions = ["Review and prioritize your tasks"];

    } catch (parseError) {
      console.error("Failed to parse AI response:", textContent.text);
      return NextResponse.json(
        { error: "Failed to parse brain dump. Please try again." },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!parsed.entities || !Array.isArray(parsed.entities)) {
      return NextResponse.json(
        { error: "Invalid response structure" },
        { status: 500 }
      );
    }

    // Calculate stats
    const stats = {
      entities: parsed.entities.length,
      projects: parsed.entities.reduce((sum, e) => sum + e.projects.length, 0),
      tasks: parsed.entities.reduce((sum, e) =>
        sum + e.projects.reduce((pSum, p) => pSum + p.tasks.length, 0), 0),
      subtasks: parsed.entities.reduce((sum, e) =>
        sum + e.projects.reduce((pSum, p) =>
          pSum + p.tasks.reduce((tSum, t) => tSum + (t.subtasks?.length || 0), 0), 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: parsed,
      stats,
      userName,
    });

  } catch (error) {
    console.error("Brain dump API error:", error);
    return NextResponse.json(
      { error: "Failed to process brain dump" },
      { status: 500 }
    );
  }
}
