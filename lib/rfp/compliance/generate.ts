import { SECTION_SPECS } from "@/lib/rfp/draft/sections";
import type {
  BidNoBidArtifact,
  CaptureReadinessResult,
  CaptureRecommendation,
  CaptureStatus,
  ComplianceMatrixArtifact,
  ComplianceMatrixItem,
  PacketChecklistItem,
  PacketChecklistArtifact,
  RequirementCategory,
  RequirementStatus,
} from "./types";
import type { PackageExtraction } from "@/lib/rfp/package/extract";

interface ProposalInput {
  id: string;
  title: string;
  due_date: string | null;
  vault_chunks_used?: unknown;
  ai_disclosure_acknowledged?: boolean;
}

interface OpportunityInput {
  title: string;
  agency: string | null;
  brief: string | null;
  deadline: string | null;
  url: string | null;
  raw_json?: unknown;
}

interface MatchInput {
  fit_score: number | null;
  recommendation: string | null;
  chips: string[] | null;
  summary: string | null;
}

interface SectionInput {
  section_type: string;
  content: string | null;
}

interface RequirementRecord {
  requirement: string;
  source: string;
  priority: "critical" | "high" | "medium" | "low";
  source_excerpt?: string;
  owner_label?: string;
  phase?: string;
  category?: RequirementCategory;
}

export interface CaptureReadinessInput {
  proposal: ProposalInput;
  opportunity: OpportunityInput | null;
  match: MatchInput | null;
  sections: SectionInput[];
  packageExtractions?: PackageExtraction[];
}

const REQUIREMENT_WORDS = [
  "must",
  "required",
  "requirement",
  "shall",
  "submit",
  "include",
  "attachment",
  "deadline",
  "eligible",
  "eligibility",
  "budget",
  "evaluation",
  "page",
  "format",
  "certification",
  "insurance",
  "letter",
];

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "will",
  "must",
  "shall",
  "submit",
  "include",
  "required",
  "requirement",
  "proposal",
  "application",
  "program",
]);

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function sentenceSplit(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(cleanText)
    .filter((s) => s.length >= 24);
}

function rawJsonText(value: unknown, depth = 0): string[] {
  if (depth > 3 || value === null || value === undefined) return [];
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "boolean") return [];
  if (Array.isArray(value)) return value.flatMap((v) => rawJsonText(v, depth + 1));
  if (typeof value === "object") {
    const out: string[] = [];
    for (const [key, v] of Object.entries(value)) {
      if (
        /description|summary|requirement|eligib|attachment|instruction|deadline|budget|criteria|evaluation/i.test(
          key,
        )
      ) {
        out.push(...rawJsonText(v, depth + 1));
      }
    }
    return out;
  }
  return [];
}

function categoryFor(requirement: string): RequirementCategory {
  const t = requirement.toLowerCase();
  if (/eligib|501|nonprofit|minority|mwbe|sdvob|ue[i]|sam\.gov/.test(t)) {
    return "eligibility";
  }
  if (/deadline|due|submit by|closing date/.test(t)) return "deadline";
  if (/submit|submission|portal|upload|email|grants\.gov|sam\.gov|research\.gov/.test(t)) return "submission";
  if (/page|font|margin|format|single-spaced|double-spaced/.test(t)) return "format";
  if (/attachment|letter|resume|certification|insurance|form|appendix/.test(t)) {
    return "attachment";
  }
  if (/budget|cost|indirect|match|fringe|personnel/.test(t)) return "budget";
  if (/evaluation|outcome|measure|metric|data collection/.test(t)) return "evaluation";
  if (/narrative|approach|capacity|work plan|scope/.test(t)) return "narrative";
  return "other";
}

function ownerSectionFor(category: RequirementCategory, requirement: string): string {
  if (category === "budget") return "budget_narrative";
  if (category === "evaluation") return "evaluation_plan";
  if (category === "eligibility" || /capacity|experience|past performance/i.test(requirement)) {
    return "organizational_capacity";
  }
  if (category === "narrative") return "project_narrative";
  return "global";
}

function ownerLabelFor(category: RequirementCategory, ownerSection: string): string {
  if (category === "budget") return "Finance / Operations";
  if (category === "submission" || category === "deadline") return "Submission lead";
  if (category === "attachment" || category === "format") return "Operations";
  if (ownerSection === "evaluation_plan") return "Evaluation lead";
  if (ownerSection === "organizational_capacity") return "Proposal lead";
  return "Writer";
}

function wordsFor(text: string): string[] {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

function sectionText(sections: SectionInput[], sectionType: string): string {
  if (sectionType === "global") {
    return sections.map((s) => s.content ?? "").join("\n");
  }
  return sections.find((s) => s.section_type === sectionType)?.content ?? "";
}

function statusForRequirement(
  requirement: string,
  category: RequirementCategory,
  sectionBody: string,
): RequirementStatus {
  if (sectionBody.trim().length === 0) return "missing";
  if (/\[VERIFY(?::|\])|\[BUDGET(?::|\])/i.test(sectionBody)) return "needs_review";

  const reqWords = wordsFor(requirement).slice(0, 12);
  if (reqWords.length === 0) return "needs_review";

  const sectionLower = sectionBody.toLowerCase();
  const hits = reqWords.filter((w) => sectionLower.includes(w)).length;
  const ratio = hits / reqWords.length;

  if (category === "attachment" || category === "format" || category === "deadline") {
    return ratio >= 0.25 ? "partial" : "needs_review";
  }
  if (ratio >= 0.5) return "met";
  if (ratio >= 0.25) return "partial";
  return "missing";
}

function extractRequirements(opp: OpportunityInput | null): RequirementRecord[] {
  if (!opp) return [];
  const sources = [
    opp.title,
    opp.brief ?? "",
    ...rawJsonText(opp.raw_json).slice(0, 12),
  ].join("\n");

  const seen = new Set<string>();
  const items: RequirementRecord[] = [];
  for (const sentence of sentenceSplit(sources)) {
    const lower = sentence.toLowerCase();
    if (!REQUIREMENT_WORDS.some((w) => lower.includes(w))) continue;
    const requirement = sentence.length > 260 ? `${sentence.slice(0, 257)}...` : sentence;
    const key = requirement.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      requirement,
      source: "solicitation",
      priority: /deadline|eligible|must|shall|required|submit/i.test(requirement)
        ? "high"
        : "medium",
      source_excerpt: requirement,
    });
    if (items.length >= 10) break;
  }
  return items;
}

function normalizedPackageCategory(category: PackageExtraction["requirements"][number]["category"]): RequirementCategory {
  if (category === "scoring") return "evaluation";
  return category;
}

function packageRequirements(extractions: PackageExtraction[] | undefined): RequirementRecord[] {
  const seen = new Set<string>();
  const out: RequirementRecord[] = [];
  for (const extraction of extractions ?? []) {
    for (const item of extraction.requirements) {
      const requirement = cleanText(item.requirement);
      if (!requirement) continue;
      const key = requirement.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        requirement: requirement.length > 280 ? `${requirement.slice(0, 277)}...` : requirement,
        source: "uploaded_package",
        priority: item.priority ?? "high",
        source_excerpt: item.source_excerpt ?? item.source ?? extraction.title,
        owner_label: item.owner_hint,
        phase: item.phase,
        category: normalizedPackageCategory(item.category),
      });
      if (out.length >= 14) return out;
    }
  }
  return out;
}

function packageDocumentRequirements(extractions: PackageExtraction[] | undefined): RequirementRecord[] {
  const seen = new Set<string>();
  const out: RequirementRecord[] = [];
  for (const extraction of extractions ?? []) {
    for (const doc of [...extraction.required_documents, ...(extraction.forms ?? []), ...(extraction.attachments ?? [])]) {
      const label = cleanText(doc);
      if (!label) continue;
      const requirement = `Submission package includes required document: ${label}.`;
      const key = requirement.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        requirement,
        source: "uploaded_package_document",
        priority: /sf-424|budget|certification|assurance|audit|501|determination|financial/i.test(label)
          ? "critical"
          : "high",
        source_excerpt: label,
        owner_label: /budget|financial|audit/i.test(label)
          ? "Finance / Operations"
          : "Operations",
        phase: "attachments",
        category: "attachment",
      });
      if (out.length >= 12) return out;
    }
  }
  return out;
}

function standardRequirementRecords(opp: OpportunityInput | null): RequirementRecord[] {
  return standardRequirements(opp).map((requirement) => ({
    requirement,
    source: "standard_capture_check",
    priority: "medium",
  }));
}

function packageSubmissionSummary(
  extractions: PackageExtraction[] | undefined,
): NonNullable<ComplianceMatrixArtifact["submission_summary"]> {
  const firstWithMethod = extractions?.find((item) => item.submission_method || item.submission_portal || item.submission_url);
  return {
    deadline_timezone: extractions?.find((item) => item.deadline_timezone)?.deadline_timezone ?? null,
    submission_method: firstWithMethod?.submission_method ?? null,
    submission_portal: firstWithMethod?.submission_portal ?? null,
    submission_url: firstWithMethod?.submission_url ?? null,
    forms: Array.from(new Set((extractions ?? []).flatMap((item) => item.forms ?? []))).slice(0, 12),
    question_deadlines: Array.from(new Set((extractions ?? []).flatMap((item) => item.question_deadlines ?? []))).slice(0, 8),
  };
}

function vaultChunkCount(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / (24 * 60 * 60 * 1000));
}

function countVerifyMarkers(sections: SectionInput[]): number {
  return sections.reduce((total, s) => {
    const matches = (s.content ?? "").match(/\[(VERIFY|BUDGET)(?::|\])/gi);
    return total + (matches?.length ?? 0);
  }, 0);
}

function parsePageLimit(limits: string[]): number | null {
  for (const s of limits) {
    const m = s.match(/(?:not exceed|maximum of?|limit[^\d]*)\s*(\d+)\s*page/i);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function standardRequirements(opp: OpportunityInput | null): string[] {
  const out = [
    "Proposal includes an executive summary aligned to the funder priority.",
    "Proposal explains organizational capacity and relevant past performance.",
    "Proposal includes project activities, target population, timeline, and outcomes.",
    "Proposal includes an evaluation plan with measurable indicators.",
    "Proposal includes a budget narrative and avoids invented dollar amounts.",
  ];
  if (opp?.deadline) out.unshift("Submission deadline is captured and visible to the proposal team.");
  if (opp?.url) out.push("Source posting is linked for final submission verification.");
  return out;
}

function buildComplianceMatrix(input: CaptureReadinessInput): ComplianceMatrixArtifact {
  const extracted = extractRequirements(input.opportunity);
  const packageReqs = packageRequirements(input.packageExtractions);
  const packageDocs = packageDocumentRequirements(input.packageExtractions);
  const standardReqs = standardRequirementRecords(input.opportunity);
  const reqs = [...packageReqs, ...packageDocs, ...extracted, ...standardReqs].slice(0, 28);
  const items: ComplianceMatrixItem[] = reqs.map((record, idx) => {
    const category = record.category ?? categoryFor(record.requirement);
    const ownerSection = ownerSectionFor(category, record.requirement);
    const sectionBody = sectionText(input.sections, ownerSection);
    const responseStatus = statusForRequirement(record.requirement, category, sectionBody);
    const evidence = record.source_excerpt
      ? `Source excerpt: ${record.source_excerpt}`
      : responseStatus === "met"
        ? "Likely covered in the current draft."
        : responseStatus === "partial"
          ? "Partially reflected; verify exact wording against the source."
          : responseStatus === "needs_review"
            ? "Needs human review before submission."
            : "No clear draft coverage found.";
    return {
      id: `REQ-${String(idx + 1).padStart(2, "0")}`,
      category,
      requirement: record.requirement,
      source: record.source,
      response_status: responseStatus,
      owner_section: ownerSection,
      evidence,
      priority: record.priority,
      source_excerpt: record.source_excerpt,
      owner_label: record.owner_label ?? ownerLabelFor(category, ownerSection),
      phase: record.phase,
    };
  });

  const missing = items.filter((i) => i.response_status === "missing").length;
  const needsReview = items.filter((i) => i.response_status === "needs_review").length;
  const critical = items.filter((i) => i.priority === "critical").length;
  const overall: CaptureStatus =
    missing > 0 ? "fail" : needsReview > 0 ? "warn" : "pass";

  return {
    kind: "compliance_matrix_v1",
    overall_status: overall,
    missing_count: missing,
    needs_review_count: needsReview,
    critical_count: critical,
    submission_summary: packageSubmissionSummary(input.packageExtractions),
    items,
  };
}

function buildPacketChecklist(
  input: CaptureReadinessInput,
  matrix: ComplianceMatrixArtifact,
): PacketChecklistArtifact {
  const sectionsByType = new Map(input.sections.map((s) => [s.section_type, s.content ?? ""]));
  const verifyMarkers = countVerifyMarkers(input.sections);
  const vaultChunks = vaultChunkCount(input.proposal.vault_chunks_used);
  const packageCount = input.packageExtractions?.length ?? 0;
  const packageSummary = packageSubmissionSummary(input.packageExtractions);
  const packageForms = packageSummary.forms;
  const questionDeadlines = packageSummary.question_deadlines;
  const matchingFunds = Array.from(
    new Set((input.packageExtractions ?? []).flatMap((item) => item.matching_funds ?? [])),
  ).slice(0, 6);
  const awardLimits = Array.from(
    new Set((input.packageExtractions ?? []).flatMap((item) => item.award_limits ?? [])),
  ).slice(0, 6);

  const sectionItems: PacketChecklistItem[] = Object.values(SECTION_SPECS).map((spec) => {
    const content = sectionsByType.get(spec.type) ?? "";
    const words = wordsFor(content).length;
    return {
      id: `section-${spec.type}`,
      label: spec.label,
      status: content.trim().length === 0 ? "missing" : words < 60 ? "partial" : "met",
      notes:
        content.trim().length === 0
          ? "No generated content found."
          : words < 60
            ? "Present but thin; expand before submission."
            : "Draft section exists.",
    };
  });

  const items: PacketChecklistItem[] = [
    ...sectionItems,
    {
      id: "verify-markers",
      label: "VERIFY and BUDGET placeholders cleared",
      status: verifyMarkers === 0 ? "met" : "needs_review",
      notes:
        verifyMarkers === 0
          ? "No obvious placeholder markers remain."
          : `${verifyMarkers} placeholder marker${verifyMarkers === 1 ? "" : "s"} remain.`,
    },
    {
      id: "vault-grounding",
      label: "Evidence vault used",
      status: vaultChunks > 0 ? "met" : "partial",
      notes:
        vaultChunks > 0
          ? `${vaultChunks} vault chunk${vaultChunks === 1 ? "" : "s"} cited by the drafter.`
          : "Draft was generated without retrieved evidence chunks.",
    },
    {
      id: "rfp-package-imported",
      label: "RFP package imported",
      status: packageCount > 0 ? "met" : "needs_review",
      notes:
        packageCount > 0
          ? `${packageCount} source package${packageCount === 1 ? "" : "s"} imported into the workroom.`
          : "Import the solicitation package, addenda, or portal instructions before final review.",
    },
    {
      id: "submission-method",
      label: "Submission method confirmed",
      status: packageSummary.submission_method || packageSummary.submission_portal || input.opportunity?.url
        ? "needs_review"
        : "missing",
      notes:
        packageSummary.submission_method ??
        (packageSummary.submission_portal
          ? `Portal detected: ${packageSummary.submission_portal}. Confirm account access and upload rules.`
          : input.opportunity?.url
            ? "Source URL is available; confirm portal and upload rules manually."
            : "No submission method or portal was extracted."),
    },
    ...packageForms.slice(0, 8).map((form, index) => ({
      id: `required-form-${index + 1}`,
      label: `Required form: ${form}`,
      status: "needs_review" as const,
      notes: "Confirm the latest form template is complete and included in the final packet.",
    })),
    ...questionDeadlines.slice(0, 3).map((deadline, index) => ({
      id: `question-deadline-${index + 1}`,
      label: "Q&A deadline tracked",
      status: "needs_review" as const,
      notes: deadline,
    })),
    ...matchingFunds.slice(0, 3).map((rule, index) => ({
      id: `match-rule-${index + 1}`,
      label: "Match or cost-share rule reviewed",
      status: "needs_review" as const,
      notes: rule,
    })),
    ...awardLimits.slice(0, 3).map((rule, index) => ({
      id: `award-limit-${index + 1}`,
      label: "Award limit reviewed",
      status: "needs_review" as const,
      notes: rule,
    })),
    {
      id: "source-link",
      label: "Source posting available",
      status: input.opportunity?.url ? "met" : "needs_review",
      notes: input.opportunity?.url
        ? "Source URL is available for final submission checks."
        : "No source URL stored; manually verify submission instructions.",
    },
    {
      id: "requirements-matrix",
      label: "Compliance matrix reviewed",
      status: matrix.overall_status === "fail" ? "missing" : matrix.overall_status === "warn" ? "needs_review" : "met",
      notes:
        matrix.overall_status === "pass"
          ? "No missing requirements detected by deterministic scan."
          : `${matrix.missing_count} missing and ${matrix.needs_review_count} needs-review items detected.`,
    },
    // ── Hardened gate items (Phase 19) ──────────────────────────────────────
    // 1. Page limit enforcement
    (() => {
      const pageLimitStrings = Array.from(
        new Set((input.packageExtractions ?? []).flatMap((e) => e.page_limits ?? [])),
      );
      const limit = parsePageLimit(pageLimitStrings);
      const allText = input.sections
        .map((s) => s.content ?? "")
        .join("\n");
      const totalWords = wordsFor(allText).length;
      const currentPages = Math.ceil(totalWords / 250);
      if (limit === null) {
        return {
          id: "page-limit",
          label: "Page limit verified",
          status: "needs_review" as const,
          notes: "No page limit extracted; confirm against the solicitation.",
        };
      }
      if (currentPages <= limit) {
        return {
          id: "page-limit",
          label: "Page limit verified",
          status: "met" as const,
          notes: `≈${currentPages} pages of ${limit} allowed (250 words/page estimate).`,
        };
      }
      return {
        id: "page-limit",
        label: "Page limit verified",
        status: "missing" as const,
        notes: `Draft exceeds page limit: ≈${currentPages} pages vs ${limit} allowed (250 words/page estimate). Trim before submitting.`,
      };
    })(),
    // 2. Deadline timezone hardening (null = fail blocker)
    (() => {
      const hasDueDate = !!(input.proposal.due_date ?? input.opportunity?.deadline);
      if (!hasDueDate) {
        return {
          id: "deadline-timezone",
          label: "Deadline timezone verified",
          status: "needs_review" as const,
          notes: "No deadline on file.",
        };
      }
      if (!packageSummary.deadline_timezone) {
        return {
          id: "deadline-timezone",
          label: "Deadline timezone verified",
          status: "missing" as const,
          notes:
            "Deadline timezone could not be extracted. Check the original solicitation — a missed timezone can cause a missed deadline.",
        };
      }
      return {
        id: "deadline-timezone",
        label: "Deadline timezone verified",
        status: "needs_review" as const,
        notes: `Timezone: ${packageSummary.deadline_timezone}. Confirm against the original posting.`,
      };
    })(),
    // 3. Budget math check
    (() => {
      const budgetSection =
        input.sections.find((s) => s.section_type === "budget_narrative")?.content ?? "";
      if (!budgetSection.trim()) {
        return {
          id: "budget-math",
          label: "Budget math verified",
          status: "needs_review" as const,
          notes: "Budget narrative missing — cannot verify budget math.",
        };
      }
      const budgetMarkers = (budgetSection.match(/\[BUDGET(?::|\])/gi) ?? []).length;
      if (budgetMarkers === 0) {
        return {
          id: "budget-math",
          label: "Budget math verified",
          status: "met" as const,
          notes: "No unresolved BUDGET markers found in budget narrative.",
        };
      }
      return {
        id: "budget-math",
        label: "Budget math verified",
        status: "needs_review" as const,
        notes: `${budgetMarkers} unresolved [BUDGET] marker${budgetMarkers === 1 ? "" : "s"} in the budget narrative. Replace with real figures before submitting.`,
      };
    })(),
    // 4. AI disclosure (NEVER auto-passes — only `ai_disclosure_acknowledged` can flip it to met)
    {
      id: "ai-disclosure",
      label: "AI-use disclosure acknowledged",
      status: input.proposal.ai_disclosure_acknowledged === true ? "met" : "needs_review",
      notes:
        "This proposal was drafted with AI assistance. Federal agencies (GSA GSAR 552.239-7001) and some funders (e.g. NIH) require or restrict AI-use disclosure. Review /ai-disclosure and the solicitation’s AI policy, then acknowledge.",
    } as PacketChecklistItem,
  ];

  const overall: CaptureStatus = items.some((i) => i.status === "missing")
    ? "fail"
    : items.some((i) => i.status === "needs_review" || i.status === "partial")
      ? "warn"
      : "pass";

  return {
    kind: "packet_checklist_v1",
    overall_status: overall,
    due_date: input.proposal.due_date ?? input.opportunity?.deadline ?? null,
    submission_url: packageSummary.submission_url ?? input.opportunity?.url ?? null,
    deadline_timezone: packageSummary.deadline_timezone,
    submission_method: packageSummary.submission_method,
    submission_portal: packageSummary.submission_portal,
    forms: packageForms,
    question_deadlines: questionDeadlines,
    items,
  };
}

function buildBidNoBid(
  input: CaptureReadinessInput,
  matrix: ComplianceMatrixArtifact,
  packet: PacketChecklistArtifact,
): BidNoBidArtifact {
  const fitScore = input.match?.fit_score ?? 50;
  const deadlineDays = daysUntil(input.proposal.due_date ?? input.opportunity?.deadline ?? null);
  const verifyMarkers = countVerifyMarkers(input.sections);
  const vaultChunks = vaultChunkCount(input.proposal.vault_chunks_used);

  let score = fitScore;
  if (deadlineDays !== null && deadlineDays < 0) score -= 35;
  else if (deadlineDays !== null && deadlineDays <= 3) score -= 20;
  else if (deadlineDays !== null && deadlineDays <= 7) score -= 10;
  if (matrix.overall_status === "fail") score -= 15;
  if (packet.overall_status === "fail") score -= 10;
  if (verifyMarkers > 5) score -= 8;
  if (vaultChunks === 0) score -= 6;
  score = clamp(Math.round(score), 0, 100);

  const recommendation: CaptureRecommendation =
    score >= 78 ? "pursue" : score >= 58 ? "maybe" : "pass";

  const drivers = [
    `Fit score: ${Math.round(fitScore)}/100.`,
    ...(input.match?.chips ?? []).slice(0, 4),
    input.match?.summary ? input.match.summary : null,
  ].filter((v): v is string => Boolean(v));

  const risks = [
    deadlineDays === null
      ? "No deadline stored; confirm the source posting manually."
      : deadlineDays < 0
        ? "Deadline appears to have passed."
        : deadlineDays <= 7
          ? `Deadline is close: ${deadlineDays} day${deadlineDays === 1 ? "" : "s"} remaining.`
          : null,
    matrix.missing_count > 0
      ? `${matrix.missing_count} requirement${matrix.missing_count === 1 ? "" : "s"} have no clear draft coverage.`
      : null,
    matrix.needs_review_count > 0
      ? `${matrix.needs_review_count} requirement${matrix.needs_review_count === 1 ? "" : "s"} need human review.`
      : null,
    verifyMarkers > 0
      ? `${verifyMarkers} VERIFY/BUDGET marker${verifyMarkers === 1 ? "" : "s"} remain.`
      : null,
    vaultChunks === 0 ? "No vault evidence was used in the draft." : null,
  ].filter((v): v is string => Boolean(v));

  const nextActions = [
    matrix.missing_count > 0
      ? "Resolve missing compliance matrix items before writing more prose."
      : "Review the compliance matrix against the source posting.",
    verifyMarkers > 0
      ? "Clear all VERIFY/BUDGET markers with real evidence or budget numbers."
      : "Run the reviewer agent for qualitative scoring.",
    vaultChunks === 0
      ? "Upload past wins, metrics, resumes, budget docs, and partner letters to the vault."
      : "Confirm cited vault evidence is accurate and current.",
    "Assign a submission owner and internal review deadline.",
  ];

  return {
    kind: "bid_no_bid_v1",
    recommendation,
    score,
    drivers,
    risks,
    next_actions: nextActions,
  };
}

export function generateCaptureReadiness(
  input: CaptureReadinessInput,
): CaptureReadinessResult {
  const complianceMatrix = buildComplianceMatrix(input);
  const packetChecklist = buildPacketChecklist(input, complianceMatrix);
  const bidNoBid = buildBidNoBid(input, complianceMatrix, packetChecklist);

  return {
    bid_no_bid: bidNoBid,
    compliance_matrix: complianceMatrix,
    packet_checklist: packetChecklist,
  };
}
