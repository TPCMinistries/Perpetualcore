/**
 * Brand Voice Prompt Builder
 *
 * Constructs system prompts for content generation using brand tone_config,
 * entity AI context, platform rules, and real writing examples.
 */

import { Brand, BrandToneConfig, EntityAIContext, LookupPlatform } from "@/types/entities";
import { getWritingExamples } from "./examples";

/**
 * Platform-specific formatting rules and best practices
 */
const PLATFORM_RULES: Record<string, { rules: string; format: string; bestPractices: string }> = {
  linkedin: {
    rules: "Character limit: 3,000. First 150 characters are visible before 'see more'. Use line breaks for readability.",
    format: "- Use short paragraphs (1-2 sentences)\n- Start with a strong hook\n- End with a question or CTA to drive engagement\n- Use bullet points for lists\n- Emojis OK but keep professional",
    bestPractices: "Lead with insight, not promotion. Share frameworks and mental models. Tell stories that teach. Ask questions that spark discussion. Tag relevant people when appropriate.",
  },
  twitter: {
    rules: "Character limit: 280 per tweet. Threads up to 25 tweets. No markdown formatting.",
    format: "- Concise, punchy sentences\n- One idea per tweet\n- Use threads for longer takes\n- First tweet must hook\n- Last tweet should have CTA",
    bestPractices: "Be direct. Lead with the most interesting point. Use numbers and specifics. Contrarian takes perform well. Threads should have a clear payoff.",
  },
  instagram: {
    rules: "Caption limit: 2,200 characters. First 125 visible before 'more'. Hashtags: 3-5 relevant ones.",
    format: "- Front-load the hook\n- Use line breaks liberally\n- Hashtags at the end\n- Emoji as visual markers",
    bestPractices: "Visual-first platform. Caption should complement imagery. Carousel posts outperform single images. Stories for behind-the-scenes. Reels for reach.",
  },
  youtube: {
    rules: "Title: 60 chars max. Description: 5,000 chars. Script should target specific runtime.",
    format: "- Hook in first 30 seconds\n- Pattern interrupt every 2-3 minutes\n- Clear sections with transitions\n- End with subscribe CTA",
    bestPractices: "Start with the payoff, then deliver. Use storytelling structure. Address viewer directly. Include timestamps in description.",
  },
  website: {
    rules: "No strict limit. SEO-optimized with H2/H3 structure. Meta description: 155 chars.",
    format: "- Use H2 and H3 headers\n- Short paragraphs (2-3 sentences)\n- Bullet points for scanability\n- Include internal links\n- Meta description for SEO",
    bestPractices: "Write for humans first, search engines second. Lead with value. Use data to back claims. Include clear CTAs. Optimize for featured snippets.",
  },
  email: {
    rules: "Subject line: 40-60 chars. Preview text: 35-90 chars. Body: focused on single CTA.",
    format: "- Short subject line that creates curiosity\n- Personal, conversational tone\n- Single column, mobile-friendly\n- One primary CTA\n- P.S. line for secondary message",
    bestPractices: "Write like a person, not a brand. One goal per email. Preview text matters as much as subject. Segment your audience. Test send times.",
  },
};

/**
 * Build platform-specific formatting rules
 */
export function buildPlatformRules(
  platform?: string,
  lookupPlatform?: LookupPlatform | null
): string {
  if (!platform) return "";

  const rules = PLATFORM_RULES[platform];
  if (!rules) return "";

  let section = `\nPLATFORM RULES (${platform.toUpperCase()}):`;

  if (lookupPlatform?.character_limit) {
    section += `\n- Hard character limit: ${lookupPlatform.character_limit}`;
  }

  section += `\n${rules.rules}`;
  section += `\n\nFORMATTING:\n${rules.format}`;
  section += `\n\nBEST PRACTICES:\n${rules.bestPractices}`;

  return section;
}

/**
 * Build the full content generation system prompt
 */
export function buildContentPrompt(
  brand?: Brand | null,
  entityAIContext?: EntityAIContext | null,
  platform?: string,
  contentType?: string,
  lookupPlatform?: LookupPlatform | null,
  toneOverride?: string
): string {
  const sections: string[] = [];

  sections.push("You are a content generation engine. Generate high-quality, branded content that sounds like a real person wrote it — not generic AI output.");

  // Brand voice section
  if (brand?.tone_config) {
    const tc = brand.tone_config;
    sections.push(buildBrandVoiceSection(brand.name, tc, toneOverride));
  } else if (toneOverride) {
    sections.push(`\nTONE: Write in a ${toneOverride} tone.`);
  }

  // Entity context section
  if (entityAIContext) {
    sections.push(buildEntityContextSection(entityAIContext));
  }

  // Platform rules
  const platformRules = buildPlatformRules(platform, lookupPlatform);
  if (platformRules) {
    sections.push(platformRules);
  }

  // Writing examples
  const examples = getWritingExamples(platform, contentType);
  if (examples.length > 0) {
    sections.push(buildExamplesSection(examples));
  }

  // Output format instructions
  sections.push(buildOutputInstructions());

  return sections.join("\n\n");
}

function buildBrandVoiceSection(
  brandName: string,
  tc: BrandToneConfig,
  toneOverride?: string
): string {
  let section = `BRAND VOICE (${brandName}):`;
  section += `\n- Voice: ${toneOverride || tc.voice}`;

  if (tc.personality_traits?.length > 0) {
    section += `\n- Personality: ${tc.personality_traits.join(", ")}`;
  }
  if (tc.writing_style) {
    section += `\n- Writing style: ${tc.writing_style}`;
  }
  if (tc.preferred_phrases?.length > 0) {
    section += `\n- Preferred phrases: ${tc.preferred_phrases.join(", ")}`;
  }
  if (tc.avoid_words?.length > 0) {
    section += `\n- Avoid: ${tc.avoid_words.join(", ")}`;
  }
  section += `\n- Emoji usage: ${tc.emoji_usage || "minimal"}`;
  section += `\n- Hashtag strategy: ${tc.hashtag_strategy || "relevant"}`;
  section += `\n- CTA style: ${tc.cta_style || "soft"}`;

  return section;
}

function buildEntityContextSection(ctx: EntityAIContext): string {
  let section = "ENTITY CONTEXT:";

  if (ctx.personality) {
    section += `\n- Personality: ${ctx.personality}`;
  }
  if (ctx.tone) {
    section += `\n- Tone: ${ctx.tone}`;
  }
  if (ctx.key_messages?.length) {
    section += `\n- Key messages: ${ctx.key_messages.join("; ")}`;
  }
  if (ctx.values?.length) {
    section += `\n- Values: ${ctx.values.join(", ")}`;
  }
  if (ctx.communication_style) {
    section += `\n- Communication style: ${ctx.communication_style}`;
  }
  if (ctx.avoid_topics?.length) {
    section += `\n- Avoid topics: ${ctx.avoid_topics.join(", ")}`;
  }

  return section;
}

function buildExamplesSection(
  examples: { style: string; label: string; excerpt: string }[]
): string {
  let section = "EXAMPLES OF THE BRAND'S REAL WRITING:";
  section += "\nStudy these examples and match the voice, cadence, and personality:\n";

  for (const ex of examples) {
    section += `\n[${ex.label}]:\n"${ex.excerpt}"\n`;
  }

  return section;
}

function buildOutputInstructions(): string {
  return `OUTPUT FORMAT:
Return a JSON object with the following structure:
{
  "variations": [
    {
      "content": "The full content text",
      "hook": "The opening line/hook",
      "callToAction": "The CTA if applicable",
      "hashtags": ["relevant", "hashtags"],
      "characterCount": 123
    }
  ]
}

RULES:
- Each variation should be meaningfully different (different angle, hook, or structure)
- Never use filler phrases like "In today's fast-paced world" or "Let's dive in"
- Sound human, not AI-generated
- Respect platform character limits strictly
- Include character count for each variation`;
}
