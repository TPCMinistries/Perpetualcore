import { z } from "zod";

export const agentSpecialistSchema = z.enum([
  "evidence_grounding",
  "decisions_commitments",
  "development_coaching",
  "interaction_dynamics",
  "safety_challenge",
]);

export const specialistKeySchema = agentSpecialistSchema;

export const agentIntendedUseSchema = z.enum([
  "development_coaching",
  "meeting_effectiveness",
  "interview_quality",
  "leadership_development",
  "enterprise_learning",
  "custom",
]);

export const prohibitedActionSchema = z.enum([
  "automated_hiring_decision",
  "automated_employment_action",
  "deception_or_integrity_scoring",
  "emotion_or_mental_state_inference",
  "protected_trait_inference",
  "diagnosis_or_disability_inference",
  "accent_or_cultural_fit_scoring",
  "autonomous_external_action",
]);

export const agentContextSchema = z
  .object({
    conversationType: z.string().trim().min(2).max(120).optional(),
    audience: z.string().trim().min(2).max(160).optional(),
    intendedUse: agentIntendedUseSchema.optional(),
    sourceMode: z
      .enum(["transcript", "recording", "approved_aggregate"])
      .optional(),
    notes: z.string().trim().max(1_000).optional(),
  })
  .strict();

export const agenticPlanRequestSchema = z
  .object({
    goal: z.string().trim().min(10).max(1_500),
    context: agentContextSchema.default({}),
    preferredSpecialists: z.array(agentSpecialistSchema).max(5).default([]),
    requestedExclusions: z
      .array(z.string().trim().min(2).max(240))
      .max(12)
      .default([]),
    playbookId: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const required = new Set([
      ...value.preferredSpecialists,
      "evidence_grounding",
      "safety_challenge",
    ]);
    if (required.size > 5) {
      context.addIssue({
        code: "custom",
        path: ["preferredSpecialists"],
        message: "Preferred specialists leave no room for required safety agents",
      });
    }
  });

export const agenticRubricCriterionSchema = z
  .object({
    key: z
      .string()
      .trim()
      .min(2)
      .max(64)
      .regex(/^[a-z][a-z0-9_]*$/),
    label: z.string().trim().min(2).max(120),
    question: z.string().trim().min(8).max(300),
    evidenceRequirement: z.string().trim().min(8).max(400),
    weight: z.number().int().min(1).max(5),
  })
  .strict();

export const agenticPlanSchema = z
  .object({
    planTitle: z.string().trim().min(3).max(120),
    objective: z.string().trim().min(10).max(800),
    intendedUse: agentIntendedUseSchema,
    recommendedSpecialists: z
      .array(agentSpecialistSchema)
      .min(2)
      .max(5)
      .refine((items) => new Set(items).size === items.length, {
        message: "Specialists must be unique",
      }),
    rubric: z.array(agenticRubricCriterionSchema).min(3).max(10),
    evidenceRequirements: z
      .array(z.string().trim().min(8).max(400))
      .min(2)
      .max(12),
    exclusions: z.array(z.string().trim().min(4).max(300)).min(1).max(12),
    limitations: z.array(z.string().trim().min(4).max(400)).min(1).max(8),
    humanReview: z
      .object({
        required: z.literal(true),
        reviewerFocus: z
          .array(z.string().trim().min(4).max(240))
          .min(1)
          .max(8),
      })
      .strict(),
    prohibitedActions: z
      .array(prohibitedActionSchema)
      .length(8)
      .refine((items) => new Set(items).size === items.length, {
        message: "Prohibited actions must be unique",
      }),
  })
  .strict();

export const playbookStatusSchema = z.enum(["draft", "active", "archived"]);

export const createPlaybookSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    description: z.string().trim().min(8).max(800),
    goalTemplate: z.string().trim().min(10).max(1_500),
    plan: agenticPlanSchema,
  })
  .strict();

export const versionPlaybookSchema = createPlaybookSchema.partial().strict();

export const playbookListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    status: playbookStatusSchema.optional(),
  })
  .strict();

export const agentRunStatusSchema = z.enum([
  "planned",
  "running",
  "review_ready",
  "failed",
]);

export const agentRunReviewStatusSchema = z.enum([
  "pending",
  "approved",
  "needs_revision",
  "rejected",
]);

export const agenticAnalyzeRequestSchema = z
  .object({
    goal: z.string().trim().min(10).max(1_500),
    context: agentContextSchema.optional(),
    transcript: z.string().trim().min(80).max(120_000),
    participantLabels: z
      .array(z.string().trim().min(1).max(80))
      .max(25)
      .default([]),
    consentConfirmed: z.literal(true),
    plan: agenticPlanSchema.optional(),
    playbookId: z.string().uuid().optional(),
    runId: z.string().uuid().optional(),
  })
  .strict()
  .refine((value) => value.plan || value.playbookId || value.runId, {
    message: "A plan, playbookId, or runId is required",
  });

export type AgenticPlanRequest = z.infer<typeof agenticPlanRequestSchema>;
export type AgenticPlan = z.infer<typeof agenticPlanSchema>;
export type AgentSpecialist = z.infer<typeof agentSpecialistSchema>;
export type SpecialistKey = AgentSpecialist;
export type AgenticAnalyzeRequest = z.infer<typeof agenticAnalyzeRequestSchema>;
export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>;
export type VersionPlaybookInput = z.infer<typeof versionPlaybookSchema>;
export type PlaybookListQuery = z.infer<typeof playbookListQuerySchema>;
export type PlaybookStatus = z.infer<typeof playbookStatusSchema>;

export interface AgentPlaybookRecord {
  id: string;
  playbookKey: string;
  version: number;
  name: string;
  description: string;
  goalTemplate: string;
  status: PlaybookStatus;
  plan: AgenticPlan;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRunRecord {
  id: string;
  playbookId: string | null;
  goal: string;
  context: AgenticPlanRequest["context"];
  plan: AgenticPlan;
  status: z.infer<typeof agentRunStatusSchema>;
  humanReviewStatus: z.infer<typeof agentRunReviewStatusSchema>;
  model: string;
  promptVersion: string;
  schemaVersion: string;
  createdAt: string;
  updatedAt: string;
}
