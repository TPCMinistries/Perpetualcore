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
  source?: string;
  source_excerpt?: string;
  source_location?: string | null;
  owner_hint?: string;
  phase?: "eligibility" | "draft" | "budget" | "attachments" | "submission" | "review";
  priority?: "critical" | "high" | "medium";
}

export interface PackageExtraction {
  kind: "package_requirements_v1";
  title: string;
  source_type: "upload" | "url" | "paste";
  source_url: string | null;
  extracted_at?: string;
  extracted_chars: number;
  quality_score: number;
  deadline_timezone?: string | null;
  submission_method?: string | null;
  submission_portal?: string | null;
  submission_url?: string | null;
  forms?: string[];
  attachments?: string[];
  matching_funds?: string[];
  award_limits?: string[];
  question_deadlines?: string[];
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

const FORM_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "SF-424", pattern: /\bSF[- ]?424\b/i },
  { label: "SF-424A budget information", pattern: /\bSF[- ]?424A\b/i },
  { label: "SF-424B assurances", pattern: /\bSF[- ]?424B\b/i },
  { label: "Project abstract", pattern: /\b(project abstract|abstract form)\b/i },
  { label: "Budget justification", pattern: /\bbudget justification\b/i },
  { label: "Disclosure of lobbying activities", pattern: /\bSF[- ]?LLL|lobbying activities\b/i },
  { label: "Assurances and certifications", pattern: /\bassurances?|certifications?\b/i },
  { label: "Logic model", pattern: /\blogic model\b/i },
];

function clean(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max = 260): string {
  const cleaned = clean(text);
  return cleaned.length > max ? `${cleaned.slice(0, max - 3)}...` : cleaned;
}

function sourceExcerpt(text: string): string {
  return truncate(text, 340);
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

function requirementPhase(category: PackageRequirement["category"]): PackageRequirement["phase"] {
  if (category === "eligibility") return "eligibility";
  if (category === "budget") return "budget";
  if (category === "attachment" || category === "format") return "attachments";
  if (category === "deadline" || category === "submission") return "submission";
  if (category === "scoring") return "review";
  return "draft";
}

function ownerHint(category: PackageRequirement["category"], sentence: string): string {
  if (category === "budget") return "Finance / Operations";
  if (category === "submission" || category === "deadline") return "Submission lead";
  if (category === "attachment" || category === "format") return "Operations";
  if (category === "eligibility") return "Proposal lead";
  if (/evaluation|outcome|metric|performance/i.test(sentence)) return "Evaluation lead";
  return "Writer";
}

function deadlineTimezone(text: string): string | null {
  const match = text.match(/\b(?:Eastern|Central|Mountain|Pacific|Atlantic)\s+(?:Standard|Daylight)?\s*Time\b|\b(?:EST|EDT|CST|CDT|MST|MDT|PST|PDT|UTC)\b/i);
  return match ? clean(match[0]) : null;
}

function absoluteUrls(text: string): string[] {
  return unique(text.match(/\bhttps?:\/\/[^\s)>\]]+/gi) ?? [], 8);
}

function submissionPortal(text: string): string | null {
  if (/\bgrants\.gov\b/i.test(text)) return "Grants.gov";
  if (/\bsam\.gov\b/i.test(text)) return "SAM.gov";
  if (/\bera commons\b/i.test(text)) return "eRA Commons";
  if (/\bresearch\.gov\b/i.test(text)) return "Research.gov";
  if (/\bjustgrants\b/i.test(text)) return "JustGrants";
  if (/\bbonfire\b/i.test(text)) return "Bonfire";
  if (/\bsubmittable\b/i.test(text)) return "Submittable";
  if (/\bportal\b/i.test(text)) return "Online portal";
  if (/\bemail\b/i.test(text)) return "Email";
  return null;
}

function submissionMethod(text: string): string | null {
  const portal = submissionPortal(text);
  const instruction = matchedSentences(text, /\b(submit|submission|upload|portal|email|grants\.gov|sam\.gov|research\.gov|era commons)\b/i, 1)[0];
  if (instruction) return instruction;
  if (portal) return `Submit through ${portal}.`;
  return null;
}

function submissionUrl(text: string): string | null {
  const urls = absoluteUrls(text);
  return (
    urls.find((url) => /grants\.gov|sam\.gov|research\.gov|era|portal|procurement|bonfire|submittable/i.test(url)) ??
    urls[0] ??
    null
  );
}

function forms(text: string): string[] {
  return unique(
    [
      ...FORM_PATTERNS.filter((rule) => rule.pattern.test(text)).map((rule) => rule.label),
      ...matchedSentences(text, /\b(form|SF[- ]?424|assurances?|certifications?|lobbying|abstract)\b/i, 8),
    ],
    12,
  );
}

function attachments(text: string): string[] {
  return unique(
    matchedSentences(
      text,
      /\b(attachment|appendix|letter of support|resume|bio|audit|financial statement|insurance|determination letter|work plan)\b/i,
      12,
    ),
    12,
  );
}

function matchingFunds(text: string): string[] {
  return matchedSentences(text, /\b(match|matching funds|cost share|in-kind|cash match)\b/i, 8);
}

function awardLimits(text: string): string[] {
  const amountLike = text.match(/\b(?:award|grant|funding|budget)[^.\n]{0,120}\$[\d,]+(?:\.\d{2})?(?:\s*(?:-|to)\s*\$[\d,]+(?:\.\d{2})?)?/gi) ?? [];
  return unique([...amountLike, ...matchedSentences(text, /\b(maximum award|minimum award|award ceiling|funding range|not exceed \$)\b/i, 6)], 8);
}

function questionDeadlines(text: string): string[] {
  return unique(
    matchedSentences(text, /\b(questions?(?:\s+are)?\s+due|q&a|question deadline|inquiries|requests for clarification|pre[- ]?proposal)\b/i, 8),
    8,
  );
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
        source_excerpt: sourceExcerpt(sentence),
        source_location: null,
        owner_hint: ownerHint(rule.category, sentence),
        phase: requirementPhase(rule.category),
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
  if (extraction.submission_method) score += 8;
  if (extraction.submission_portal || extraction.submission_url) score += 6;
  if ((extraction.forms ?? []).length > 0) score += 6;
  if ((extraction.question_deadlines ?? []).length > 0) score += 4;
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
  const extractedDeadlines = deadlines(text);
  const extractedForms = forms(text);
  const extractedAttachments = attachments(text);
  const extractedMatchingFunds = matchingFunds(text);
  const extractedAwardLimits = awardLimits(text);
  const extractedQuestionDeadlines = questionDeadlines(text);
  const extractedSubmissionMethod = submissionMethod(text);
  const extractedSubmissionPortal = submissionPortal(text);
  const extractedSubmissionUrl = submissionUrl(text);
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
    extracted_at: new Date().toISOString(),
    extracted_chars: text.length,
    deadline_timezone: deadlineTimezone(text),
    submission_method: extractedSubmissionMethod,
    submission_portal: extractedSubmissionPortal,
    submission_url: extractedSubmissionUrl,
    forms: extractedForms,
    attachments: extractedAttachments,
    matching_funds: extractedMatchingFunds,
    award_limits: extractedAwardLimits,
    question_deadlines: extractedQuestionDeadlines,
    eligibility: matchedSentences(text, /\b(eligible|eligibility|applicant|nonprofit|501\(c\)|public agency|tribal|bidder)\b/i, 10),
    required_documents: requiredDocuments,
    page_limits: pageLimits(text),
    budget_rules: matchedSentences(text, /\b(budget|match|cost share|indirect|allowable|reimbursement)\b/i, 10),
    scoring_criteria: matchedSentences(text, /\b(scoring|points|evaluation criteria|rubric|review criteria)\b/i, 10),
    deadlines: extractedDeadlines,
    submission_instructions: matchedSentences(text, /\b(submit|submission|portal|upload|email|grants\.gov|sam\.gov)\b/i, 10),
    contacts: contacts(text),
    risks: unique(
      [
        text.length < 2_000 ? "Extracted package text is short; confirm the full solicitation was imported." : null,
        requirements.some((req) => req.category === "eligibility") ? null : "Package eligibility language was not clearly extracted.",
        requiredDocuments.length > 0 ? null : "Required attachment list was not clearly extracted.",
        extractedDeadlines.length > 0 ? null : "Package deadline language was not clearly extracted.",
        extractedSubmissionMethod ? null : "Submission portal or method was not clearly extracted.",
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
