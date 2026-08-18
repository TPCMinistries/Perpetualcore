import Anthropic from "@anthropic-ai/sdk";
import { PressHttpError } from "../auth";
import { PRESS_ASSET_BUCKET, createPressAdminClient } from "../db";
import { getPressStoryVoice, type PressStoryVoice } from "./voices";
import {
  PRESS_STORY_MAX_INTERVIEW_QUESTIONS,
  type PressStory,
  type PressStoryAsset,
  type PressStoryOutputs,
} from "./types";

// Claude Opus 5. Not the Claude Fable 5 tier — no `thinking` param support/needed
// here, and the installed @anthropic-ai/sdk (v0.67) predates output_config
// structured outputs, so structured JSON is obtained via a single forced tool call.
const PRESS_STORY_MODEL = "claude-opus-5";
const PRESS_STORY_MAX_CONTEXT_ASSETS = 12;
const PRESS_STORY_MAX_IMAGE_PAYLOAD_BYTES = 15 * 1024 * 1024;

let cachedClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

function renderVoiceBible(voice: PressStoryVoice): string {
  const sections: string[] = [`Voice: ${voice.name}`];
  if (voice.toneRules.length) sections.push(`Tone rules:\n- ${voice.toneRules.join("\n- ")}`);
  if (voice.exemplars.length) {
    sections.push(
      `Exemplars:\n${voice.exemplars.map((exemplar) => `  [${exemplar.platform}] ${exemplar.text}`).join("\n")}`,
    );
  }
  if (voice.hooks.length) sections.push(`Hooks to draw on when they fit:\n- ${voice.hooks.join("\n- ")}`);
  if (voice.antiPatterns.length) sections.push(`Never do:\n- ${voice.antiPatterns.join("\n- ")}`);
  if (voice.bannedPhrases.length) sections.push(`Banned phrases (never use): ${voice.bannedPhrases.join(", ")}`);
  // `notes` is typed as a single string in the voice-bible contract; render as-is.
  if (voice.notes.length) sections.push(`Notes:\n- ${voice.notes.join("\n- ")}`);
  return sections.join("\n\n");
}

function buildSystemPrompt(story: PressStory): string {
  const voice = getPressStoryVoice(story.voice_key);
  return [
    "You are Press, the media desk for Lorenzo's organizations. You interview the user about a real moment " +
      "they documented and then write content in the brand voice. Be concrete, use the user's own words and " +
      "details, never invent facts, names, numbers, or quotes.",
    renderVoiceBible(voice),
  ].join("\n\n");
}

function describeAssetLine(index: number, asset: PressStoryAsset, note: string | null): string {
  const parts = [
    `Asset ${index + 1} (asset_id ${asset.id}): ${asset.kind}`,
    asset.original_filename ? `"${asset.original_filename}"` : null,
    asset.caption_hint ? `note: ${asset.caption_hint}` : null,
    asset.duration_ms ? `${Math.round(asset.duration_ms / 1000)}s` : null,
    note,
  ].filter(Boolean);
  return `- ${parts.join(", ")}`;
}

type StoryContext = {
  systemPrompt: string;
  /** Interleaved [label text, image] blocks per asset, so captions map to the right asset_id. */
  assetBlocks: Anthropic.ContentBlockParam[];
  assetLines: string[];
};

/** Builds the system prompt + image content blocks Claude sees for a story (interview or generation). */
async function buildStoryContext(story: PressStory, assets: PressStoryAsset[]): Promise<StoryContext> {
  const systemPrompt = buildSystemPrompt(story);
  const uploaded = assets.filter((asset) => asset.status === "uploaded");
  const images = uploaded.filter((asset) => asset.kind === "image");
  const videosWithPosters = uploaded.filter((asset) => asset.kind === "video" && asset.poster_path);
  const ordered = [...images, ...videosWithPosters].slice(0, PRESS_STORY_MAX_CONTEXT_ASSETS);

  const admin = createPressAdminClient();
  const assetBlocks: Anthropic.ContentBlockParam[] = [];
  const assetLines: string[] = [];
  let totalBytes = 0;
  const pushLine = (line: string) => { assetLines.push(line); assetBlocks.push({ type: "text", text: line }); };

  for (let index = 0; index < ordered.length; index += 1) {
    const asset = ordered[index];
    const isVideo = asset.kind === "video";
    const path = isVideo ? asset.poster_path : asset.storage_path;
    const mediaType: "image/jpeg" | "image/png" = isVideo || asset.mime_type !== "image/png" ? "image/jpeg" : "image/png";

    if (!path || (!isVideo && asset.mime_type !== "image/jpeg" && asset.mime_type !== "image/png")) {
      pushLine(describeAssetLine(index, asset, "image not shown — unsupported format"));
      continue;
    }
    if (totalBytes >= PRESS_STORY_MAX_IMAGE_PAYLOAD_BYTES) {
      pushLine(describeAssetLine(index, asset, "image omitted — payload cap reached"));
      continue;
    }
    const { data: downloaded, error: downloadError } = await admin.storage.from(PRESS_ASSET_BUCKET).download(path);
    if (downloadError || !downloaded) {
      pushLine(describeAssetLine(index, asset, "image unavailable"));
      continue;
    }
    const buffer = Buffer.from(await downloaded.arrayBuffer());
    if (totalBytes + buffer.byteLength > PRESS_STORY_MAX_IMAGE_PAYLOAD_BYTES) {
      pushLine(describeAssetLine(index, asset, "image omitted — payload cap reached"));
      continue;
    }
    totalBytes += buffer.byteLength;
    pushLine(describeAssetLine(index, asset, isVideo ? "poster frame shown below" : "shown below"));
    assetBlocks.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") },
    });
  }
  // Assets beyond the context cap or without a poster are still listed by id so they can be captioned.
  for (const asset of uploaded) {
    if (ordered.includes(asset)) continue;
    pushLine(describeAssetLine(ordered.length + assetLines.length, asset, "not shown"));
  }

  return { systemPrompt, assetBlocks, assetLines };
}

function formatInterviewTranscript(story: PressStory): string {
  if (story.interview.length === 0) return "(no interview turns yet)";
  return story.interview.map((turn) => `${turn.role === "assistant" ? "Q" : "A"}: ${turn.text}`).join("\n");
}

function readToolResult<T>(response: Anthropic.Message, toolName: string): T {
  if (response.stop_reason === "refusal") {
    throw new PressHttpError(502, "Press's writer declined to respond to this story. Try adjusting the notes or photos.");
  }
  const block = response.content.find(
    (candidate): candidate is Anthropic.ToolUseBlock => candidate.type === "tool_use" && candidate.name === toolName,
  );
  if (!block) {
    throw new PressHttpError(502, "Press's writer did not return a usable response. Try again.");
  }
  return block.input as T;
}

export type NextInterviewQuestion = { complete: boolean; question: string | null; reason: string };

/** Asks Claude for the single next interview question, or a decision that the interview is complete. */
export async function askNextInterviewQuestion(
  story: PressStory,
  assets: PressStoryAsset[],
): Promise<NextInterviewQuestion> {
  const { systemPrompt, assetBlocks, assetLines } = await buildStoryContext(story, assets);
  const assistantTurns = story.interview.filter((turn) => turn.role === "assistant").length;
  const forceComplete = assistantTurns >= PRESS_STORY_MAX_INTERVIEW_QUESTIONS;

  const userText = [
    `Story title: ${story.title}`,
    story.notes ? `Notes from the user: ${story.notes}` : null,
    "",
    assetLines.length ? "Photos/videos in this story are shown above, each labeled with its asset_id." : "(no assets uploaded yet)",
    "",
    "Interview so far:",
    formatInterviewTranscript(story),
    "",
    forceComplete
      ? `You have already asked ${assistantTurns} questions, the maximum for this interview — set complete=true now.`
      : "Ask ONE question at a time, short and specific to what's visible in the photos, the notes, and prior " +
        "answers. Aim to elicit: what happened and where/when, who was there (roles, not necessarily names), " +
        "the moment that mattered, a concrete number or detail, why it matters for the mission, and what's " +
        "next / a call to action. If this is the first question, acknowledge what you see in the photos in " +
        "one clause. Mark complete=true once you have enough to write strong content.",
  ].filter((line): line is string => line !== null).join("\n");

  const tool: Anthropic.Tool = {
    name: "next_question",
    description: "Report the single next interview question to ask, or mark the interview complete.",
    input_schema: {
      type: "object",
      properties: {
        complete: { type: "boolean", description: "True once enough has been gathered to generate strong content." },
        question: { type: ["string", "null"], description: "The single next question to ask, or null when complete." },
        reason: { type: "string", description: "One short sentence on why this question (or completion) was chosen." },
      },
      required: ["complete", "question", "reason"],
      additionalProperties: false,
    },
  };

  const response = await getAnthropicClient().messages.create({
    model: PRESS_STORY_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    tools: [tool],
    tool_choice: { type: "tool", name: "next_question" },
    messages: [{ role: "user", content: [...assetBlocks, { type: "text", text: userText }] }],
  });

  return readToolResult<NextInterviewQuestion>(response, "next_question");
}

/** Generates the full set of brand-voice content pieces for a finished (or force-completed) story. */
export async function generateStoryOutputs(
  story: PressStory,
  assets: PressStoryAsset[],
): Promise<PressStoryOutputs> {
  const { systemPrompt, assetBlocks, assetLines } = await buildStoryContext(story, assets);
  const uploadedAssetIds = assets.filter((asset) => asset.status === "uploaded").map((asset) => asset.id);

  const userText = [
    `Story title: ${story.title}`,
    story.notes ? `Notes from the user: ${story.notes}` : null,
    "",
    assetLines.length ? "Photos/videos in this story are shown above, each labeled with its asset_id — use those ids in photo_captions." : "(no assets uploaded)",
    "",
    "Interview transcript (use the user's own words and details verbatim where they're strong; never invent " +
      "facts, names, numbers, or quotes):",
    formatInterviewTranscript(story),
    "",
    "Write the full set of content pieces now, in the voice above.",
  ].filter((line): line is string => line !== null).join("\n");

  const assetIdSchema = uploadedAssetIds.length > 0
    ? { type: "string", enum: uploadedAssetIds }
    : { type: "string" };

  const tool: Anthropic.Tool = {
    name: "deliver_content",
    description: "Deliver the finished set of content pieces for this story.",
    input_schema: {
      type: "object",
      properties: {
        headline: { type: "string", description: "Headline, at most 90 characters." },
        summary: { type: "string", description: "One-paragraph plain summary of what happened, in the voice." },
        linkedin: { type: "string", description: "LinkedIn post, 900-1500 characters, line breaks, at most 3 hashtags total." },
        instagram: { type: "string", description: "Instagram caption, at most 2000 characters, with 5-10 hashtags at the end." },
        x_thread: {
          type: "array",
          description: "One post per array item, 3-7 posts, each at most 280 characters.",
          items: { type: "string" },
          minItems: 3,
          maxItems: 7,
        },
        newsletter: {
          type: "object",
          properties: {
            subject: { type: "string", description: "Subject line, at most 60 characters." },
            body: { type: "string", description: "Body, 120-220 words." },
          },
          required: ["subject", "body"],
          additionalProperties: false,
        },
        photo_captions: {
          type: "array",
          description: "Suggested caption per uploaded asset that was shown above.",
          items: {
            type: "object",
            properties: {
              asset_id: assetIdSchema,
              caption: { type: "string" },
            },
            required: ["asset_id", "caption"],
            additionalProperties: false,
          },
          maxItems: Math.max(uploadedAssetIds.length, 0),
        },
        hooks: {
          type: "array",
          description: "3-6 short pull-quotes/hooks lifted from the interview.",
          items: { type: "string" },
          minItems: 3,
          maxItems: 6,
        },
      },
      required: ["headline", "summary", "linkedin", "instagram", "x_thread", "newsletter", "photo_captions", "hooks"],
      additionalProperties: false,
    },
  };

  const response = await getAnthropicClient().messages.create({
    model: PRESS_STORY_MODEL,
    max_tokens: 8000,
    system: systemPrompt,
    tools: [tool],
    tool_choice: { type: "tool", name: "deliver_content" },
    messages: [{ role: "user", content: [...assetBlocks, { type: "text", text: userText }] }],
  });

  const delivered = readToolResult<Omit<PressStoryOutputs, "generated_at" | "model">>(response, "deliver_content");
  return { ...delivered, generated_at: new Date().toISOString(), model: PRESS_STORY_MODEL };
}
