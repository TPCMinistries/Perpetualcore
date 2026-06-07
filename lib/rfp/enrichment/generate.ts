export interface OpportunityForEnrichment {
  id: string;
  source: string;
  title: string;
  agency: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  posted_at: string | null;
  brief: string | null;
  url: string | null;
  raw_json: unknown;
}

export interface OpportunityEnrichment {
  opp_id: string;
  source: "rules_v1";
  eligibility: string[];
  required_documents: string[];
  submission_method: string | null;
  submission_url: string | null;
  contact: string | null;
  matching_funds: string | null;
  funding_method: string | null;
  award_range: string | null;
  timeline: string[];
  risks: string[];
  missing_fields: string[];
  quality_score: number;
  raw: Record<string, unknown>;
}

const DOCUMENT_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "Application narrative", pattern: /\b(narrative|project description|program description)\b/i },
  { label: "Budget and budget justification", pattern: /\b(budget|cost proposal|budget justification)\b/i },
  { label: "Work plan or scope of work", pattern: /\b(work ?plan|scope of work|implementation plan)\b/i },
  { label: "Letters of support or commitment", pattern: /\b(letter[s]? of (support|commitment)|partner letter)\b/i },
  { label: "501(c)(3) or nonprofit documentation", pattern: /\b501\(c\)\(3\)|nonprofit status|tax exempt\b/i },
  { label: "SAM.gov UEI registration", pattern: /\b(SAM\.gov|unique entity id|UEI)\b/i },
  { label: "SF-424 forms", pattern: /\bSF[- ]?424\b/i },
  { label: "Resumes or staff bios", pattern: /\b(resume|résumé|curriculum vitae|staff bio)\b/i },
  { label: "Evaluation or outcomes plan", pattern: /\b(evaluation plan|outcome measure|performance measure)\b/i },
  { label: "Audit, financial statements, or insurance", pattern: /\b(audit|financial statement|insurance|certificate of insurance)\b/i },
];

export const ELIGIBILITY_RULES: Array<{ label: string; pattern: RegExp }> = [
  { label: "Nonprofit organizations", pattern: /\b(nonprofit|non-profit|501\(c\)\(3\))\b/i },
  { label: "Public agencies or local governments", pattern: /\b(public agenc|local government|city|county|municipal)\b/i },
  { label: "Schools, colleges, or education providers", pattern: /\b(school|college|university|education(al)? institution)\b/i },
  { label: "Tribal governments or organizations", pattern: /\btribal|native american|indian tribe\b/i },
  { label: "Small businesses or contractors", pattern: /\bsmall business|contractor|vendor|bidder\b/i },
  { label: "Healthcare or workforce providers", pattern: /\b(healthcare|medical|workforce|training provider)\b/i },
];

function clean(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 0 ? text : null;
}

function truncate(text: string, max = 220): string {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function field(raw: unknown, keys: string[]): string | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  for (const key of keys) {
    const direct = clean(record[key]);
    if (direct) return direct;
    const foundKey = Object.keys(record).find((candidate) => candidate.toLowerCase() === key.toLowerCase());
    if (foundKey) {
      const value = clean(record[foundKey]);
      if (value) return value;
    }
  }
  return null;
}

function collectText(value: unknown, depth = 0): string[] {
  if (depth > 3 || value === null || value === undefined) return [];
  if (typeof value === "string") return [value];
  if (typeof value === "number") return [String(value)];
  if (typeof value === "boolean") return [];
  if (Array.isArray(value)) return value.flatMap((item) => collectText(item, depth + 1));
  if (typeof value === "object") {
    const chunks: string[] = [];
    for (const [key, nested] of Object.entries(value)) {
      if (
        /applicant|eligib|description|purpose|require|document|attachment|submission|deadline|contact|fund|amount|award|method|note|instruction|criteria|url/i.test(
          key,
        )
      ) {
        chunks.push(...collectText(nested, depth + 1));
      }
    }
    return chunks;
  }
  return [];
}

function unique(items: Array<string | null | undefined>, limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const text = item?.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(truncate(text));
    if (out.length >= limit) break;
  }
  return out;
}

function sentenceMatches(text: string, pattern: RegExp, limit: number): string[] {
  return unique(
    text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 24 && pattern.test(sentence)),
    limit,
  );
}

function formatMoney(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildAwardRange(opp: OpportunityForEnrichment, raw: unknown): string | null {
  const explicit = field(raw, ["EstAmounts", "estimatedAwardAmount", "awardAmount", "awardCeiling", "AwardCeiling"]);
  if (explicit) return truncate(explicit);

  const min = formatMoney(opp.amount_min);
  const max = formatMoney(opp.amount_max);
  if (min && max) return `${min} - ${max}`;
  if (max) return `Up to ${max}`;
  if (min) return `From ${min}`;
  return field(raw, ["EstAvailFunds", "estimatedTotalProgramFunding", "FundingAmount"]);
}

function buildContact(raw: unknown): string | null {
  const explicit = field(raw, [
    "ContactInfo",
    "contact",
    "contactInfo",
    "agencyContactDescription",
    "agencyContactEmail",
    "agencyContactPhone",
    "PrimaryContact",
  ]);
  if (explicit) return truncate(explicit, 260);

  const text = collectText(raw).join(" ");
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.exec(text)?.[0];
  const phone = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/.exec(text)?.[0];
  return unique([email, phone], 2).join(" | ") || null;
}

function buildSubmissionMethod(opp: OpportunityForEnrichment, raw: unknown): string | null {
  const electronic = field(raw, ["ElecSubmission", "electronicSubmission", "submissionType"]);
  const instructions = field(raw, ["SubmissionInstructions", "applicationInstructions", "howToApply", "GrantURL"]);
  if (electronic && /^true|yes$/i.test(electronic)) return "Electronic submission required";
  if (electronic && /^false|no$/i.test(electronic)) return "Confirm non-electronic submission instructions at source";
  if (instructions) return truncate(instructions);
  if (opp.url?.includes("grants.gov")) return "Apply through Grants.gov";
  if (opp.url?.includes("sam.gov")) return "Respond through SAM.gov";
  if (opp.url) return "Open source instructions before drafting";
  return null;
}

function buildSubmissionUrl(opp: OpportunityForEnrichment, raw: unknown): string | null {
  return (
    field(raw, ["GrantURL", "url", "uiLink", "html_url", "opportunityUrl", "applicationUrl"]) ??
    opp.url
  );
}

function buildTimeline(opp: OpportunityForEnrichment, raw: unknown): string[] {
  return unique(
    [
      field(raw, ["OpenDate", "openDate"]) ? `Opens: ${field(raw, ["OpenDate", "openDate"])}` : null,
      opp.posted_at ? `Posted: ${new Date(opp.posted_at).toLocaleDateString("en-US")}` : null,
      field(raw, ["ApplicationDeadline", "closeDate", "responseDeadLine"])
        ? `Due: ${field(raw, ["ApplicationDeadline", "closeDate", "responseDeadLine"])}`
        : opp.deadline
          ? `Due: ${new Date(opp.deadline).toLocaleDateString("en-US")}`
          : null,
      field(raw, ["ExpAwardDate", "expectedAwardDate"])
        ? `Expected award: ${field(raw, ["ExpAwardDate", "expectedAwardDate"])}`
        : null,
      field(raw, ["GrantEventsURL"]) ? `Events: ${field(raw, ["GrantEventsURL"])}` : null,
    ],
    5,
  );
}

function buildEligibility(text: string, raw: unknown): string[] {
  const explicit = unique(
    [
      field(raw, ["ApplicantType", "eligibleApplicants", "eligibility", "applicantEligibility"]),
      field(raw, ["ApplicantTypeNotes", "eligibilityInformation"]),
    ],
    4,
  );
  const inferred = ELIGIBILITY_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label);
  const sentences = sentenceMatches(text, /\b(eligib|applicant|nonprofit|501\(c\)|public agenc|tribal|school|business)\b/i, 2);
  return unique([...explicit, ...inferred, ...sentences], 6);
}

function buildDocuments(text: string): string[] {
  const ruleHits = DOCUMENT_RULES.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label);
  const sentenceHits = sentenceMatches(text, /\b(required|submit|include|attach|form|budget|narrative|letter|certification)\b/i, 4);
  return unique([...ruleHits, ...sentenceHits], 8);
}

function buildRisks(opp: OpportunityForEnrichment, enrichment: Omit<OpportunityEnrichment, "risks" | "missing_fields" | "quality_score">): string[] {
  const risks: string[] = [];
  if (!opp.deadline) risks.push("No machine-readable deadline found; verify the source before assigning effort.");
  if (opp.deadline && new Date(opp.deadline).getTime() < Date.now()) {
    risks.push("Deadline appears to have passed; treat as market intelligence unless source was extended.");
  }
  if (enrichment.eligibility.length === 0) risks.push("Eligibility is not structured yet; confirm before drafting.");
  if (enrichment.required_documents.length === 0) risks.push("Required documents are not structured yet; review the source package.");
  if (!enrichment.submission_method) risks.push("Submission method is unclear.");
  if (!enrichment.contact) risks.push("No contact extracted from source payload.");
  return unique(risks, 6);
}

function buildMissingFields(enrichment: Omit<OpportunityEnrichment, "risks" | "missing_fields" | "quality_score">): string[] {
  const missing: string[] = [];
  if (enrichment.eligibility.length === 0) missing.push("Eligibility");
  if (enrichment.required_documents.length === 0) missing.push("Required documents");
  if (!enrichment.submission_method) missing.push("Submission method");
  if (!enrichment.contact) missing.push("Contact");
  if (!enrichment.award_range) missing.push("Award range");
  if (enrichment.timeline.length === 0) missing.push("Timeline");
  return missing;
}

function qualityScore(enrichment: Omit<OpportunityEnrichment, "quality_score">): number {
  let score = 10;
  if (enrichment.eligibility.length > 0) score += 18;
  if (enrichment.required_documents.length > 0) score += 18;
  if (enrichment.submission_method) score += 14;
  if (enrichment.submission_url) score += 10;
  if (enrichment.contact) score += 10;
  if (enrichment.award_range) score += 8;
  if (enrichment.timeline.length > 0) score += 8;
  if (enrichment.risks.length === 0) score += 4;
  return Math.max(0, Math.min(100, score));
}

export function generateOpportunityEnrichment(
  opp: OpportunityForEnrichment,
): OpportunityEnrichment {
  const raw = opp.raw_json;
  const allText = [
    opp.title,
    opp.agency ?? "",
    opp.brief ?? "",
    ...collectText(raw).slice(0, 40),
  ].join("\n");

  const base = {
    opp_id: opp.id,
    source: "rules_v1" as const,
    eligibility: buildEligibility(allText, raw),
    required_documents: buildDocuments(allText),
    submission_method: buildSubmissionMethod(opp, raw),
    submission_url: buildSubmissionUrl(opp, raw),
    contact: buildContact(raw),
    matching_funds: field(raw, ["MatchingFunds", "MatchingFundsNotes", "matchRequirement"]),
    funding_method: field(raw, ["FundingMethod", "FundingMethodNotes", "FundingSource", "fundingInstrumentType"]),
    award_range: buildAwardRange(opp, raw),
    timeline: buildTimeline(opp, raw),
    raw: {
      source: opp.source,
      generated_at: new Date().toISOString(),
      source_payload_keys:
        raw && typeof raw === "object" && !Array.isArray(raw) ? Object.keys(raw).slice(0, 80) : [],
    },
  };
  const risks = buildRisks(opp, base);
  const missing_fields = buildMissingFields(base);

  return {
    ...base,
    risks,
    missing_fields,
    quality_score: qualityScore({ ...base, risks, missing_fields }),
  };
}
