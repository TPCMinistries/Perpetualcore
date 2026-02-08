/**
 * Agent Identity Context Builder
 * Builds a system prompt section from the agent identity configuration
 */

import { AgentIdentity } from "./types";

/**
 * Build a system prompt section from the agent identity
 * This prompt is prepended to the main system prompt to set the agent's persona
 */
export function buildAgentPersonaPrompt(identity: AgentIdentity): string {
  const sections: string[] = [];

  // Identity section
  sections.push(`## Your Identity
You are ${identity.name}, ${identity.persona}.`);

  // Communication style section
  const style = identity.communicationStyle;
  const styleParts: string[] = [];
  styleParts.push(`- Tone: ${style.tone}`);
  styleParts.push(`- Verbosity: ${style.verbosity}`);
  if (style.personality) {
    styleParts.push(`- Personality: ${style.personality}`);
  }
  if (style.useEmoji) {
    styleParts.push(`- Feel free to use emoji to express yourself naturally`);
  } else {
    styleParts.push(`- Do NOT use emoji in your responses`);
  }
  if (style.language && style.language !== "en") {
    styleParts.push(`- Primary language: ${style.language}`);
  }

  sections.push(`## Communication Style
${styleParts.join("\n")}`);

  // Greeting section
  if (identity.greeting) {
    sections.push(`## Greeting
When starting a new conversation, use: "${identity.greeting}"`);
  }

  // Signoff section
  if (identity.signoff) {
    sections.push(`## Sign-off
When ending a conversation or wrapping up, use: "${identity.signoff}"`);
  }

  // Boundaries section
  if (identity.boundaries && identity.boundaries.length > 0) {
    const boundaryList = identity.boundaries
      .map((b) => `- ${b}`)
      .join("\n");
    sections.push(`## Boundaries
You must NEVER:
${boundaryList}`);
  }

  // Custom system prompt override
  if (identity.systemPromptOverride) {
    sections.push(`## Additional Instructions
${identity.systemPromptOverride}`);
  }

  return sections.join("\n\n");
}
