import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters } from "@/lib/rate-limit";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST - AI-powered contact enrichment
 * Takes basic info and suggests additional details
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimiters.api.check(req);
    if (!rateLimitResult.success) {
      return rateLimitResult.response;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, company, linkedin_url, email, job_title } = body;

    if (!name && !company && !linkedin_url) {
      return NextResponse.json(
        { error: "Provide at least a name, company, or LinkedIn URL" },
        { status: 400 }
      );
    }

    // Build context for AI
    const contextParts: string[] = [];
    if (name) contextParts.push(`Name: ${name}`);
    if (company) contextParts.push(`Company: ${company}`);
    if (job_title) contextParts.push(`Job Title: ${job_title}`);
    if (email) contextParts.push(`Email: ${email}`);
    if (linkedin_url) contextParts.push(`LinkedIn: ${linkedin_url}`);

    const prompt = `Based on the following information about a professional contact, suggest likely additional details. Be conservative and only suggest things that are highly probable based on the information provided.

${contextParts.join("\n")}

Provide your response as JSON with these optional fields (omit fields you're not confident about):
{
  "job_title": "suggested job title if not provided",
  "industry": "likely industry",
  "location": "likely city/region based on company or email domain",
  "skills": ["likely skills based on role/company", "max 5 items"],
  "interests": ["likely professional interests", "max 3 items"],
  "tags": ["relevant tags for categorization", "max 4 items"]
}

Only include fields you have reasonable confidence in. Do not make up specific details like exact locations or skills without evidence.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional contact data enrichment assistant. Provide only high-confidence suggestions based on available information. Respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || "{}";

    // Parse the JSON response
    let suggestions: Record<string, any> = {};
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      suggestions = {};
    }

    // Validate and clean the suggestions
    const cleanedSuggestions: Record<string, any> = {};

    if (suggestions.job_title && typeof suggestions.job_title === "string") {
      cleanedSuggestions.job_title = suggestions.job_title;
    }
    if (suggestions.industry && typeof suggestions.industry === "string") {
      cleanedSuggestions.industry = suggestions.industry;
    }
    if (suggestions.location && typeof suggestions.location === "string") {
      cleanedSuggestions.location = suggestions.location;
    }
    if (Array.isArray(suggestions.skills)) {
      cleanedSuggestions.skills = suggestions.skills
        .filter((s: any) => typeof s === "string")
        .slice(0, 5);
    }
    if (Array.isArray(suggestions.interests)) {
      cleanedSuggestions.interests = suggestions.interests
        .filter((s: any) => typeof s === "string")
        .slice(0, 3);
    }
    if (Array.isArray(suggestions.tags)) {
      cleanedSuggestions.tags = suggestions.tags
        .filter((s: any) => typeof s === "string")
        .slice(0, 4);
    }

    return NextResponse.json({
      suggestions: cleanedSuggestions,
      source: "ai_inference",
    });
  } catch (error) {
    console.error("Contact enrich error:", error);
    return NextResponse.json(
      { error: "Failed to enrich contact" },
      { status: 500 }
    );
  }
}
