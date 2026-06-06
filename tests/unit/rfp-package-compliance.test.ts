import { describe, expect, it } from "vitest";
import { generateCaptureReadiness } from "@/lib/rfp/compliance/generate";
import {
  extractPackageRequirements,
  type PackageExtraction,
} from "@/lib/rfp/package/extract";
import { buildSubmissionTasks } from "@/lib/rfp/submission/tasks";

const packageExtraction: PackageExtraction = {
  kind: "package_requirements_v1",
  title: "NOFO package",
  source_type: "paste",
  source_url: null,
  extracted_at: "2026-06-01T00:00:00.000Z",
  extracted_chars: 2500,
  deadline_timezone: "Eastern Time",
  submission_method: "Applications must be submitted through Grants.gov by 5:00 PM Eastern Time.",
  submission_portal: "Grants.gov",
  submission_url: "https://www.grants.gov/example",
  forms: ["SF-424", "Budget justification"],
  attachments: [],
  matching_funds: ["Applicants must provide a 10% non-federal match."],
  award_limits: ["Awards may not exceed $500,000."],
  question_deadlines: ["Questions are due June 15, 2026 at 5:00 PM Eastern Time."],
  requirements: [
    {
      id: "PKG-REQ-01",
      category: "eligibility",
      requirement: "Applicant must provide proof of 501(c)(3) nonprofit status.",
      source_excerpt: "Applicant must provide proof of 501(c)(3) nonprofit status.",
      priority: "critical",
      owner_hint: "Proposal lead",
      phase: "eligibility",
    },
    {
      id: "PKG-REQ-02",
      category: "budget",
      requirement: "Budget narrative must include matching funds and indirect cost rate.",
      source_excerpt: "Budget narrative must include matching funds and indirect cost rate.",
      priority: "high",
      owner_hint: "Finance / Operations",
      phase: "budget",
    },
  ],
  required_documents: ["IRS determination letter", "Audited financial statements"],
  page_limits: [],
  budget_rules: [],
  scoring_criteria: [],
  deadlines: [],
  submission_instructions: [],
  eligibility: [],
  contacts: [],
  risks: [],
  quality_score: 70,
};

describe("package-aware capture readiness", () => {
  it("extracts operational submission intelligence from package text", () => {
    const extraction = extractPackageRequirements({
      title: "Youth workforce NOFO",
      sourceType: "paste",
      sourceUrl: "https://example.test/nofo",
      text: `
        Eligible applicants must be 501(c)(3) nonprofit organizations.
        Applications must be submitted through Grants.gov by July 10, 2026 at 5:00 PM Eastern Time.
        Questions are due June 15, 2026 at 5:00 PM Eastern Time.
        Applicants shall include SF-424, SF-424A, a budget justification, letters of support, and proof of nonprofit status.
        The project narrative may not exceed 20 pages using one-inch margins.
        Applicants must provide a 10% non-federal match. Awards may not exceed $500,000.
      `,
    });

    expect(extraction.submission_portal).toBe("Grants.gov");
    expect(extraction.deadline_timezone).toContain("Eastern");
    expect(extraction.forms).toEqual(expect.arrayContaining(["SF-424", "SF-424A budget information"]));
    expect(extraction.question_deadlines?.length ?? 0).toBeGreaterThan(0);
    expect(extraction.requirements[0]).toEqual(
      expect.objectContaining({
        source_excerpt: expect.any(String),
        owner_hint: expect.any(String),
        phase: expect.any(String),
      }),
    );
  });

  it("prioritizes uploaded package requirements in the compliance matrix", () => {
    const result = generateCaptureReadiness({
      proposal: {
        id: "proposal-1",
        title: "Draft",
        due_date: null,
        vault_chunks_used: [],
      },
      opportunity: {
        title: "Short listing",
        agency: "Agency",
        brief: "Brief listing with limited detail.",
        deadline: null,
        url: "https://example.test/nofo",
      },
      match: null,
      sections: [
        {
          section_type: "organizational_capacity",
          content: "The applicant is a nonprofit with verified 501(c)(3) status.",
        },
        {
          section_type: "budget_narrative",
          content: "",
        },
      ],
      packageExtractions: [packageExtraction],
    });

    const sources = result.compliance_matrix.items.map((item) => item.source);
    expect(sources.slice(0, 4)).toEqual([
      "uploaded_package",
      "uploaded_package",
      "uploaded_package_document",
      "uploaded_package_document",
    ]);
    expect(result.compliance_matrix.items[0].requirement).toContain("501(c)(3)");
    expect(result.compliance_matrix.items[0]).toEqual(
      expect.objectContaining({
        priority: "critical",
        owner_label: "Proposal lead",
        source_excerpt: "Applicant must provide proof of 501(c)(3) nonprofit status.",
      }),
    );
    expect(result.compliance_matrix.submission_summary).toEqual(
      expect.objectContaining({
        submission_portal: "Grants.gov",
        forms: expect.arrayContaining(["SF-424"]),
      }),
    );
    expect(result.packet_checklist.items).toContainEqual(
      expect.objectContaining({
        id: "rfp-package-imported",
        status: "met",
      }),
    );
    expect(result.packet_checklist.items).toContainEqual(
      expect.objectContaining({
        id: "submission-method",
        status: "needs_review",
      }),
    );
  });

  it("turns package submission details into owner-specific tasks", () => {
    const tasks = buildSubmissionTasks({
      proposalId: "proposal-1",
      dueDate: "2026-07-10",
      userId: "user-1",
      sections: [],
      checks: [
        {
          check_type: "package_requirements_v1",
          details_json: packageExtraction,
        },
      ],
    });

    expect(tasks).toContainEqual(
      expect.objectContaining({
        source_id: "package-submission-method",
        owner_label: "Submission lead",
        priority: "critical",
      }),
    );
    expect(tasks).toContainEqual(
      expect.objectContaining({
        source_id: expect.stringMatching(/^package-form:/),
        owner_label: expect.stringMatching(/Operations/),
      }),
    );
  });
});
