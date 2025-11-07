import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { message, history } = await req.json();

    if (!message) {
      return new Response("No message provided", { status: 400 });
    }

    // Build conversation history for context
    const messages: any[] = [
      {
        role: "system",
        content:
          "You are a helpful, friendly AI assistant. Have natural, conversational exchanges. Be concise but informative (2-3 sentences max). Show personality and warmth.",
      },
    ];

    // Add recent history (last 5 exchanges)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const line of recentHistory) {
        if (line.startsWith("You:")) {
          messages.push({
            role: "user",
            content: line.replace("You: ", ""),
          });
        } else if (line.startsWith("AI:")) {
          messages.push({
            role: "assistant",
            content: line.replace("AI: ", ""),
          });
        }
      }
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8,
      max_tokens: 150, // Keep responses concise for voice
    });

    const response = completion.choices[0]?.message?.content || "I didn't catch that.";

    return Response.json({
      response,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response("Chat failed", { status: 500 });
  }
}
