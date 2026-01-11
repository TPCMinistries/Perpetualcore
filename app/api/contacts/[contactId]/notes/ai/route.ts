import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ contactId: string }>;
}

const anthropic = new Anthropic();

// POST - AI actions on notes (summarize, expand, extract actions)
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { contactId } = await context.params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact belongs to user
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, full_name")
      .eq("id", contactId)
      .eq("user_id", user.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, content, interaction_type } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const validActions = ["summarize", "expand", "extract_actions", "summarize_interaction", "extract_key_points"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let prompt = "";
    switch (action) {
      case "summarize":
        prompt = `Summarize the following note about ${contact.full_name} into a concise, clear summary. Keep it professional and maintain key information:

${content}

Provide only the summarized text, no preamble.`;
        break;

      case "expand":
        prompt = `Expand the following brief note about ${contact.full_name} into a more detailed version. Add context where appropriate while keeping it professional:

${content}

Provide only the expanded text, no preamble.`;
        break;

      case "extract_actions":
        prompt = `Extract action items from the following note about ${contact.full_name}. Return as a JSON array of strings. If no action items are found, return an empty array.

${content}

Return only valid JSON, like: ["Action 1", "Action 2"]`;
        break;

      case "summarize_interaction":
        const interactionTypeLabel = interaction_type || "interaction";
        prompt = `Clean up and enhance the following ${interactionTypeLabel} notes about ${contact.full_name}. Create a professional, well-organized summary that captures the key points of what was discussed. Keep it concise but comprehensive:

Raw notes:
${content}

Provide only the enhanced summary, no preamble. Use clear, professional language.`;
        break;

      case "extract_key_points":
        prompt = `Extract the main key points from the following notes about ${contact.full_name}. Return as a JSON array of concise bullet point strings. Focus on the most important takeaways. If no clear key points, return an empty array.

${content}

Return only valid JSON array, like: ["Key point 1", "Key point 2", "Key point 3"]`;
        break;
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";

    // Handle JSON array responses (extract_actions and extract_key_points)
    if (action === "extract_actions" || action === "extract_key_points") {
      const resultKey = action === "extract_actions" ? "actions" : "key_points";
      try {
        const items = JSON.parse(responseText);
        return NextResponse.json({ [resultKey]: items });
      } catch {
        // Try to extract array from response
        const match = responseText.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            const items = JSON.parse(match[0]);
            return NextResponse.json({ [resultKey]: items });
          } catch {
            return NextResponse.json({ [resultKey]: [] });
          }
        }
        return NextResponse.json({ [resultKey]: [] });
      }
    }

    return NextResponse.json({ result: responseText.trim() });
  } catch (error) {
    console.error("Error processing AI note action:", error);
    return NextResponse.json(
      { error: "Failed to process AI action" },
      { status: 500 }
    );
  }
}
