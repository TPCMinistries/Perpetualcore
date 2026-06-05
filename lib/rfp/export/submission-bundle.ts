import JSZip from "jszip";
import { SECTION_SPECS, SECTION_TYPES, type SectionType } from "@/lib/rfp/draft/sections";
import type {
  BidNoBidArtifact,
  ComplianceMatrixArtifact,
  PacketChecklistArtifact,
} from "@/lib/rfp/compliance/types";
import type { SubmitReadinessGate } from "@/lib/rfp/submission/readiness-gate";
import type { SubmissionTaskRow } from "@/lib/rfp/submission/tasks";
import { buildProposalDocxBuffer } from "@/lib/rfp/export/proposal-docx";
import { complianceCsvDocument } from "@/lib/rfp/export/compliance-csv";
import { packetCsvDocument } from "@/lib/rfp/export/packet-csv";
import {
  buildSubmissionManifestRows,
  SUBMISSION_MANIFEST_HEADER,
} from "@/lib/rfp/export/submission-manifest";
import { auditTrailCsvDocument, type RfpAuditTrailRow } from "@/lib/rfp/export/audit-trail-csv";
import { csvDocument, exportFilename } from "@/lib/rfp/export/csv";

export interface BundleProposal {
  id: string;
  org_id: string;
  title: string;
  status: string;
  due_date: string | null;
  opp_id: string | null;
  created_at: string;
}

export interface BundleOrg {
  name: string;
}

export interface BundleOpportunity {
  title: string;
  agency: string | null;
  brief: string | null;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  url: string | null;
}

export interface BundleSection {
  section_type: string;
  content: string | null;
}

export interface BundleComplianceCheck {
  check_type: string;
  details_json: unknown;
}

export interface SubmissionBundleInput {
  proposal: BundleProposal;
  org: BundleOrg | null;
  opportunity: BundleOpportunity | null;
  sections: BundleSection[];
  checks: BundleComplianceCheck[];
  bidNoBid: BidNoBidArtifact | null;
  complianceMatrix: ComplianceMatrixArtifact | null;
  packetChecklist: PacketChecklistArtifact | null;
  tasks: SubmissionTaskRow[];
  auditRows: RfpAuditTrailRow[];
  readiness: {
    generatedAt: string;
    gate: SubmitReadinessGate;
  };
  generatedAt?: string;
}

export function submissionBundleFilename(input: string): string {
  return exportFilename(input, "submission-bundle").replace(/\.csv$/, ".zip");
}

function missingArtifactNote(name: string): string {
  return [
    `${name} has not been generated yet.`,
    "",
    "Run Capture readiness from the proposal workroom, then download the bundle again.",
  ].join("\n");
}

export async function buildSubmissionBundleZip(input: SubmissionBundleInput): Promise<Buffer> {
  const sectionsByType = new Map(
    input.sections.map((section) => [section.section_type, section]),
  );
  const manifestSections = SECTION_TYPES.map((type) => ({
    section_type: type,
    label: SECTION_SPECS[type as SectionType].label,
    content: sectionsByType.get(type)?.content ?? null,
  }));

  const zip = new JSZip();
  zip.file(
    "README.txt",
    [
      "Perpetual Core RFP Engine submission bundle",
      `Proposal: ${input.proposal.title}`,
      `Status: ${input.proposal.status}`,
      `Generated: ${input.generatedAt ?? new Date().toISOString()}`,
      `Readiness: ${input.readiness.gate.label} (${input.readiness.gate.score})`,
      "",
      "This bundle contains the proposal draft, submission manifest, readiness gate JSON, audit trail, and generated compliance/packet exports when available.",
    ].join("\n"),
  );

  const docx = await buildProposalDocxBuffer({
    proposal: input.proposal,
    org: input.org,
    opportunity: input.opportunity,
    sections: input.sections,
    checks: input.checks,
  });
  zip.file("01-proposal-draft.docx", docx);

  const manifestRows = buildSubmissionManifestRows({
    proposal: input.proposal,
    opportunity: input.opportunity
      ? {
          title: input.opportunity.title,
          agency: input.opportunity.agency,
          url: input.opportunity.url,
        }
      : null,
    bidNoBid: input.bidNoBid,
    complianceMatrix: input.complianceMatrix,
    packetChecklist: input.packetChecklist,
    sections: manifestSections,
    tasks: input.tasks,
  });
  zip.file(
    "02-submission-manifest.csv",
    csvDocument([[...SUBMISSION_MANIFEST_HEADER], ...manifestRows]),
  );

  if (input.complianceMatrix) {
    zip.file("03-compliance-matrix.csv", complianceCsvDocument(input.complianceMatrix));
  } else {
    zip.file("03-compliance-matrix-missing.txt", missingArtifactNote("Compliance matrix"));
  }

  if (input.packetChecklist) {
    zip.file("04-submission-packet.csv", packetCsvDocument(input.packetChecklist));
  } else {
    zip.file("04-submission-packet-missing.txt", missingArtifactNote("Packet checklist"));
  }

  zip.file(
    "05-submit-readiness.json",
    JSON.stringify(
      {
        proposal_id: input.proposal.id,
        proposal_status: input.proposal.status,
        can_submit: input.readiness.gate.status === "ready",
        enforced_on_status: "submitted",
        generated_at: input.readiness.generatedAt,
        gate: input.readiness.gate,
      },
      null,
      2,
    ),
  );
  zip.file("06-audit-trail.csv", auditTrailCsvDocument(input.auditRows));

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
}
