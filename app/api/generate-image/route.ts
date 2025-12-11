import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const isDev = process.env.NODE_ENV === "development";

// POST /api/generate-image - Generate images with DALL-E 3
export async function POST(req: NextRequest) {
  try {
    // Rate limiting - 10 requests per minute for image generation
    const rateLimitResponse = await checkRateLimit(req, rateLimiters.imageGen);
    if (rateLimitResponse) return rateLimitResponse;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, size = "1024x1024", quality = "standard", style = "vivid" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate size
    const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { error: `Invalid size. Must be one of: ${validSizes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate quality
    if (!["standard", "hd"].includes(quality)) {
      return NextResponse.json(
        { error: "Quality must be 'standard' or 'hd'" },
        { status: 400 }
      );
    }

    // Validate style
    if (!["vivid", "natural"].includes(style)) {
      return NextResponse.json(
        { error: "Style must be 'vivid' or 'natural'" },
        { status: 400 }
      );
    }

    if (isDev) console.log("Generating image with DALL-E 3:", {
      prompt: prompt.substring(0, 100),
      size,
      quality,
      style,
    });

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: size as "1024x1024" | "1792x1024" | "1024x1792",
      quality: quality as "standard" | "hd",
      style: style as "vivid" | "natural",
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    if (!imageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    if (isDev) console.log("✅ Image generated successfully");

    return NextResponse.json({
      imageUrl,
      revisedPrompt,
      prompt,
      size,
      quality,
      style,
    });
  } catch (error: any) {
    if (isDev) console.error("Error generating image:", error);

    // Handle OpenAI-specific errors
    if (error?.status === 400) {
      return NextResponse.json(
        { error: "Invalid request to DALL-E: " + (error?.message || "Bad request") },
        { status: 400 }
      );
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
