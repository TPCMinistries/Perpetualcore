import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { streamChatCompletion, ChatMessage } from "@/lib/ai/router";
import { buildContentPrompt } from "@/lib/content/brand-voice";
import { Brand, Entity, LookupPlatform } from "@/types/entities";
import { AIModel } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Model routing for content generation (mirrors generator.ts)
 */
function selectContentModel(contentType: string, platform?: string, override?: AIModel): AIModel {
  if (override && override !== "auto") return override;

  const routingMap: Record<string, AIModel> = {
    linkedin: "claude-sonnet-4",
    twitter: "gpt-4o-mini",
    instagram: "gpt-4o-mini",
    youtube: "gpt-4o",
    email: "claude-sonnet-4",
    website: "claude-sonnet-4",
  };

  const typeMap: Record<string, AIModel> = {
    blog: "claude-sonnet-4",
    newsletter: "claude-sonnet-4",
    social: "gpt-4o-mini",
    video_script: "gpt-4o",
    linkedin_post: "claude-sonnet-4",
    twitter_thread: "gpt-4o-mini",
    instagram_caption: "gpt-4o-mini",
    youtube_script: "gpt-4o",
    press_release: "claude-sonnet-4",
    case_study: "claude-sonnet-4",
  };

  return routingMap[platform || ""] || typeMap[contentType] || "claude-sonnet-4";
}

function getLengthGuidance(length?: string): string {
  switch (length) {
    case "short":
      return "Keep it concise. Under 280 characters if social, under 200 words otherwise.";
    case "long":
      return "Write a comprehensive, in-depth piece. 800-2000 words for articles, 200+ words for social.";
    default:
      return "Medium length. 100-300 words for social, 500-1000 words for articles.";
  }
}

/**
 * POST /api/content/generate/stream
 *
 * Server-Sent Events (SSE) streaming content generation.
 * Client receives chunks in real-time, then final parsed variations.
 *
 * SSE event format:
 *   data: {"type":"chunk","content":"text..."}
 *   data: {"type":"done","fullText":"...","model":"..."}
 *   data: {"type":"error","message":"..."}
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    if (!body.prompt || !body.content_type) {
      return new Response(JSON.stringify({ error: "prompt and content_type required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const variations = Math.min(Math.max(body.variations || 3, 1), 5);

    // Load brand + entity context
    let brand: Brand | null = null;
    let entity: Entity | null = null;
    let lookupPlatform: LookupPlatform | null = null;

    const adminClient = createAdminClient();

    if (body.brand_id) {
      const { data: brandData } = await adminClient
        .from("brands")
        .select("*, entity:entities(*)")
        .eq("id", body.brand_id)
        .single();

      if (brandData) {
        brand = brandData as unknown as Brand;
        entity = brandData.entity as unknown as Entity;
      }
    }

    if (body.platform) {
      const { data: platformData } = await adminClient
        .from("lookup_platforms")
        .select("*")
        .eq("name", body.platform)
        .single();

      if (platformData) {
        lookupPlatform = platformData as LookupPlatform;
      }
    }

    // Build prompts
    const systemPrompt = buildContentPrompt(
      brand,
      entity?.ai_context || null,
      body.platform,
      body.content_type,
      lookupPlatform,
      body.tone
    );

    let userMessage = `Generate ${variations} variations of the following content:\n\n`;
    userMessage += `Content type: ${body.content_type}\n`;
    if (body.platform) userMessage += `Platform: ${body.platform}\n`;
    userMessage += `Length: ${getLengthGuidance(body.length)}\n\n`;
    userMessage += `Request: ${body.prompt}`;

    if (body.reference_content) {
      userMessage += `\n\nREFERENCE MATERIAL (use this as context, not to copy):\n${body.reference_content}`;
    }

    const selectedModel = selectContentModel(body.content_type, body.platform, body.model);

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          send({ type: "start", model: selectedModel });

          let fullText = "";

          for await (const chunk of streamChatCompletion(selectedModel, messages, undefined, "pro")) {
            if (chunk.fallback) {
              send({ type: "fallback", from: chunk.from, to: chunk.to });
              continue;
            }

            if (!chunk.done && chunk.content) {
              fullText += chunk.content;
              send({ type: "chunk", content: chunk.content });
            }

            if (chunk.done) {
              // Parse the full response into variations
              const variations = parseStreamedResponse(fullText, body.platform);
              send({
                type: "done",
                fullText,
                variations,
                model: selectedModel,
                usage: chunk.usage || { inputTokens: 0, outputTokens: 0 },
              });
            }
          }
        } catch (error: any) {
          send({ type: "error", message: error.message || "Generation failed" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Parse streamed response into structured variations
 */
function parseStreamedResponse(
  response: string,
  platform?: string
): Array<{
  content: string;
  hook?: string;
  callToAction?: string;
  hashtags?: string[];
  characterCount: number;
}> {
  try {
    const jsonMatch = response.match(/\{[\s\S]*"variations"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.variations && Array.isArray(parsed.variations)) {
        return parsed.variations.map((v: any) => ({
          content: v.content || "",
          hook: v.hook || null,
          callToAction: v.callToAction || v.call_to_action || null,
          hashtags: v.hashtags || [],
          characterCount: v.characterCount || v.content?.length || 0,
        }));
      }
    }

    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.map((v: any) => ({
          content: v.content || "",
          hook: v.hook || null,
          callToAction: v.callToAction || v.call_to_action || null,
          hashtags: v.hashtags || [],
          characterCount: v.characterCount || v.content?.length || 0,
        }));
      }
    }
  } catch {
    // fall through
  }

  return [
    {
      content: response.trim(),
      hook: undefined,
      callToAction: undefined,
      hashtags: [],
      characterCount: response.trim().length,
    },
  ];
}
