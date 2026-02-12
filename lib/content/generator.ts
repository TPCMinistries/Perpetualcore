/**
 * Content Generation Engine
 *
 * Core engine that generates branded, platform-specific content
 * using the AI router, brand configuration, and voice examples.
 * Replaces the dead n8n webhook pipeline.
 */

import { getChatCompletion, ChatMessage } from "@/lib/ai/router";
import { calculateCost } from "@/lib/ai/model-selector";
import { buildContentPrompt } from "./brand-voice";
import { Brand, Entity, LookupPlatform } from "@/types/entities";
import { AIModel } from "@/types";
import { createAdminClient } from "@/lib/supabase/server";

// =====================================================
// TYPES
// =====================================================

export interface GenerateContentOptions {
  prompt: string;
  contentType: string;
  platform?: string;
  brandId?: string;
  tone?: string;
  length?: string;
  referenceContent?: string;
  variations?: number;
  model?: AIModel;
}

export interface ContentVariation {
  content: string;
  hook?: string;
  callToAction?: string;
  hashtags?: string[];
  characterCount: number;
  platform?: string;
}

export interface ContentGenerationResult {
  variations: ContentVariation[];
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  cost: number;
}

// =====================================================
// MODEL ROUTING
// =====================================================

/**
 * Select optimal model based on content type and platform
 */
function selectContentModel(
  contentType: string,
  platform?: string,
  override?: AIModel
): AIModel {
  if (override && override !== "auto") return override;

  const routingMap: Record<string, AIModel> = {
    // Platform-specific
    "linkedin": "claude-sonnet-4",
    "twitter": "gpt-4o-mini",
    "instagram": "gpt-4o-mini",
    "youtube": "gpt-4o",
    "email": "claude-sonnet-4",
    "website": "claude-sonnet-4",
  };

  const typeMap: Record<string, AIModel> = {
    "blog": "claude-sonnet-4",
    "newsletter": "claude-sonnet-4",
    "social": "gpt-4o-mini",
    "video_script": "gpt-4o",
    "linkedin_post": "claude-sonnet-4",
    "twitter_thread": "gpt-4o-mini",
    "instagram_caption": "gpt-4o-mini",
    "youtube_script": "gpt-4o",
    "press_release": "claude-sonnet-4",
    "case_study": "claude-sonnet-4",
  };

  // Platform takes priority, then content type
  return routingMap[platform || ""] || typeMap[contentType] || "claude-sonnet-4";
}

/**
 * Get length guidance for the prompt
 */
function getLengthGuidance(length?: string): string {
  switch (length) {
    case "short":
      return "Keep it concise. Under 280 characters if social, under 200 words otherwise.";
    case "long":
      return "Write a comprehensive, in-depth piece. 800-2000 words for articles, 200+ words for social.";
    case "medium":
    default:
      return "Medium length. 100-300 words for social, 500-1000 words for articles.";
  }
}

// =====================================================
// MAIN GENERATION FUNCTION
// =====================================================

export async function generateContent(
  options: GenerateContentOptions
): Promise<ContentGenerationResult> {
  const {
    prompt,
    contentType,
    platform,
    brandId,
    tone,
    length,
    referenceContent,
    variations = 3,
    model: modelOverride,
  } = options;

  // 1. Load brand + entity context if brandId provided
  let brand: Brand | null = null;
  let entity: Entity | null = null;
  let lookupPlatform: LookupPlatform | null = null;

  if (brandId) {
    const supabase = createAdminClient();

    const { data: brandData } = await supabase
      .from("brands")
      .select("*, entity:entities(*)")
      .eq("id", brandId)
      .single();

    if (brandData) {
      brand = brandData as unknown as Brand;
      entity = brandData.entity as unknown as Entity;
    }
  }

  // 2. Load platform rules from lookup_platforms if platform specified
  if (platform) {
    const supabase = createAdminClient();
    const { data: platformData } = await supabase
      .from("lookup_platforms")
      .select("*")
      .eq("name", platform)
      .single();

    if (platformData) {
      lookupPlatform = platformData as LookupPlatform;
    }
  }

  // 3. Build system prompt
  const systemPrompt = buildContentPrompt(
    brand,
    entity?.ai_context || null,
    platform,
    contentType,
    lookupPlatform,
    tone
  );

  // 4. Build user message
  let userMessage = `Generate ${variations} variations of the following content:\n\n`;
  userMessage += `Content type: ${contentType}\n`;
  if (platform) userMessage += `Platform: ${platform}\n`;
  userMessage += `Length: ${getLengthGuidance(length)}\n\n`;
  userMessage += `Request: ${prompt}`;

  if (referenceContent) {
    userMessage += `\n\nREFERENCE MATERIAL (use this as context, not to copy):\n${referenceContent}`;
  }

  // 5. Select model
  const selectedModel = selectContentModel(contentType, platform, modelOverride);

  // 6. Call AI router
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  const result = await getChatCompletion(selectedModel, messages, "pro");

  // 7. Parse response
  const parsedVariations = parseGenerationResponse(result.response, platform);

  return {
    variations: parsedVariations,
    model: selectedModel,
    usage: result.usage,
    cost: result.cost,
  };
}

// =====================================================
// RESPONSE PARSING
// =====================================================

function parseGenerationResponse(
  response: string,
  platform?: string
): ContentVariation[] {
  try {
    // Try to extract JSON from the response
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
          platform: platform || null,
        }));
      }
    }

    // Try parsing as a JSON array directly
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
          platform: platform || null,
        }));
      }
    }
  } catch {
    // JSON parsing failed, fall through to text fallback
  }

  // Fallback: treat the entire response as a single variation
  return [
    {
      content: response.trim(),
      hook: undefined,
      callToAction: undefined,
      hashtags: [],
      characterCount: response.trim().length,
      platform: platform || undefined,
    },
  ];
}
