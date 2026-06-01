import { describe, expect, it } from "vitest";
import { generateCaptureReadiness } from "@/lib/rfp/compliance/generate";
import type { PackageExtraction } from "@/lib/rfp/package/extract";

const packageExtraction: PackageExtraction = {
  kind: "package_requirements_v1",
  title: "NOFO package",
  source_type: "paste",
  source_url: null,
  extracted_at: "2026-06-01T00:00:00.000Z",
  requirements: [
    {
      id: "PKG-REQ-01",
      category: "eligibility",
      requirement: "Applicant must provide proof of 501(c)(3) nonprofit status.",
      source_excerpt: "Applicant must provide proof of 501(c)(3) nonprofit status.",
    },
    {
      id: "PKG-REQ-02",
      category: "budget",
      requirement: "Budget narrative must include matching funds and indirect cost rate.",
      source_excerpt: "Budget narrative must include matching funds and indirect cost rate.",
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
    expect(result.packet_checklist.items).toContainEqual(
      expect.objectContaining({
        id: "rfp-package-imported",
        status: "met",
      }),
    );
  });
});
