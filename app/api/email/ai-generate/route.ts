import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatCompletion } from "@/lib/ai/router";

// POST /api/email/ai-generate
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, context = {} } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Build the system prompt
    const systemPrompt = `You are a professional email writing assistant. Write clear, concise, and professional emails based on the user's request.

Guidelines:
- Keep the tone professional but friendly
- Be concise and get to the point
- Use proper email formatting
- Include a clear subject line
- Don't include placeholder text like [Your Name] - leave those blank for the user to fill in
- If replying to an email, maintain appropriate context

Respond ONLY with valid JSON in this exact format:
{
  "subject": "Email subject line",
  "body": "Email body text with proper line breaks"
}`;

    // Build the user prompt with context
    let userPrompt = `Write an email based on this request: ${prompt}`;

    if (context.subject) {
      userPrompt += `\n\nExisting subject: ${context.subject}`;
    }

    if (context.recipients && context.recipients.length > 0) {
      userPrompt += `\n\nRecipients: ${context.recipients.join(", ")}`;
    }

    if (context.replyTo) {
      userPrompt += `\n\nThis is a reply to the following email:\nFrom: ${context.replyTo.from}\nSubject: ${context.replyTo.subject}\nContent: ${context.replyTo.body?.slice(0, 500) || ""}`;
    }

    // Support original_email context from AI Reply feature
    if (context.original_email) {
      userPrompt += `\n\nThis is a reply to the following email:\n${context.original_email.slice(0, 1500)}`;
    }

    // Call the real AI router
    const response = await getChatCompletion("gpt-4o-mini", [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    // Parse the JSON response
    let generatedSubject = "";
    let generatedBody = "";

    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = response.response;
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.slice(7);
      } else if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.slice(3);
      }
      if (cleanResponse.endsWith("```")) {
        cleanResponse = cleanResponse.slice(0, -3);
      }
      cleanResponse = cleanResponse.trim();

      const parsed = JSON.parse(cleanResponse);
      generatedSubject = parsed.subject || "";
      generatedBody = parsed.body || "";
    } catch (parseError) {
      // If JSON parsing fails, use the raw response as body
      console.warn("Failed to parse AI response as JSON, using raw response:", parseError);
      generatedSubject = context.subject || "Email";
      generatedBody = response.response;
    }

    return NextResponse.json({
      subject: generatedSubject,
      body: generatedBody,
      model: "gpt-4o-mini",
      usage: response.usage,
    });
  } catch (error) {
    console.error("AI generate email API error:", error);
    return NextResponse.json(
      { error: "Failed to generate email. Please try again." },
      { status: 500 }
    );
  }
}
