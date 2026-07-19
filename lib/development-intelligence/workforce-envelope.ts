import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

const criteria = {
  answer_relevance: "Answer relevance",
  specific_evidence: "Specific evidence",
  role_and_action: "Role and action",
  outcome_reflection: "Outcome and reflection",
  professional_clarity: "Professional clarity",
} as const;

const observationSchema = z
  .object({
    criterionKey: z.enum(Object.keys(criteria) as [keyof typeof criteria, ...(keyof typeof criteria)[]]),
    criterionLabel: z.string().trim().min(1).max(120),
    evidenceLevel: z.enum(["demonstrated", "emerging", "not_observed"]),
    observation: z.string().trim().min(1).max(1_200),
    evidenceQuote: z.string().trim().min(1).max(240),
    speakerLabel: z.string().trim().min(1).max(80).nullable(),
    startMs: z.number().int().nonnegative().nullable(),
    endMs: z.number().int().nonnegative().nullable(),
    confidence: z.number().min(0).max(1),
    developmentalAction: z.string().trim().min(1).max(700),
  })
  .strict()
  .refine((value) => criteria[value.criterionKey] === value.criterionLabel, {
    message: "Criterion label does not match criterion key",
  })
  .refine(
    (value) => value.startMs === null || value.endMs === null || value.endMs >= value.startMs,
    { message: "End timestamp must not precede start timestamp" }
  );

export const workforceEnvelopeSchema = z
  .object({
    schemaVersion: z.literal("1"),
    eventId: z.string().uuid(),
    occurredAt: z.string().datetime(),
    sourceType: z.literal("workforce_envelope"),
    lens: z.literal("interview_coaching"),
    opaqueSubjectRef: z.string().regex(/^[a-f0-9]{64}$/),
    sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
    sessionTitle: z.string().trim().min(3).max(160),
    roleCategory: z.string().trim().min(1).max(80),
    interviewType: z.enum(["pre_screen", "phone_zoom", "in_person", "final"]),
    consent: z
      .object({
        status: z.literal("granted"),
        policyVersion: z.literal("workforce-hdi-v1"),
        verifiedAt: z.string().datetime(),
        scopes: z.tuple([
          z.literal("development_analysis"),
          z.literal("human_review"),
          z.literal("longitudinal_tracking"),
        ]),
      })
      .strict(),
    provenance: z
      .object({
        model: z.string().trim().min(1).max(120),
        rubricKey: z.literal("workforce-interview-coaching"),
        rubricVersion: z.literal(1),
        promptVersion: z.string().trim().min(1).max(120),
      })
      .strict(),
    summary: z.string().trim().min(1).max(2_000),
    strengths: z.array(z.string().trim().min(1).max(400)).max(8),
    growthAreas: z.array(z.string().trim().min(1).max(400)).max(8),
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
    observations: z.array(observationSchema).min(1).max(24),
    rawContentStored: z.literal(false),
  })
  .strict();

export type WorkforceEnvelope = z.infer<typeof workforceEnvelopeSchema>;

export function verifyWorkforceEnvelopeSignature(input: {
  rawBody: string;
  timestamp: string;
  eventId: string;
  signature: string;
}): boolean {
  const secret = process.env.HDI_WORKFORCE_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) return false;
  const suppliedHex = input.signature.startsWith("sha256=")
    ? input.signature.slice(7)
    : "";
  const expectedHex = createHmac("sha256", secret)
    .update(`${input.timestamp}.${input.eventId}.${input.rawBody}`)
    .digest("hex");
  const supplied = Buffer.from(suppliedHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function persistWorkforceEnvelope(
  envelope: WorkforceEnvelope
): Promise<string> {
  const organizationId = process.env.HDI_WORKFORCE_CORE_ORGANIZATION_ID;
  const actorId = process.env.HDI_WORKFORCE_CORE_ACTOR_ID;
  if (!organizationId || !actorId) {
    throw new Error("HDI workforce receiver identity is not configured");
  }
  const { data, error } = await createAdminClient().rpc(
    "hdi_ingest_workforce_envelope",
    {
      p_organization_id: organizationId,
      p_actor_id: actorId,
      p_envelope: envelope,
    }
  );
  if (error || typeof data !== "string") {
    throw new Error(`Unable to persist workforce envelope: ${error?.message || "unknown error"}`);
  }
  return data;
}
