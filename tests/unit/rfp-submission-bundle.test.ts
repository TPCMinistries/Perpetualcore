import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import type {
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { SubmitReadinessGate } from "@/lib/rfp/submission/readiness-gate";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";
import { buildSubmissionBundleZip } from "@/lib/rfp/export/submission-bundle";
import type { RfpAuditTrailRow } from "@/lib/rfp/export/audit-trail-csv";

const complianceMatrix: ComplianceMatrixArtifact = {
  kind: "compliance_matrix_v1",
  overall_status: "pass",
  missing_count: 0,
  needs_review_count: 0,
  critical_count: 0,
  items: [
    {
      id: "REQ-01",
      category: "submission",
      requirement: "Submit through Grants.gov.",
      source: "uploaded_package",
      response_status: "met",
      owner_section: "global",
      owner_label: "Submission lead",
      priority: "critical",
      source_excerpt: "Applications must be submitted through Grants.gov.",
      evidence: "Draft includes submission portal language.",
    },
  ],
};

const packetChecklist: PacketChecklistArtifact = {
  kind: "packet_checklist_v1",
  overall_status: "pass",
  due_date: "2026-07-10",
  submission_url: "https://www.grants.gov/example",
  deadline_timezone: "Eastern Time",
  submission_portal: "Grants.gov",
  submission_method: "Submit through Grants.gov.",
  forms: ["SF-424"],
  question_deadlines: ["Questions due June 15, 2026."],
  items: [
    {
      id: "required-form-1",
      label: "Required form: SF-424",
      status: "met",
      notes: "Ready for upload.",
    },
  ],
};

const task: SubmissionTaskRow = {
  id: "task-1",
  proposal_id: "proposal-1",
  source_type: "packet",
  source_id: "required-form-1",
  title: "Prepare Required form: SF-424",
  detail: "Ready for upload.",
  owner_label: "Operations",
  status: "resolved",
  priority: "critical",
  due_date: "2026-07-10",
  notes: "",
  evidence: "https://www.grants.gov/example",
  created_by: "user-1",
  resolved_at: "2026-06-02T00:00:00.000Z",
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-02T00:00:00.000Z",
};

const readinessGate: SubmitReadinessGate = {
  status: "ready",
  score: 100,
  label: "Ready to submit",
  summary: "All deterministic submission gates are clear.",
  nextAction: "Export DOCX, compliance CSV, packet CSV, and submission manifest.",
  blockers: [],
  reviews: [],
  completed: [
    {
      key: "packet",
      label: "Packet checklist",
      severity: "complete",
      detail: "0 missing, 0 needs review.",
      owner: "Operations",
    },
  ],
  metrics: {
    blockers: 0,
    reviews: 0,
    completed: 7,
    openTasks: 0,
    criticalTasks: 0,
    missingCompliance: 0,
    missingPacketItems: 0,
    reviewerBlockers: 0,
  },
};

const auditRow: RfpAuditTrailRow = {
  created_at: "2026-06-01T00:00:00.000Z",
  agent: "drafter_v1",
  model: "claude-opus-4",
  session_id: "draft_test",
  tokens_in: 100,
  tokens_out: 200,
  cost_usd: 0.05,
  proposal_id: "proposal-1",
  org_id: "org-1",
};

describe("submission bundle zip export", () => {
  it("builds a downloadable ZIP with proposal, manifest, packet, readiness, and audit files", async () => {
    const buffer = await buildSubmissionBundleZip({
      proposal: {
        id: "proposal-1",
        org_id: "org-1",
        title: "Youth Workforce Grant",
        status: "draft",
        due_date: "2026-07-10",
        opp_id: "opp-1",
        created_at: "2026-06-01T00:00:00.000Z",
      },
      org: { name: "Institute for Human Advancement" },
      opportunity: {
        title: "Youth Workforce NOFO",
        agency: "Agency",
        brief: "Funding for workforce programming.",
        amount_min: null,
        amount_max: 500000,
        deadline: "2026-07-10",
        url: "https://example.test/nofo",
      },
      sections: [
        {
          section_type: "project_narrative",
          content: "This is a drafted project narrative.",
        },
      ],
      checks: [
        {
          check_type: "compliance_matrix_v1",
          details_json: complianceMatrix,
        },
      ],
      bidNoBid: {
        kind: "bid_no_bid_v1",
        recommendation: "pursue",
        score: 90,
        drivers: [],
        risks: [],
        next_actions: [],
      },
      complianceMatrix,
      packetChecklist,
      tasks: [task],
      auditRows: [auditRow],
      readiness: {
        generatedAt: "2026-06-03T00:00:00.000Z",
        gate: readinessGate,
      },
      generatedAt: "2026-06-04T00:00:00.000Z",
    });

    const zip = await JSZip.loadAsync(buffer);
    expect(Object.keys(zip.files).sort()).toEqual([
      "01-proposal-draft.docx",
      "02-submission-manifest.csv",
      "03-compliance-matrix.csv",
      "04-submission-packet.csv",
      "05-submit-readiness.json",
      "06-audit-trail.csv",
      "README.txt",
    ]);

    const readme = await zip.file("README.txt")?.async("string");
    expect(readme).toContain("Youth Workforce Grant");
    expect(readme).toContain("Ready to submit");

    const manifest = await zip.file("02-submission-manifest.csv")?.async("string");
    expect(manifest).toContain("Submission Path");
    expect(manifest).toContain("Grants.gov");

    const readiness = JSON.parse(
      (await zip.file("05-submit-readiness.json")?.async("string")) ?? "{}",
    ) as { can_submit?: boolean; gate?: { score?: number } };
    expect(readiness.can_submit).toBe(true);
    expect(readiness.gate?.score).toBe(100);

    const audit = await zip.file("06-audit-trail.csv")?.async("string");
    expect(audit).toContain("drafter_v1");
    expect(audit).toContain("claude-opus-4");
  });

  it("includes clear missing-artifact notes when readiness exports have not been generated", async () => {
    const buffer = await buildSubmissionBundleZip({
      proposal: {
        id: "proposal-1",
        org_id: "org-1",
        title: "Early Draft",
        status: "draft",
        due_date: null,
        opp_id: null,
        created_at: "2026-06-01T00:00:00.000Z",
      },
      org: null,
      opportunity: null,
      sections: [],
      checks: [],
      bidNoBid: null,
      complianceMatrix: null,
      packetChecklist: null,
      tasks: [],
      auditRows: [],
      readiness: {
        generatedAt: "2026-06-03T00:00:00.000Z",
        gate: { ...readinessGate, status: "not_run", score: 0, label: "Readiness not complete" },
      },
      generatedAt: "2026-06-04T00:00:00.000Z",
    });

    const zip = await JSZip.loadAsync(buffer);
    expect(zip.file("03-compliance-matrix-missing.txt")).toBeTruthy();
    expect(zip.file("04-submission-packet-missing.txt")).toBeTruthy();
    expect(await zip.file("03-compliance-matrix-missing.txt")?.async("string")).toContain(
      "Compliance matrix has not been generated yet.",
    );
  });
});
