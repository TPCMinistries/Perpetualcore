import { z } from "zod";

export const subjectTypeSchema = z.enum([
  "adult_employee",
  "adult_candidate",
  "adult_participant",
  "leader",
]);

export const subjectStatusSchema = z.enum(["active", "archived"]);

export const subjectListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(30),
    status: subjectStatusSchema.optional(),
  })
  .strict();

export const createSubjectSchema = z
  .object({
    displayLabel: z.string().trim().min(1).max(80),
    subjectType: subjectTypeSchema,
    opaqueExternalRef: z.string().trim().min(1).max(160).optional(),
    consentConfirmed: z.literal(true),
    consentBasis: z
      .enum(["participant_attestation", "written_authorization"])
      .default("participant_attestation"),
  })
  .strict();

export const updateSubjectSchema = z
  .object({
    displayLabel: z.string().trim().min(1).max(80).optional(),
    status: subjectStatusSchema.optional(),
  })
  .strict()
  .refine((value) => value.displayLabel !== undefined || value.status !== undefined, {
    message: "At least one subject change is required",
  });

export const linkSubjectSessionSchema = z
  .object({
    sessionId: z.string().uuid(),
    participantLabel: z.string().trim().min(1).max(80),
    role: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const withdrawLongitudinalConsentSchema = z
  .object({
    confirmation: z.literal(true),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const commitmentStatusSchema = z.enum([
  "open",
  "completed",
  "changed",
  "cancelled",
  "unverified",
]);

export const updateCommitmentSchema = z
  .object({
    status: commitmentStatusSchema,
    note: z.string().trim().min(1).max(1_000).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      ["changed", "cancelled", "unverified"].includes(value.status) &&
      !value.note
    ) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "A note is required for this commitment status",
      });
    }
  });

export const developmentResourceIdSchema = z.string().uuid();

export type SubjectListQuery = z.infer<typeof subjectListQuerySchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type LinkSubjectSessionInput = z.infer<typeof linkSubjectSessionSchema>;
export type WithdrawLongitudinalConsentInput = z.infer<
  typeof withdrawLongitudinalConsentSchema
>;
export type UpdateCommitmentInput = z.infer<typeof updateCommitmentSchema>;
