import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  createSubjectSchema,
  linkSubjectSessionSchema,
  updateCommitmentSchema,
  updateSubjectSchema,
  withdrawLongitudinalConsentSchema,
} from "@/lib/development-intelligence/profile-schemas";

describe("Development Intelligence governed profile contracts", () => {
  it("requires human approval before evidence enters a longitudinal profile", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260722_hdi_profile_operations.sql"
      ),
      "utf8"
    );
    expect(migration).toContain("human_review_status = 'approved'");
    expect(migration).toContain(
      "HDI approved analysis is required before profile linking"
    );
  });

  it("requires explicit longitudinal consent for a new adult profile", () => {
    const base = {
      displayLabel: "Participant A",
      subjectType: "adult_participant",
      consentBasis: "participant_attestation",
    };

    expect(createSubjectSchema.safeParse({ ...base, consentConfirmed: true }).success).toBe(
      true
    );
    expect(createSubjectSchema.safeParse({ ...base, consentConfirmed: false }).success).toBe(
      false
    );
    expect(
      createSubjectSchema.safeParse({
        ...base,
        consentConfirmed: true,
        subjectType: "minor",
      }).success
    ).toBe(false);
  });

  it("accepts only the two auditable consent bases", () => {
    const base = {
      displayLabel: "Candidate 27",
      subjectType: "adult_candidate",
      consentConfirmed: true,
    };
    expect(
      createSubjectSchema.safeParse({
        ...base,
        consentBasis: "written_authorization",
      }).success
    ).toBe(true);
    expect(
      createSubjectSchema.safeParse({
        ...base,
        consentBasis: "manager_assumption",
      }).success
    ).toBe(false);
  });

  it("requires an exact session and participant label to link observations", () => {
    expect(
      linkSubjectSessionSchema.safeParse({
        sessionId: "5ac41477-f879-42de-985b-3338c8060289",
        participantLabel: "Speaker A",
      }).success
    ).toBe(true);
    expect(
      linkSubjectSessionSchema.safeParse({
        sessionId: "not-a-session",
        participantLabel: "Speaker A",
      }).success
    ).toBe(false);
    expect(
      linkSubjectSessionSchema.safeParse({
        sessionId: "5ac41477-f879-42de-985b-3338c8060289",
        participantLabel: "",
      }).success
    ).toBe(false);
  });

  it("requires explicit confirmation to withdraw consent", () => {
    expect(
      withdrawLongitudinalConsentSchema.safeParse({ confirmation: true }).success
    ).toBe(true);
    expect(
      withdrawLongitudinalConsentSchema.safeParse({ confirmation: false }).success
    ).toBe(false);
  });

  it("requires a note when a commitment changes, is cancelled, or is unverified", () => {
    for (const status of ["changed", "cancelled", "unverified"] as const) {
      expect(updateCommitmentSchema.safeParse({ status }).success).toBe(false);
      expect(
        updateCommitmentSchema.safeParse({ status, note: "Confirmed during review." })
          .success
      ).toBe(true);
    }
    expect(updateCommitmentSchema.safeParse({ status: "completed" }).success).toBe(
      true
    );
  });

  it("rejects empty profile patches and unexpected inference fields", () => {
    expect(updateSubjectSchema.safeParse({}).success).toBe(false);
    expect(
      updateSubjectSchema.safeParse({
        displayLabel: "Participant B",
        integrityScore: 92,
      }).success
    ).toBe(false);
  });
});
