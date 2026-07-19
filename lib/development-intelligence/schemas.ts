import { z } from "zod";

export const developmentLensSchema = z.enum([
  "enterprise_meeting",
  "interview_coaching",
  "interviewer_quality",
  "leadership_coaching",
]);

export const evidenceLevelSchema = z.enum([
  "demonstrated",
  "emerging",
  "not_observed",
]);

export const analysisRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    lens: developmentLensSchema,
    transcript: z.string().trim().min(80).max(120_000),
    occurredAt: z.string().datetime().optional(),
    sourceType: z.literal("transcript_paste"),
    consentConfirmed: z.literal(true),
    participantLabels: z
      .array(z.string().trim().min(1).max(80))
      .max(25)
      .default([]),
  })
  .strict();

const mediaTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "video/mp4",
  "video/webm",
] as const;

export const mediaIngestionRequestSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    lens: developmentLensSchema,
    occurredAt: z.string().datetime().optional(),
    consentConfirmed: z.literal(true),
    participantLabels: z
      .array(z.string().trim().min(1).max(80))
      .max(25)
      .default([]),
    fileName: z.string().trim().min(1).max(255),
    fileSize: z.number().int().min(1).max(25 * 1024 * 1024),
    contentType: z.enum(mediaTypes),
  })
  .strict();

export const mediaProcessRequestSchema = z
  .object({
    ingestionId: z.string().uuid(),
  })
  .strict();

export const timedTranscriptSegmentSchema = z
  .object({
    speakerLabel: z.string().trim().min(1).max(80),
    startMs: z.number().int().nonnegative(),
    endMs: z.number().int().nonnegative(),
    text: z.string().trim().min(1),
  })
  .strict()
  .refine((value) => value.endMs >= value.startMs, {
    message: "endMs must be greater than or equal to startMs",
  });

export const evidenceObservationSchema = z
  .object({
    criterionKey: z.string().trim().min(1).max(80),
    criterionLabel: z.string().trim().min(1).max(120),
    evidenceLevel: evidenceLevelSchema,
    observation: z.string().trim().min(1).max(1_200),
    evidenceQuote: z.string().trim().min(1).max(240),
    speakerLabel: z.string().trim().min(1).max(80).nullable(),
    startMs: z.number().int().nonnegative().nullable(),
    endMs: z.number().int().nonnegative().nullable(),
    confidence: z.number().min(0).max(1),
    developmentalAction: z.string().trim().min(1).max(700),
  })
  .strict()
  .refine(
    (value) =>
      value.startMs === null ||
      value.endMs === null ||
      value.endMs >= value.startMs,
    { message: "endMs must be greater than or equal to startMs" }
  );

export const commitmentSchema = z
  .object({
    statement: z.string().trim().min(1).max(700),
    ownerLabel: z.string().trim().min(1).max(80).nullable(),
    dueDate: z.string().date().nullable(),
    evidenceQuote: z.string().trim().min(1).max(240),
  })
  .strict();

export const developmentAnalysisOutputSchema = z
  .object({
    summary: z.string().trim().min(1).max(2_000),
    strengths: z.array(z.string().trim().min(1).max(400)).max(8),
    growthAreas: z.array(z.string().trim().min(1).max(400)).max(8),
    observations: z.array(evidenceObservationSchema).min(1).max(24),
    commitments: z.array(commitmentSchema).max(20),
    limitations: z.array(z.string().trim().min(1).max(500)).min(1).max(8),
    safetyFlags: z
      .array(
        z.enum([
          "insufficient_evidence",
          "possible_protected_trait_content",
          "possible_health_or_disability_content",
          "possible_minor_content",
          "consent_scope_unclear",
        ])
      )
      .max(5),
  })
  .strict();

export const analysisListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(30),
    lens: developmentLensSchema.optional(),
    reviewStatus: z
      .enum(["pending", "approved", "needs_revision", "rejected"])
      .optional(),
  })
  .strict();

export const humanReviewSchema = z
  .object({
    status: z.enum(["approved", "needs_revision", "rejected"]),
    note: z.string().trim().max(2_000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.status !== "approved" &&
      (!value.note || value.note.trim().length === 0)
    ) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "A review note is required for revision or rejection",
      });
    }
  });

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type MediaIngestionRequest = z.infer<typeof mediaIngestionRequestSchema>;
export type TimedTranscriptSegment = z.infer<typeof timedTranscriptSegmentSchema>;
export type DevelopmentAnalysisInput = Omit<AnalysisRequest, "sourceType"> & {
  sourceType: "transcript_paste" | "media_upload";
  timedSegments?: TimedTranscriptSegment[];
};
export type DevelopmentAnalysisOutput = z.infer<
  typeof developmentAnalysisOutputSchema
>;
export type DevelopmentLens = z.infer<typeof developmentLensSchema>;
