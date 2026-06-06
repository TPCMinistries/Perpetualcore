import { describe, expect, it } from "vitest";
import {
  buildSubmissionManifestRows,
  SUBMISSION_MANIFEST_HEADER,
} from "@/lib/rfp/export/submission-manifest";
import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";

const complianceMatrix: ComplianceMatrixArtifact = {
  kind: "compliance_matrix_v1",
  overall_status: "fail",
  missing_count: 1,
  needs_review_count: 1,
  critical_count: 1,
  items: [
    {
      id: "REQ-01",
      category: "submission",
      requirement: "Submit through Grants.gov by 5 PM Eastern.",
      source: "uploaded_package",
      response_status: "needs_review",
      owner_section: "global",
      owner_label: "Submission lead",
      priority: "critical",
      source_excerpt: "Applications must be submitted through Grants.gov.",
      evidence: "Source excerpt: Applications must be submitted through Grants.gov.",
    },
  ],
};

const packetChecklist: PacketChecklistArtifact = {
  kind: "packet_checklist_v1",
  overall_status: "warn",
  due_date: "2026-07-10",
  submission_url: "https://www.grants.gov/example",
  deadline_timezone: "Eastern Time",
  submission_portal: "Grants.gov",
  submission_method: "Submit through Grants.gov.",
  forms: ["SF-424"],
  question_deadlines: ["Questions are due June 15, 2026."],
  items: [
    {
      id: "required-form-1",
      label: "Required form: SF-424",
      status: "needs_review",
      notes: "Confirm the latest form template is complete.",
    },
  ],
};

const task: SubmissionTaskRow = {
  id: "task-1",
  proposal_id: "proposal-1",
  source_type: "packet",
  source_id: "required-form-1",
  title: "Prepare Required form: SF-424",
  detail: "Confirm the latest form template is complete.",
  owner_label: "Operations",
  status: "open",
  priority: "critical",
  due_date: "2026-07-10",
  notes: "",
  evidence: "https://www.grants.gov/example",
  created_by: "user-1",
  resolved_at: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
};

describe("submission manifest export", () => {
  it("builds a closeout manifest with snapshot, packet, compliance, tasks, and sections", () => {
    const rows = buildSubmissionManifestRows({
      proposal: {
        title: "Youth Workforce Grant",
        status: "draft",
        due_date: "2026-07-10",
      },
      opportunity: {
        title: "Youth Workforce NOFO",
        agency: "Agency",
        url: "https://example.test/nofo",
      },
      bidNoBid: {
        kind: "bid_no_bid_v1",
        recommendation: "pursue",
        score: 82,
        drivers: [],
        risks: [],
        next_actions: [],
      },
      complianceMatrix,
      packetChecklist,
      tasks: [task],
      sections: [
        {
          section_type: "project_narrative",
          label: "Project Narrative",
          content: "This is a short drafted section.",
        },
      ],
    });

    expect(SUBMISSION_MANIFEST_HEADER).toContain("Evidence / source");
    expect(rows).toContainEqual(
      expect.arrayContaining([
        "Snapshot",
        "proposal",
        "Youth Workforce Grant",
        "draft",
      ]),
    );
    expect(rows).toContainEqual(
      expect.arrayContaining([
        "Submission Path",
        "submission",
        "Grants.gov",
        "warn",
      ]),
    );
    expect(rows).toContainEqual(
      expect.arrayContaining([
        "Compliance Matrix",
        "REQ-01",
        "Submit through Grants.gov by 5 PM Eastern.",
        "needs_review",
      ]),
    );
    expect(rows).toContainEqual(
      expect.arrayContaining([
        "Workroom Task",
        "required-form-1",
        "Prepare Required form: SF-424",
        "open",
      ]),
    );
    expect(rows).toContainEqual(
      expect.arrayContaining([
        "Draft Section",
        "project_narrative",
        "Project Narrative",
        "drafted",
      ]),
    );
  });
});
