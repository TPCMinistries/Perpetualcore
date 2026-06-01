export interface PackageRequirement {
  id: string;
  category:
    | "eligibility"
    | "deadline"
    | "format"
    | "attachment"
    | "budget"
    | "scoring"
    | "submission"
    | "other";
  requirement: string;
  source: string;
  priority: "critical" | "high" | "medium";
}

export interface PackageExtraction {
  kind: "package_requirements_v1";
  title: string;
  source_type: "upload" | "url" | "paste";
  source_url: string | null;
  extracted_chars: number;
  quality_score: number;
  eligibility: string[];
  required_documents: string[];
  page_limits: string[];
  budget_rules: string[];
  scoring_criteria: string[];
  deadlines: string[];
  submission_instructions: string[];
  contacts: string[];
  risks: string[];
  requirements: PackageRequirement[];
}

const REQUIREMENT_PATTERNS: Array<{
  category: PackageRequirement["category"];
  priority: PackageRequirement["priority"];
  pattern: RegExp;
}> = [
  { category: "eligibility", priority: "critical", pattern: /\b(eligib|applicant|501\(c\)|nonprofit|non-profit|public agenc|tribal|small business|bidder)\b/i },
  { category: "deadline", priority: "critical", pattern: /\b(deadline|due date|submit by|closing date|questions due|q&a|pre[- ]?proposal)\b/i },
  { category: "format", priority: "high", pattern: /\b(page limit|maximum pages|font|margin|single-spaced|double-spaced|format|pdf|template)\b/i },
  { category: "attachment", priority: "high", pattern: /\b(attachment|appendix|form|certification|letter of support|resume|work plan|narrative|budget)\b/i },
  { category: "budget", priority: "high", pattern: /\b(budget|match|matching funds|cost share|indirect|fringe|allowable cost|reimbursement)\b/i },
  { category: "scoring", priority: "medium", pattern: /\b(score|scoring|points|evaluation criteria|rubric|review criteria|weighted)\b/i },
  { category: "submission", priority: "critical", pattern: /\b(submit|submission|portal|email|grants\.gov|sam\.gov|upload|electronic)\b/i },
];

const DOC_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Application narrative", pattern: /\b(application|project|program) narrative\b/i },
  { label: "Budget and budget justification", pattern: /\bbudget( justification| narrative)?\b/i },
  { label: "Work plan or implementation plan", pattern: /\b(work plan|implementation plan|scope of work)\b/i },
  { label: "Letters of support or commitment", pattern: /\bletter[s]? of (support|commitment)\b/i },
  { label: "501(c)(3) or nonprofit documentation", pattern: /\b501\(c\)\(3\)|tax exempt|nonprofit status\b/i },
  { label: "SAM.gov UEI registration", pattern: /\bSAM\.gov|unique entity id|UEI\b/i },
  { label: "SF-424 forms", pattern: /\bSF[- ]?424\b/i },
  { label: "Resumes or staff bios", pattern: /\bresume|résumé|staff bio|curriculum vitae\b/i },
  { label: "Evaluation or outcomes plan", pattern: /\bevaluation plan|outcome measures?|performance measures?\b/i },
  { label: "Audit, financial statements, or insurance", pattern: /\baudit|financial statements?|insurance\b/i },
];

function clean(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max = 260): string {
  const cleaned = clean(text);
  return cleaned.length > max ? `${cleaned.slice(0, max - 3)}...` : cleaned;
}

function sentences(text: string): string[] {
  return text
    .replace(/\r/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map(clean)
    .filter((sentence) => sentence.length >= 24);
}

function unique(items: Array<string | null | undefined>, limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const value = item ? truncate(item) : "";
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= limit) break;
  }
  return out;
}

function matchedSentences(text: string, pattern: RegExp, limit: number): string[] {
  return unique(sentences(text).filter((sentence) => pattern.test(sentence)), limit);
}

function pageLimits(text: string): string[] {
  const direct = text.match(/(?:page limit|maximum(?: of)? pages?|not exceed)[^.]{0,120}/gi) ?? [];
  return unique([...direct, ...matchedSentences(text, /\b(page limit|font|margin|spacing|not exceed)\b/i, 5)], 8);
}

function deadlines(text: string): string[] {
  const dateLike =
    /\b(?:deadline|due|submit by|questions due|closing date|pre[- ]?proposal)[^.\n]{0,140}(?:\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Z][a-z]+\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi;
  return unique([...(text.match(dateLike) ?? []), ...matchedSentences(text, /\b(deadline|due|closing date|questions due)\b/i, 5)], 8);
}

function contacts(text: string): string[] {
  const emails = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi) ?? [];
  const phones = text.match(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g) ?? [];
  return unique([...emails, ...phones, ...matchedSentences(text, /\b(contact|questions|procurement|grant officer)\b/i, 3)], 8);
}

function buildRequirements(text: string): PackageRequirement[] {
  const reqs: PackageRequirement[] = [];
  const seen = new Set<string>();
  for (const sentence of sentences(text)) {
    for (const rule of REQUIREMENT_PATTERNS) {
      if (!rule.pattern.test(sentence)) continue;
      const requirement = truncate(sentence);
      const key = `${rule.category}:${requirement.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      reqs.push({
        id: `pkg-${reqs.length + 1}`,
        category: rule.category,
        requirement,
        source: "package text",
        priority: rule.priority,
      });
      break;
    }
    if (reqs.length >= 30) break;
  }
  return reqs;
}

function quality(extraction: Omit<PackageExtraction, "quality_score">): number {
  let score = 10;
  if (extraction.extracted_chars >= 2_000) score += 15;
  if (extraction.eligibility.length > 0) score += 12;
  if (extraction.required_documents.length > 0) score += 14;
  if (extraction.deadlines.length > 0) score += 12;
  if (extraction.submission_instructions.length > 0) score += 12;
  if (extraction.budget_rules.length > 0) score += 8;
  if (extraction.scoring_criteria.length > 0) score += 8;
  if (extraction.page_limits.length > 0) score += 5;
  if (extraction.contacts.length > 0) score += 4;
  return Math.max(0, Math.min(100, score));
}

export function extractPackageRequirements(params: {
  title: string;
  sourceType: "upload" | "url" | "paste";
  sourceUrl: string | null;
  text: string;
}): PackageExtraction {
  const text = clean(params.text);
  const requiredDocuments = unique(
    [
      ...DOC_PATTERNS.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label),
      ...matchedSentences(text, /\b(submit|include|attach|required|forms?|certification|letter|budget|narrative)\b/i, 10),
    ],
    12,
  );
  const requirements = buildRequirements(text);
  const base = {
    kind: "package_requirements_v1" as const,
    title: params.title,
    source_type: params.sourceType,
    source_url: params.sourceUrl,
    extracted_chars: text.length,
    eligibility: matchedSentences(text, /\b(eligible|eligibility|applicant|nonprofit|501\(c\)|public agency|tribal|bidder)\b/i, 10),
    required_documents: requiredDocuments,
    page_limits: pageLimits(text),
    budget_rules: matchedSentences(text, /\b(budget|match|cost share|indirect|allowable|reimbursement)\b/i, 10),
    scoring_criteria: matchedSentences(text, /\b(scoring|points|evaluation criteria|rubric|review criteria)\b/i, 10),
    deadlines: deadlines(text),
    submission_instructions: matchedSentences(text, /\b(submit|submission|portal|upload|email|grants\.gov|sam\.gov)\b/i, 10),
    contacts: contacts(text),
    risks: unique(
      [
        text.length < 2_000 ? "Extracted package text is short; confirm the full solicitation was imported." : null,
        requirements.some((req) => req.category === "eligibility") ? null : "Package eligibility language was not clearly extracted.",
        requiredDocuments.length > 0 ? null : "Required attachment list was not clearly extracted.",
        deadlines(text).length > 0 ? null : "Package deadline language was not clearly extracted.",
        matchedSentences(text, /\b(scoring|points|evaluation criteria|rubric|review criteria)\b/i, 2).length > 0
          ? null
          : "Scoring rubric was not clearly extracted.",
      ],
      8,
    ),
    requirements,
  };
  return {
    ...base,
    quality_score: quality(base),
  };
}
