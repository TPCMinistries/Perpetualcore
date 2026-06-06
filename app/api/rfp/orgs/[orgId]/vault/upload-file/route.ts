/**
 * POST /api/rfp/orgs/[orgId]/vault/upload-file
 *
 * Multipart variant of /vault/upload — accepts a PDF or DOCX file via
 * FormData, extracts text, and delegates to the existing chunk/embed/
 * insert pipeline. Plaintext-paste flow at /vault/upload is untouched.
 *
 * FormData fields:
 *   - file: File (application/pdf or
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document)
 *   - doc_title: string (1-200 chars)
 *   - doc_type: one of VAULT_DOC_TYPES
 *
 * Auth + RLS mirror the JSON sibling: createClient for the membership
 * check, then uploadDocument runs through the admin client.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  uploadDocument,
  VAULT_DOC_TYPES,
  MIN_DOC_BODY_CHARS,
  MAX_DOC_BODY_CHARS,
} from "@/lib/rfp/vault/upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB hard ceiling

const FieldsSchema = z.object({
  doc_title: z.string().min(1).max(200),
  doc_type: z.enum(VAULT_DOC_TYPES as unknown as [string, ...string[]]),
});

const PDF_MIME = "application/pdf";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.type === PDF_MIME || file.name.toLowerCase().endsWith(".pdf")) {
    // pdf-parse default export is the parse function (callable as default()).
    // Dynamic import keeps it out of the Edge bundle.
    const mod = await import("pdf-parse");
    type PdfParseFn = (data: Buffer) => Promise<{ text: string }>;
    const parse: PdfParseFn =
      (mod as unknown as { default?: PdfParseFn }).default ??
      (mod as unknown as PdfParseFn);
    const result = await parse(buffer);
    return result.text ?? "";
  }

  if (
    file.type === DOCX_MIME ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? "";
  }

  throw new Error(
    `unsupported_file_type:${file.type || "unknown"}:${file.name}`,
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orgId: string }> },
): Promise<NextResponse> {
  const { orgId } = await context.params;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form_data" }, { status: 400 });
  }

  const file = form.get("file");
  const docTitle = form.get("doc_title");
  const docType = form.get("doc_type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      {
        error: "file_too_large",
        detail: `Max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB`,
      },
      { status: 413 },
    );
  }

  let parsed: z.infer<typeof FieldsSchema>;
  try {
    parsed = FieldsSchema.parse({
      doc_title: typeof docTitle === "string" ? docTitle : "",
      doc_type: typeof docType === "string" ? docType : "",
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 200) : "schema";
    return NextResponse.json({ error: "invalid_fields", detail }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: membership, error: memErr } = await supabase
    .from("rfp_user_orgs")
    .select("role")
    .eq("org_id", orgId)
    .maybeSingle();
  if (memErr || !membership) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!["owner", "writer"].includes(membership.role)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let text: string;
  try {
    text = await extractTextFromFile(file);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "extract_failed";
    return NextResponse.json(
      { error: "extract_failed", detail: msg.slice(0, 200) },
      { status: 422 },
    );
  }

  // Normalize whitespace — PDF extracts arrive with stray form
  // feeds, broken-across-line words, and non-breaking spaces. Convert
  // non-breaking spaces (\u00A0) to regular spaces first, then collapse
  // any run of whitespace into a single space.
  const cleaned = text
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length < MIN_DOC_BODY_CHARS) {
    return NextResponse.json(
      {
        error: "too_short_after_extract",
        detail: `Extracted ${cleaned.length} chars; need >= ${MIN_DOC_BODY_CHARS}. Try a longer doc or paste the text directly.`,
      },
      { status: 422 },
    );
  }
  if (cleaned.length > MAX_DOC_BODY_CHARS) {
    return NextResponse.json(
      {
        error: "too_long_after_extract",
        detail: `Extracted ${cleaned.length} chars; max ${MAX_DOC_BODY_CHARS}. Split the doc into sections and upload separately.`,
      },
      { status: 422 },
    );
  }

  try {
    const result = await uploadDocument({
      orgId,
      docTitle: parsed.doc_title,
      docType: parsed.doc_type as (typeof VAULT_DOC_TYPES)[number],
      body: cleaned,
    });
    return NextResponse.json({
      ...result,
      extracted_chars: cleaned.length,
      source_file_name: file.name,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: "upload_failed", detail: msg.slice(0, 200) },
      { status: 500 },
    );
  }
}
