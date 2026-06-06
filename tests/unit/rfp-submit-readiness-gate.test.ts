import { describe, expect, it } from "vitest";
import { buildSubmitReadinessGate } from "@/lib/rfp/submission/readiness-gate";
import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { ReviewerResult } from "@/lib/rfp/review/rubric";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

const complianceMatrix: ComplianceMatrixArtifact = {
  kind: "compliance_matrix_v1",
  overall_status: "pass",
  missing_count: 0,
  needs_review_count: 0,
  critical_count: 0,
  items: [],
};

const packetChecklist: PacketChecklistArtifact = {
  kind: "packet_checklist_v1",
  overall_status: "pass",
  due_date: "2026-07-10",
  submission_url: "https://www.grants.gov/example",
  deadline_timezone: "Eastern Time",
  submission_method: "Submit through Grants.gov.",
  submission_portal: "Grants.gov",
  forms: ["SF-424"],
  question_deadlines: [],
  items: [
    {
      id: "source-link",
      label: "Source posting available",
      status: "met",
      notes: "Source URL is available.",
    },
  ],
};

const reviewerResult: ReviewerResult = {
  overall_score: 88,
  summary: "Strong draft.",
  findings: [],
  tokens_in: 100,
  tokens_out: 50,
  cost_usd: 0.001,
  model: "test-model",
  session_id: "review-test",
};

function task(overrides: Partial<SubmissionTaskRow>): SubmissionTaskRow {
  return {
    id: "task-1",
    proposal_id: "proposal-1",
    source_type: "manual",
    source_id: "manual-1",
    title: "Confirm portal",
    detail: "Confirm account access.",
    owner_label: "Submission lead",
    status: "open",
    priority: "critical",
    due_date: "2026-07-10",
    notes: "",
    evidence: "",
    created_by: "user-1",
    resolved_at: null,
    created_at: "2026-06-01T00:00:00.000Z",
    updated_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("submit readiness gate", () => {
  it("marks a proposal ready only when final blockers are clear", () => {
    const gate = buildSubmitReadinessGate({
      sectionCount: 5,
      verifyMarkerCount: 0,
      complianceMatrix,
      packetChecklist,
      reviewerResult,
      tasks: [],
    });

    expect(gate.status).toBe("ready");
    expect(gate.score).toBe(100);
    expect(gate.blockers).toHaveLength(0);
    expect(gate.reviews).toHaveLength(0);
  });

  it("blocks when required artifacts have not been generated", () => {
    const gate = buildSubmitReadinessGate({
      sectionCount: 5,
      verifyMarkerCount: 0,
      complianceMatrix: null,
      packetChecklist: null,
      reviewerResult: null,
      tasks: [],
    });

    expect(gate.status).toBe("not_run");
    expect(gate.blockers.map((item) => item.key)).toEqual(
      expect.arrayContaining(["compliance", "reviewer", "packet", "submission_path"]),
    );
  });

  it("blocks on open critical workroom tasks", () => {
    const gate = buildSubmitReadinessGate({
      sectionCount: 5,
      verifyMarkerCount: 0,
      complianceMatrix,
      packetChecklist,
      reviewerResult,
      tasks: [task({ status: "open", priority: "critical" })],
    });

    expect(gate.status).toBe("not_ready");
    expect(gate.metrics.criticalTasks).toBe(1);
    expect(gate.blockers).toContainEqual(
      expect.objectContaining({
        key: "tasks",
        owner: "Submission lead",
      }),
    );
  });

  it("requires a submission path even when the packet checklist exists", () => {
    const gate = buildSubmitReadinessGate({
      sectionCount: 5,
      verifyMarkerCount: 0,
      complianceMatrix,
      packetChecklist: {
        ...packetChecklist,
        submission_url: null,
        submission_method: null,
        submission_portal: null,
      },
      reviewerResult,
      tasks: [],
    });

    expect(gate.status).toBe("not_ready");
    expect(gate.blockers).toContainEqual(
      expect.objectContaining({
        key: "submission_path",
      }),
    );
  });
});
