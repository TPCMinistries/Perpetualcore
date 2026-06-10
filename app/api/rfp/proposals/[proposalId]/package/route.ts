import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { fetchUrlContent } from "@/lib/rfp/import/fetch-url";
import { extractPackageRequirements } from "@/lib/rfp/package/extract";
import { extractRubricCriteria } from "@/lib/rfp/rubric/extract";
import {
  guardedLLMCall,
  budgetExceededResponse,
  BudgetExceededError,
} from "@/lib/rfp/ai/guardrail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MIN_TEXT_CHARS = 200;
const MAX_TEXT_CHARS = 180_000;
const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const ParamsSchema = z.object({
  proposalId: z.string().uuid(),
});

const FieldsSchema = z.object({
  mode: z.enum(["upload", "url", "paste"]),
  title: z.string().min(1).max(220),
  source_url: z.string().url().optional().or(z.literal("")),
  body: z.string().optional(),
  solicitation_mode: z.enum(["true", "false"]).optional(),
  force_re_extract: z.enum(["true", "false"]).optional(),
});

interface ProposalRow {
  id: string;
  org_id: string;
  opp_id: string | null;
  due_date: string | null;
}

interface PackageDocRow {
  id: string;
  title: string;
  source_type: "upload" | "url" | "paste";
  source_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  extracted_chars: number;
  extracted_json: unknown;
  created_at: string;
}

function normalizeText(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf")) {
    const mod = await import("pdf-parse");
    type PdfParseFn = (data: Buffer) => Promise<{ text: string }>;
    const parse: PdfParseFn =
      (mod as unknown as { default?: PdfParseFn }).default ??
      (mod as unknown as PdfParseFn);
    const result = await parse(buffer);
    return result.text ?? "";
  }

  if (file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }

  if (file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt")) {
    return buffer.toString("utf8");
  }

  throw new Error(`unsupported_file_type:${file.type || "unknown"}:${file.name}`);
}

async function requireProposalAccess(proposalId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }

  const { data: proposal } = await supabase
    .from("rfp_proposals")
    .select("id, org_id, opp_id, due_date")
    .eq("id", proposalId)
    .maybeSingle<ProposalRow>();
  if (!proposal) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }

  const { data: membership } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", proposal.org_id)
    .eq("user_id", user.id)
    .maybeSingle<{ role: string }>();
  if (!membership) {
    return { error: NextResponse.json({ error: "not_found" }, { status: 404 }) };
  }

  return { user, proposal, role: membership.role };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ proposalId: string }> },
): Promise<Response> {
  const parsed = ParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_proposal_id" }, { status: 400 });
  }
  const access = await requireProposalAccess(parsed.data.proposalId);
  if ("error" in access) return access.error;

  const { data, error } = await createAdminClient()
    .from("rfp_package_documents")
    .select("id, title, source_type, source_url, file_name, mime_type, extracted_chars, extracted_json, created_at")
    .eq("proposal_id", parsed.data.proposalId)
    .order("created_at", { ascending: false })
    .returns<PackageDocRow[]>();
  if (error) {
    return NextResponse.json(
      { error: "packages_load_failed", detail: error.message.slice(0, 200) },
      { status: 500 },
    );
  }

  return NextResponse.json({ packages: data ?? [] });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ proposalId: string }> },
): Promise<Response> {
  const parsedParams = ParamsSchema.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json({ error: "invalid_proposal_id" }, { status: 400 });
  }
  const proposalId = parsedParams.data.proposalId;
  const access = await requireProposalAccess(proposalId);
  if ("error" in access) return access.error;
  if (!["owner", "writer", "reviewer"].includes(access.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = form.get("file");
  const parsedFields = FieldsSchema.safeParse({
    mode: form.get("mode"),
    title: form.get("title"),
    source_url: form.get("source_url") ?? "",
    body: form.get("body") ?? "",
  });
  if (!parsedFields.success) {
    return NextResponse.json(
      { error: "invalid_fields", detail: parsedFields.error.message.slice(0, 200) },
      { status: 400 },
    );
  }

  const fields = parsedFields.data;
  let rawText = "";
  let sourceUrl: string | null = fields.source_url || null;
  let fileName: string | null = null;
  let mimeType: string | null = null;

  try {
    if (fields.mode === "upload") {
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "missing_file" }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "file_too_large", detail: "Max file size is 20MB." },
          { status: 413 },
        );
      }
      rawText = await extractTextFromFile(file);
      fileName = file.name;
      mimeType = file.type || null;
    } else if (fields.mode === "url") {
      if (!fields.source_url) {
        return NextResponse.json({ error: "missing_source_url" }, { status: 400 });
      }
      const fetched = await fetchUrlContent(fields.source_url);
      rawText = fetched.text;
      sourceUrl = fetched.finalUrl;
      mimeType = fetched.contentType;
    } else {
      rawText = fields.body ?? "";
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 240) : "extract_failed";
    return NextResponse.json({ error: "extract_failed", detail }, { status: 422 });
  }

  const text = normalizeText(rawText);
  if (text.length < MIN_TEXT_CHARS) {
    return NextResponse.json(
      { error: "too_short_after_extract", detail: `Extracted ${text.length} chars; need at least ${MIN_TEXT_CHARS}.` },
      { status: 422 },
    );
  }
  if (text.length > MAX_TEXT_CHARS) {
    return NextResponse.json(
      { error: "too_long_after_extract", detail: `Extracted ${text.length} chars; max ${MAX_TEXT_CHARS}.` },
      { status: 422 },
    );
  }

  const extraction = extractPackageRequirements({
    title: fields.title,
    sourceType: fields.mode,
    sourceUrl,
    text,
  });

  const admin = createAdminClient();
  const { data: packageDoc, error: insertError } = await admin
    .from("rfp_package_documents")
    .insert({
      proposal_id: proposalId,
      org_id: access.proposal.org_id,
      opp_id: access.proposal.opp_id,
      title: fields.title,
      source_type: fields.mode,
      source_url: sourceUrl,
      file_name: fileName,
      mime_type: mimeType,
      extracted_text: text,
      extracted_json: extraction,
      extracted_chars: text.length,
      uploaded_by: access.user.id,
    })
    .select("id")
    .single<{ id: string }>();
  if (insertError || !packageDoc) {
    return NextResponse.json(
      { error: "package_insert_failed", detail: insertError?.message.slice(0, 200) },
      { status: 500 },
    );
  }

  await admin
    .from("rfp_compliance_checks")
    .delete()
    .eq("proposal_id", proposalId)
    .eq("check_type", "package_requirements_v1");

  const { error: checkError } = await admin.from("rfp_compliance_checks").insert({
    proposal_id: proposalId,
    check_type: "package_requirements_v1",
    status: extraction.risks.length > 0 ? "warn" : "pass",
    details_json: extraction,
  });
  if (checkError) {
    return NextResponse.json(
      { error: "package_check_insert_failed", detail: checkError.message.slice(0, 200) },
      { status: 500 },
    );
  }

  // ── Rubric extraction (REVIEW-01) ─────────────────────────────────────────
  // Runs only when solicitation_mode=true. Package upload itself always succeeds;
  // rubric extraction failure is captured in rubric_skipped_reason, not a 5xx.

  type RubricCriteriaRow = {
    id: string;
    opp_id: string;
    package_doc_id: string | null;
    section_ref: string;
    criterion_text: string;
    max_points: number | null;
    weight: number | null;
    is_inferred: boolean;
    extracted_by: string;
    extracted_at: string;
  };

  let rubric_criteria: RubricCriteriaRow[] = [];
  let rubric_skipped_reason: string | undefined;

  if (fields.solicitation_mode === "true") {
    const oppId = access.proposal.opp_id;

    if (!oppId) {
      // Criteria are keyed per opp — cannot extract without an opp link
      rubric_skipped_reason = "no_opportunity_linked";
    } else {
      const forceRe = fields.force_re_extract === "true";

      // Cache check: if rows already exist and not forced, return cached
      if (!forceRe) {
        const { data: cachedRows } = await admin
          .from("rfp_rubric_criteria")
          .select("id, opp_id, package_doc_id, section_ref, criterion_text, max_points, weight, is_inferred, extracted_by, extracted_at")
          .eq("opp_id", oppId)
          .returns<RubricCriteriaRow[]>();

        if (cachedRows && cachedRows.length > 0) {
          rubric_criteria = cachedRows;
          // Return cached — no LLM call needed (Pitfall 6)
        }
      }

      // Only call the LLM if we don't have cached criteria (or force_re_extract)
      if (rubric_criteria.length === 0 && !rubric_skipped_reason) {
        // Scoring criteria from package extraction are hints only — not authoritative
        const scoringHints = Array.isArray(
          (extraction as { scoring_criteria?: string[] }).scoring_criteria
        )
          ? (extraction as { scoring_criteria: string[] }).scoring_criteria
          : undefined;

        try {
          let capturedResult: Awaited<ReturnType<typeof extractRubricCriteria>> = null;

          await guardedLLMCall(access.proposal.org_id, async () => {
            const result = await extractRubricCriteria(text, {
              scoring_criteria: scoringHints,
            });
            capturedResult = result;
            if (!result) {
              // Return a zero-cost meta so guardedLLMCall records the attempt
              return {
                agent: "rubric_extract_v1",
                model: "none",
                tokensIn: 0,
                tokensOut: 0,
                costUsd: 0,
                sessionId: undefined,
                proposalId,
              };
            }
            return {
              agent: "rubric_extract_v1",
              model: result.model,
              tokensIn: result.tokens_in,
              tokensOut: result.tokens_out,
              costUsd: result.cost_usd,
              sessionId: result.session_id,
              proposalId,
            };
          });

          if (!capturedResult) {
            rubric_skipped_reason = "extraction_failed";
          } else {
            const extractionResult = capturedResult;

            // If force re-extract, delete existing rows first
            if (forceRe) {
              await admin
                .from("rfp_rubric_criteria")
                .delete()
                .eq("opp_id", oppId);
            }

            // De-dupe section_refs before insert (enforce UNIQUE constraint client-side)
            const seenSectionRefs = new Map<string, number>();
            const deduped = extractionResult.criteria.map((c) => {
              const count = seenSectionRefs.get(c.section_ref) ?? 0;
              seenSectionRefs.set(c.section_ref, count + 1);
              return {
                ...c,
                section_ref: count === 0 ? c.section_ref : `${c.section_ref} (${count + 1})`,
              };
            });

            if (deduped.length > 0) {
              const rowsToInsert = deduped.map((c) => ({
                opp_id: oppId,
                package_doc_id: packageDoc.id,
                section_ref: c.section_ref,
                criterion_text: c.criterion_text,
                max_points: c.max_points ?? null,
                weight: c.weight ?? null,
                is_inferred: c.is_inferred,
                extracted_by: extractionResult.model,
              }));

              const { data: insertedRows, error: rubricInsertError } = await admin
                .from("rfp_rubric_criteria")
                .insert(rowsToInsert)
                .select("id, opp_id, package_doc_id, section_ref, criterion_text, max_points, weight, is_inferred, extracted_by, extracted_at")
                .returns<RubricCriteriaRow[]>();

              if (rubricInsertError) {
                console.error(
                  "[package/route] rubric_criteria insert failed (non-fatal):",
                  rubricInsertError.message,
                );
                rubric_skipped_reason = "insert_failed";
              } else {
                rubric_criteria = insertedRows ?? [];
              }
            }
            // If 0 criteria extracted — that's valid (document had no eval criteria)
          }
        } catch (err) {
          if (err instanceof BudgetExceededError) {
            // Budget exceeded: package upload succeeds, rubric extraction skipped
            rubric_skipped_reason = "budget_exceeded";
          } else {
            const msg = err instanceof Error ? err.message : "unknown";
            console.error("[package/route] rubric extraction error (non-fatal):", msg);
            rubric_skipped_reason = "extraction_failed";
          }
        }
      }
    }
  }

  const response: Record<string, unknown> = {
    package_id: packageDoc.id,
    extraction,
    extracted_chars: text.length,
  };

  if (fields.solicitation_mode === "true") {
    response.rubric_criteria = rubric_criteria;
    if (rubric_skipped_reason) {
      response.rubric_skipped_reason = rubric_skipped_reason;
    }
  }

  return NextResponse.json(response);
}
