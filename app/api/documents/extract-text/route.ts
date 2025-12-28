import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Supported file types for text extraction
const SUPPORTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

/**
 * POST /api/documents/extract-text
 * Extract text content from uploaded documents (PDF, DOCX, TXT)
 * for processing by AI decision extraction
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    const isValidType =
      SUPPORTED_TYPES.includes(file.type) ||
      [".txt", ".pdf", ".docx", ".doc"].includes(fileExt);

    if (!isValidType) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, Word, or text files." },
        { status: 400 }
      );
    }

    let extractedText = "";

    // Get file content as buffer for all file types
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Handle text files directly
    if (file.type === "text/plain" || fileExt === ".txt") {
      try {
        extractedText = buffer.toString("utf-8");
      } catch (textError) {
        console.error("Text file parsing error:", textError);
        return NextResponse.json(
          { error: "Failed to read text file." },
          { status: 400 }
        );
      }
    }
    // Handle PDF files
    else if (file.type === "application/pdf" || fileExt === ".pdf") {
      try {
        // Use pdf-parse for PDF text extraction
        const pdfParse = await import("pdf-parse");
        const pdfData = await pdfParse.default(buffer);
        extractedText = pdfData.text || "";
      } catch (pdfError) {
        console.error("PDF parsing error:", pdfError);
        return NextResponse.json(
          { error: "Failed to parse PDF. The file may be corrupted or password-protected." },
          { status: 400 }
        );
      }
    }
    // Handle DOCX files
    else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileExt === ".docx"
    ) {
      try {
        // Use mammoth for DOCX text extraction
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value || "";
      } catch (docxError) {
        console.error("DOCX parsing error:", docxError);
        return NextResponse.json(
          { error: "Failed to parse Word document." },
          { status: 400 }
        );
      }
    }
    // Handle DOC files (older Word format)
    else if (file.type === "application/msword" || fileExt === ".doc") {
      return NextResponse.json(
        { error: "Legacy .doc format not supported. Please convert to .docx" },
        { status: 400 }
      );
    }
    // Unknown type that passed validation - try as text
    else {
      try {
        extractedText = buffer.toString("utf-8");
      } catch {
        return NextResponse.json(
          { error: "Could not extract text from this file type." },
          { status: 400 }
        );
      }
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!extractedText) {
      return NextResponse.json(
        { error: "No text content found in the document." },
        { status: 400 }
      );
    }

    // Truncate if too long (limit to ~50k chars for AI processing)
    const maxLength = 50000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength) + "\n\n[Content truncated due to length...]";
    }

    return NextResponse.json({
      text: extractedText,
      filename: file.name,
      size: file.size,
      charCount: extractedText.length,
    });
  } catch (error) {
    console.error("Document text extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract text from document" },
      { status: 500 }
    );
  }
}
