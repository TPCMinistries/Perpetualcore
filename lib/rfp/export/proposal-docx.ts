import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { SECTION_SPECS, SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";

export interface ProposalDocxProposal {
  title: string;
  status: string;
  due_date: string | null;
  created_at: string;
}

export interface ProposalDocxOrg {
  name: string;
}

export interface ProposalDocxOpportunity {
  title: string;
  agency: string | null;
  brief: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  url: string | null;
}

export interface ProposalDocxSection {
  section_type: string;
  content: string | null;
}

export interface ProposalDocxCheck {
  check_type: string;
  details_json: unknown;
}

export function proposalDocxFilename(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "proposal"}-submission-draft.docx`;
}

function fmtDate(iso: string | null): string {
  if (!iso) return "Not specified";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtAmount(min: number | null, max: number | null): string {
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  if (min && max && min !== max) return `${money.format(min)} - ${money.format(max)}`;
  if (max) return money.format(max);
  if (min) return money.format(min);
  return "Not specified";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function paragraphsFromText(text: string | null | undefined): Paragraph[] {
  const blocks = (text ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return [new Paragraph({ children: [new TextRun({ text: "No draft content yet." })] })];
  }

  return blocks.map(
    (block) =>
      new Paragraph({
        children: [new TextRun({ text: block.replace(/\s*\n\s*/g, " ") })],
        spacing: { after: 180 },
      }),
  );
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text })],
    bullet: { level: 0 },
    spacing: { after: 90 },
  });
}

function renderCompliance(checks: ProposalDocxCheck[]): Paragraph[] {
  const children: Paragraph[] = [
    new Paragraph({
      text: "Capture Readiness Appendix",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 180 },
    }),
  ];

  if (checks.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No capture readiness artifacts have been generated yet.",
            italics: true,
          }),
        ],
      }),
    );
    return children;
  }

  for (const check of checks) {
    children.push(
      new Paragraph({
        text: check.check_type.replace(/_/g, " "),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 90 },
      }),
    );

    const details = isObject(check.details_json) ? check.details_json : {};
    const summary = asString(details.summary);
    const rationale = Array.isArray(details.rationale)
      ? details.rationale.map(asString).filter((item): item is string => Boolean(item))
      : [];
    const items = Array.isArray(details.items)
      ? details.items.filter(isObject).slice(0, 20)
      : [];

    if (summary) children.push(new Paragraph({ text: summary, spacing: { after: 120 } }));
    for (const item of rationale) children.push(bullet(item));

    for (const item of items) {
      const label =
        asString(item.label) ??
        asString(item.requirement) ??
        asString(item.name) ??
        asString(item.section) ??
        "Checklist item";
      const status = asString(item.status);
      const note = asString(item.note) ?? asString(item.evidence) ?? asString(item.action);
      children.push(bullet([label, status ? `Status: ${status}` : null, note].filter(Boolean).join(" | ")));
    }
  }

  return children;
}

export async function buildProposalDocxBuffer(input: {
  proposal: ProposalDocxProposal;
  org: ProposalDocxOrg | null;
  opportunity: ProposalDocxOpportunity | null;
  sections: ProposalDocxSection[];
  checks: ProposalDocxCheck[];
}): Promise<Buffer> {
  const sectionByType = new Map<string, ProposalDocxSection>(
    input.sections.map((section) => [section.section_type, section]),
  );
  const children: Paragraph[] = [
    new Paragraph({
      text: input.proposal.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: input.org?.name ? `Prepared by ${input.org.name}` : "Prepared draft",
          italics: true,
        }),
      ],
      spacing: { after: 360 },
    }),
    new Paragraph({ text: "Submission Snapshot", heading: HeadingLevel.HEADING_1 }),
    bullet(`Status: ${input.proposal.status}`),
    bullet(`Draft created: ${fmtDate(input.proposal.created_at)}`),
    bullet(
      `Due date: ${fmtDate(input.proposal.due_date ?? input.opportunity?.deadline ?? null)}`,
    ),
    bullet(`Opportunity: ${input.opportunity?.title ?? input.proposal.title}`),
    bullet(`Agency/Funder: ${input.opportunity?.agency ?? "Not specified"}`),
    bullet(
      `Funding range: ${fmtAmount(
        input.opportunity?.amount_min ?? null,
        input.opportunity?.amount_max ?? null,
      )}`,
    ),
    ...(input.opportunity?.url ? [bullet(`Source link: ${input.opportunity.url}`)] : []),
  ];

  if (input.opportunity?.brief) {
    children.push(
      new Paragraph({
        text: "Opportunity Brief",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 180 },
      }),
      ...paragraphsFromText(input.opportunity.brief),
    );
  }

  for (const type of SECTION_TYPES) {
    const section = sectionByType.get(type);
    children.push(
      new Paragraph({
        text: SECTION_SPECS[type as SectionType].label,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 180 },
      }),
      ...paragraphsFromText(section?.content),
    );
  }

  children.push(...renderCompliance(input.checks));

  const doc = new Document({
    creator: "Perpetual Core RFP Engine",
    title: input.proposal.title,
    description: "RFP submission draft exported from Perpetual Core RFP Engine.",
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
