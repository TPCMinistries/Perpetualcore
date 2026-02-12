/**
 * Lorenzo's Voice Examples
 *
 * Real excerpts from Lorenzo's blog articles, tagged by writing style.
 * Used as few-shot examples in content generation prompts to ensure
 * AI-generated content matches his actual voice.
 *
 * Source: lorenzodc-personal-site/content/articles/
 */

export interface VoiceExample {
  style: string;
  label: string;
  description: string;
  excerpt: string;
}

export const VOICE_EXAMPLES: VoiceExample[] = [
  {
    style: "thought_leader",
    label: "Thought Leader",
    description: "Contrarian, framework-driven. Best for LinkedIn and strategic positioning.",
    excerpt: `No, AI won't replace you directly. But someone who knows how to use AI? They absolutely will. Think about what happened with the internet. Did websites replace accountants? No. But accountants who used software crushed those who didn't. Same pattern with email, smartphones, and social media. The technology didn't replace people. It created a gap between adopters and resisters.`,
  },
  {
    style: "practical",
    label: "Practical",
    description: "Actionable, ROI-focused. Best for Twitter/social and tactical guides.",
    excerpt: `Email Response Templates with AI - Time saved: 3-5 hours/week. Stop typing the same emails over and over. Use ChatGPT or Claude to create 10-15 response templates for your most common inquiries. Pick one automation from this list. Just one. Implement it this week. The goal isn't to automate everything overnight. It's to build momentum. Each automation you add compounds your time savings.`,
  },
  {
    style: "storyteller",
    label: "Storyteller",
    description: "Narrative, personal. Best for blog posts and newsletter deep-dives.",
    excerpt: `The AI consulting market is flooded with providers making big promises. Some deliver incredible value. Others waste your time and money. Here's how to tell the difference. The stakes are real: businesses regularly lose months and tens of thousands of dollars on failed AI implementations. The wrong consultant can set you back significantly. This guide gives you the framework to avoid those mistakes.`,
  },
  {
    style: "mission_driven",
    label: "Mission Driven",
    description: "Values-led, impact-focused. Best for IHA, nonprofit, and cause-based content.",
    excerpt: `Nonprofits face a paradox: they need to scale impact, but they're resource-constrained by design. Every dollar spent on operations is a dollar not spent on mission. AI changes that equation. Every hour saved from spreadsheets is an hour returned to mission. Every donor who stays is a donor who keeps giving. Every story told is a story that inspires more support. AI isn't about replacing the humanity in nonprofit work—it's about amplifying it.`,
  },
];

/**
 * Get voice examples matching a style or content type + platform combination
 */
export function getWritingExamples(
  platform?: string,
  contentType?: string
): VoiceExample[] {
  // Map platform/content type to best-matching style
  const styleMap: Record<string, string> = {
    linkedin: "thought_leader",
    twitter: "practical",
    instagram: "practical",
    website: "storyteller",
    blog: "storyteller",
    newsletter: "storyteller",
    video_script: "storyteller",
    email: "practical",
  };

  const targetStyle = styleMap[platform || ""] || styleMap[contentType || ""] || null;

  if (targetStyle) {
    // Return the matching style first, then one contrasting example
    const primary = VOICE_EXAMPLES.filter((e) => e.style === targetStyle);
    const secondary = VOICE_EXAMPLES.filter((e) => e.style !== targetStyle).slice(0, 1);
    return [...primary, ...secondary];
  }

  // Return all examples if no specific match
  return VOICE_EXAMPLES;
}
