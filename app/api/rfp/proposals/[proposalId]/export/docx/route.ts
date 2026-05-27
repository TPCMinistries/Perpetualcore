import { NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SECTION_SPECS, SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ProposalRow {
  id: string;
  org_id: string;
  title: string;
  status: string;
  due_date: string | null;
  opp_id: string | null;
  created_at: string;
}

interface SectionRow {
  section_type: string;
  content: string | null;
  version: number;
}

interface OrgRow {
  name: string;
}

interface OppRow {
  title: string;
  agency: string | null;
  brief: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  url: string | null;
}

interface ComplianceCheckRow {
  check_type: string;
  details_json: unknown;
  created_at: string;
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

function filename(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "proposal"}-submission-draft.docx`;
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

function renderCompliance(checks: ComplianceCheckRow[]): Paragraph[] {
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

export async function GET(
  _req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<Response> {
  const { proposalId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, org_id, title, status, due_date, opp_id, created_at")
    .eq("id", proposalId)
    .maybeSingle<ProposalRow>();
  if (!proposal) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (!membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const [{ data: org }, { data: sections }, { data: checks }] = await Promise.all([
    admin.from("rfp_orgs").select("name").eq("id", proposal.org_id).maybeSingle<OrgRow>(),
    admin
      .from("rfp_proposal_sections")
      .select("section_type, content, version")
      .eq("proposal_id", proposalId)
      .returns<SectionRow[]>(),
    admin
      .from("rfp_compliance_checks")
      .select("check_type, details_json, created_at")
      .eq("proposal_id", proposalId)
      .in("check_type", [
        "bid_no_bid_v1",
        "compliance_matrix_v1",
        "packet_checklist_v1",
      ])
      .order("created_at", { ascending: false })
      .returns<ComplianceCheckRow[]>(),
  ]);

  let opp: OppRow | null = null;
  if (proposal.opp_id) {
    const { data } = await admin
      .from("rfp_opportunities")
      .select("title, agency, brief, amount_min, amount_max, deadline, url")
      .eq("id", proposal.opp_id)
      .maybeSingle<OppRow>();
    opp = data ?? null;
  }

  const sectionByType = new Map<string, SectionRow>(
    (sections ?? []).map((section) => [section.section_type, section]),
  );

  const children: Paragraph[] = [
    new Paragraph({
      text: proposal.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: org?.name ? `Prepared by ${org.name}` : "Prepared draft",
          italics: true,
        }),
      ],
      spacing: { after: 360 },
    }),
    new Paragraph({ text: "Submission Snapshot", heading: HeadingLevel.HEADING_1 }),
    bullet(`Status: ${proposal.status}`),
    bullet(`Draft created: ${fmtDate(proposal.created_at)}`),
    bullet(`Due date: ${fmtDate(proposal.due_date ?? opp?.deadline ?? null)}`),
    bullet(`Opportunity: ${opp?.title ?? proposal.title}`),
    bullet(`Agency/Funder: ${opp?.agency ?? "Not specified"}`),
    bullet(`Funding range: ${fmtAmount(opp?.amount_min ?? null, opp?.amount_max ?? null)}`),
    ...(opp?.url ? [bullet(`Source link: ${opp.url}`)] : []),
  ];

  if (opp?.brief) {
    children.push(
      new Paragraph({
        text: "Opportunity Brief",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 360, after: 180 },
      }),
      ...paragraphsFromText(opp.brief),
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

  children.push(...renderCompliance(checks ?? []));

  const doc = new Document({
    creator: "Perpetual Core RFP Engine",
    title: proposal.title,
    description: "RFP submission draft exported from Perpetual Core RFP Engine.",
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="${filename(proposal.title)}"`,
      "cache-control": "no-store",
    },
  });
}
