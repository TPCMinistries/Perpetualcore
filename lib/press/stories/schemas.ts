import { z } from "zod";
import { PRESS_STORY_VOICE_KEYS } from "./voices";
import {
  PRESS_STORY_IMAGE_MIME_TYPES,
  PRESS_STORY_MAX_IMAGE_BYTES,
  PRESS_STORY_MAX_VIDEO_BYTES,
  PRESS_STORY_VIDEO_MIME_TYPES,
} from "./types";

export const uuidSchema = z.string().uuid();
export const storyVoiceKeySchema = z.enum(PRESS_STORY_VOICE_KEYS as [string, ...string[]]);

export const createStorySchema = z.object({
  title: z.string().trim().min(1).max(160),
  voice_key: storyVoiceKeySchema,
  notes: z.string().max(4000).optional(),
  organizationId: uuidSchema.optional(),
}).strict();

export const updateStorySchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  voice_key: storyVoiceKeySchema.optional(),
  notes: z.string().max(4000).optional(),
  interview_complete: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "No updates provided");

export const uploadIntentSchema = z.object({
  kind: z.enum(["image", "video"]),
  mime_type: z.string().trim().min(1).max(100),
  file_size: z.number().int().positive(),
  original_filename: z.string().trim().min(1).max(255).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration_ms: z.number().int().positive().optional(),
  caption_hint: z.string().trim().max(2000).optional(),
  with_poster: z.boolean().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.kind === "image") {
    if (!(PRESS_STORY_IMAGE_MIME_TYPES as readonly string[]).includes(value.mime_type)) {
      ctx.addIssue({ code: "custom", path: ["mime_type"], message: "Unsupported image type" });
    }
    if (value.file_size > PRESS_STORY_MAX_IMAGE_BYTES) {
      ctx.addIssue({ code: "custom", path: ["file_size"], message: "Image exceeds the 25MB limit" });
    }
    if (value.with_poster) {
      ctx.addIssue({ code: "custom", path: ["with_poster"], message: "with_poster only applies to video assets" });
    }
  } else {
    if (!(PRESS_STORY_VIDEO_MIME_TYPES as readonly string[]).includes(value.mime_type)) {
      ctx.addIssue({ code: "custom", path: ["mime_type"], message: "Unsupported video type" });
    }
    if (value.file_size > PRESS_STORY_MAX_VIDEO_BYTES) {
      ctx.addIssue({ code: "custom", path: ["file_size"], message: "Video exceeds the 512MB limit" });
    }
  }
});

export const finalizeAssetSchema = z.object({
  file_size: z.number().int().positive(),
  poster_uploaded: z.boolean().optional(),
}).strict();

export const interviewInputSchema = z.object({
  answer: z.string().trim().min(1).max(4000).optional(),
}).strict();
