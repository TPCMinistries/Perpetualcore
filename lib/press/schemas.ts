import { z } from "zod";

export const uuidSchema = z.string().uuid();
export const projectStatusSchema = z.enum([
  "draft", "uploading", "processing", "transcribing", "review",
  "rendering", "ready", "failed", "archived",
]);

export const createProjectSchema = z.object({
  organizationId: uuidSchema.optional(),
  title: z.string().trim().min(1).max(160),
  brandId: uuidSchema.optional(),
  platforms: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  rightsAttested: z.literal(true),
}).strict();

export const updateProjectSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  status: projectStatusSchema.optional(),
  platforms: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "No updates provided");

export const uploadIntentSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().regex(/^(audio|video)\/[a-z0-9.+-]+$/i),
  fileSize: z.number().int().positive().max(2 * 1024 * 1024 * 1024),
  checksum: z.string().trim().regex(/^[0-9a-f]{64}$/).optional(),
}).strict();

export const finalizeAssetSchema = z.object({
  checksum: z.string().trim().regex(/^[0-9a-f]{64}$/).optional(),
  durationSeconds: z.number().positive().max(24 * 60 * 60).optional(),
}).strict();

export const transcriptSegmentSchema = z.object({
  id: uuidSchema.optional(),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  speaker: z.string().trim().max(120).nullable().optional(),
  text: z.string().trim().min(1).max(20_000),
  confidence: z.number().min(0).max(1).nullable().optional(),
}).strict().refine((value) => value.endMs > value.startMs, "endMs must be after startMs");

export const updateTranscriptSchema = z.object({
  version: z.number().int().positive(),
  fullText: z.string().max(2_000_000),
  segments: z.array(transcriptSegmentSchema).max(100_000),
}).strict();

export const clipActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), version: z.number().int().positive() }).strict(),
  z.object({
    action: z.literal("reject"), version: z.number().int().positive(),
    rejectionReason: z.string().trim().min(1).max(1000),
  }).strict(),
  z.object({
    action: z.literal("update"), version: z.number().int().positive(),
    startMs: z.number().int().nonnegative().optional(),
    endMs: z.number().int().positive().optional(),
    title: z.string().trim().min(1).max(180).optional(),
    hook: z.string().trim().max(500).nullable().optional(),
  }).strict(),
]);

export const renderFormatSchema = z.object({
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]),
  template: z.enum(["clean", "editorial"]).default("clean"),
  captionStyle: z.enum(["none", "minimal", "bold", "brand"]).default("minimal"),
  settings: z.object({
    focalPoint: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    }).strict().default({ x: 0.5, y: 0.5 }),
    captionPosition: z.enum(["top", "center", "bottom"]).default("bottom"),
  }).strict().default({ focalPoint: { x: 0.5, y: 0.5 }, captionPosition: "bottom" }),
}).strict();

export const createRendersSchema = z.object({
  formats: z.array(renderFormatSchema).min(1).max(3),
}).strict();

export const createAuthenticClipPackSchema = z.object({
  recipe: z.literal("authentic_clip_pack"),
  title: z.string().trim().min(1).max(180),
  brief: z.string().trim().max(2000).default(""),
  clipCount: z.number().int().min(3).max(12),
  targetMinSeconds: z.number().int().min(10).max(90),
  targetMaxSeconds: z.number().int().min(15).max(120),
  goals: z.array(z.enum(["teach", "inspire", "announce", "demonstrate", "story"])).min(1).max(5),
  formats: z.array(z.enum(["9:16", "1:1", "16:9"])).min(1).max(3),
  captions: z.boolean().default(true),
  idempotencyKey: z.string().trim().min(8).max(128).regex(/^[a-zA-Z0-9:_-]+$/),
}).strict().refine((value) => value.targetMaxSeconds > value.targetMinSeconds, {
  path: ["targetMaxSeconds"], message: "Maximum length must be greater than minimum length",
});

export const claimJobSchema = z.object({
  workerId: z.string().trim().min(3).max(120),
  jobTypes: z.array(z.string().trim().min(1).max(80)).min(1).max(20).optional(),
  leaseSeconds: z.number().int().min(30).max(900).default(300),
}).strict();

export const reportJobSchema = z.object({
  workerId: z.string().trim().min(3).max(120),
  status: z.enum(["processing", "completed", "failed"]),
  progress: z.number().int().min(0).max(100).optional(),
  result: z.record(z.string(), z.unknown()).optional(),
  errorMessage: z.string().trim().min(1).max(2000).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.status === "failed" && !value.errorMessage) {
    ctx.addIssue({ code: "custom", path: ["errorMessage"], message: "errorMessage is required" });
  }
});

export const probeResultSchema = z.object({
  durationSeconds: z.number().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  codec: z.string().max(80).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).strict();

export const transcriptionResultSchema = z.object({
  fullText: z.string().max(2_000_000),
  language: z.string().max(20).optional(),
  segments: z.array(transcriptSegmentSchema).max(100_000),
  derivedArtifacts: z.array(z.object({
    assetId: uuidSchema,
    kind: z.enum(["proxy", "poster", "waveform"]),
    bucket: z.literal("press-assets"),
    path: z.string().trim().min(1).max(1024),
    mimeType: z.enum(["video/mp4", "image/jpeg", "application/json"]),
    fileSize: z.number().int().positive().max(2 * 1024 * 1024 * 1024),
    checksum: z.string().regex(/^[0-9a-f]{64}$/),
  }).strict()).max(3).default([]),
}).strict();

export const scoredClipSchema = z.object({
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  title: z.string().trim().min(1).max(180),
  hook: z.string().trim().max(500).optional(),
  summary: z.string().trim().max(2000).optional(),
  score: z.number().min(0).max(100),
  scores: z.record(z.string(), z.number().min(0).max(100)),
}).strict().refine((value) => value.endMs > value.startMs, "endMs must be after startMs");
export const scoreClipsResultSchema = z.object({ clips: z.array(scoredClipSchema).max(100) }).strict();

export const renderResultSchema = z.object({
  outputBucket: z.literal("press-renders"),
  outputPath: z.string().trim().min(1).max(1024),
}).strict();

export const createPublicationSchema = z.object({
  renderId: uuidSchema,
  publishTargetId: uuidSchema.optional(),
  mode: z.enum(["manual_export", "scheduled"]),
  scheduledFor: z.string().datetime({ offset: true }).optional(),
  idempotencyKey: z.string().trim().min(8).max(128).regex(/^[a-zA-Z0-9:_-]+$/).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.mode === "scheduled" && !value.scheduledFor) {
    ctx.addIssue({ code: "custom", path: ["scheduledFor"], message: "scheduledFor is required" });
  }
  if (value.mode === "scheduled" && !value.publishTargetId) {
    ctx.addIssue({ code: "custom", path: ["publishTargetId"], message: "publishTargetId is required" });
  }
  if (value.mode === "manual_export" && value.publishTargetId) {
    ctx.addIssue({ code: "custom", path: ["publishTargetId"], message: "manual exports do not use a publish target" });
  }
  if (value.mode === "manual_export" && value.scheduledFor) {
    ctx.addIssue({ code: "custom", path: ["scheduledFor"], message: "manual exports cannot be scheduled" });
  }
  if (value.scheduledFor && new Date(value.scheduledFor).getTime() <= Date.now()) {
    ctx.addIssue({ code: "custom", path: ["scheduledFor"], message: "scheduledFor must be in the future" });
  }
});

export const analyticsPeriodSchema = z.coerce.number().int().min(1).max(365).default(30);
