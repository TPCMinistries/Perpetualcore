import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateContent, GenerateContentOptions } from "@/lib/content/generator";
import { AIModel } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/content/generate
 *
 * Generate AI content with brand voice, platform rules, and Lorenzo's writing style.
 *
 * Body: {
 *   prompt: string           — What to generate
 *   content_type: string     — social, blog, newsletter, video_script, etc.
 *   platform?: string        — linkedin, twitter, instagram, youtube, website, email
 *   brand_id?: string        — Load brand tone_config + entity context
 *   tone?: string            — Override: professional, casual, bold, thought-leader, pastoral
 *   length?: string          — short, medium, long
 *   variations?: number      — How many versions (default: 3)
 *   reference_content?: string — Context (voice memo transcript, article, etc.)
 *   model?: AIModel          — Override model selection
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.prompt || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    if (!body.content_type || typeof body.content_type !== "string") {
      return NextResponse.json(
        { error: "content_type is required" },
        { status: 400 }
      );
    }

    // Validate variations range
    const variations = Math.min(Math.max(body.variations || 3, 1), 5);

    // Build options
    const options: GenerateContentOptions = {
      prompt: body.prompt.trim(),
      contentType: body.content_type,
      platform: body.platform || undefined,
      brandId: body.brand_id || undefined,
      tone: body.tone || undefined,
      length: body.length || "medium",
      referenceContent: body.reference_content || undefined,
      variations,
      model: (body.model as AIModel) || undefined,
    };

    // Generate content
    const result = await generateContent(options);

    return NextResponse.json({
      success: true,
      variations: result.variations,
      model: result.model,
      usage: result.usage,
      cost: result.cost,
    });
  } catch (error: any) {
    console.error("POST /api/content/generate error:", error);
    return NextResponse.json(
      { error: error.message || "Generation failed" },
      { status: 500 }
    );
  }
}
