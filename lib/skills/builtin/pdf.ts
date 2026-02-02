/**
 * PDF Processing Skill
 *
 * Extract text and analyze PDF documents.
 * Uses pdf-parse for extraction (no external API needed).
 */

import { Skill, ToolContext, ToolResult } from "../types";

// Note: In production, you'd use pdf-parse package
// For now, we'll use a fetch-based approach with external API

const PDF_EXTRACT_API = "https://api.pdf.co/v1";

function getPdfCoApiKey(): string | null {
  return process.env.PDF_CO_API_KEY || null;
}

async function extractText(
  params: { url?: string; base64?: string; pages?: string },
  context: ToolContext
): Promise<ToolResult> {
  const apiKey = getPdfCoApiKey();

  if (!apiKey) {
    // Fallback: Use basic extraction without API
    return extractTextBasic(params);
  }

  try {
    const body: any = {
      async: false,
      inline: true,
    };

    if (params.url) {
      body.url = params.url;
    } else if (params.base64) {
      body.file = params.base64;
    } else {
      return { success: false, error: "Either url or base64 is required" };
    }

    if (params.pages) {
      body.pages = params.pages;
    }

    const response = await fetch(`${PDF_EXTRACT_API}/pdf/convert/to/text`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to extract PDF text" };
    }

    const result = await response.json();

    if (result.error) {
      return { success: false, error: result.message || "PDF extraction failed" };
    }

    // Fetch the extracted text from the URL
    const textResponse = await fetch(result.url);
    const text = await textResponse.text();

    return {
      success: true,
      data: {
        text: text,
        pageCount: result.pageCount,
        charCount: text.length,
      },
      display: {
        type: "text",
        content: text.length > 1000 ? text.substring(0, 1000) + "..." : text,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function extractTextBasic(
  params: { url?: string; base64?: string; pages?: string }
): Promise<ToolResult> {
  // Basic text extraction without external API
  // This is a simplified version - in production, use pdf-parse package

  if (!params.url) {
    return {
      success: false,
      error: "URL-based extraction requires PDF_CO_API_KEY. Please provide a URL or configure the API key."
    };
  }

  try {
    // Try to fetch and do basic extraction
    const response = await fetch(params.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PerpetualCore/1.0)",
      },
    });

    if (!response.ok) {
      return { success: false, error: `Failed to fetch PDF: ${response.statusText}` };
    }

    const buffer = await response.arrayBuffer();

    // Very basic text extraction - looks for text streams in PDF
    // This is a fallback; real extraction needs pdf-parse
    const bytes = new Uint8Array(buffer);
    const text = extractTextFromPdfBytes(bytes);

    if (!text || text.length < 10) {
      return {
        success: true,
        data: {
          text: "",
          warning: "Could not extract text. PDF may be scanned or image-based. Configure PDF_CO_API_KEY for better extraction.",
        },
        display: {
          type: "text",
          content: "PDF appears to be scanned or image-based. Configure PDF_CO_API_KEY for OCR capability.",
        },
      };
    }

    return {
      success: true,
      data: {
        text: text,
        charCount: text.length,
        method: "basic",
      },
      display: {
        type: "text",
        content: text.length > 1000 ? text.substring(0, 1000) + "..." : text,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function extractTextFromPdfBytes(bytes: Uint8Array): string {
  // Very basic PDF text extraction
  // Looks for text between BT and ET markers
  const decoder = new TextDecoder("latin1");
  const content = decoder.decode(bytes);

  const textParts: string[] = [];

  // Find text objects (between BT and ET)
  const textObjectRegex = /BT[\s\S]*?ET/g;
  let match;

  while ((match = textObjectRegex.exec(content)) !== null) {
    const textObject = match[0];

    // Extract text from Tj and TJ operators
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(textObject)) !== null) {
      textParts.push(tjMatch[1]);
    }

    // TJ arrays
    const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
    let tjArrayMatch;
    while ((tjArrayMatch = tjArrayRegex.exec(textObject)) !== null) {
      const arrayContent = tjArrayMatch[1];
      const stringRegex = /\(([^)]*)\)/g;
      let strMatch;
      while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
        textParts.push(strMatch[1]);
      }
    }
  }

  // Clean up the extracted text
  let text = textParts.join(" ");

  // Decode common PDF escape sequences
  text = text
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

async function extractMetadata(
  params: { url: string },
  context: ToolContext
): Promise<ToolResult> {
  try {
    const response = await fetch(params.url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PerpetualCore/1.0)",
      },
    });

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const lastModified = response.headers.get("last-modified");

    // Fetch first bytes to check PDF header
    const partialResponse = await fetch(params.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PerpetualCore/1.0)",
        Range: "bytes=0-1000",
      },
    });

    const partialBytes = await partialResponse.arrayBuffer();
    const decoder = new TextDecoder("latin1");
    const header = decoder.decode(partialBytes);

    // Check if it's a valid PDF
    const isPdf = header.startsWith("%PDF");
    const pdfVersion = isPdf ? header.match(/%PDF-(\d+\.\d+)/)?.[1] : null;

    // Try to extract basic metadata from header
    const titleMatch = header.match(/\/Title\s*\(([^)]+)\)/);
    const authorMatch = header.match(/\/Author\s*\(([^)]+)\)/);
    const creatorMatch = header.match(/\/Creator\s*\(([^)]+)\)/);

    const metadata = {
      url: params.url,
      isPdf,
      pdfVersion,
      contentType,
      sizeBytes: contentLength ? parseInt(contentLength) : null,
      sizeMB: contentLength ? (parseInt(contentLength) / 1024 / 1024).toFixed(2) : null,
      lastModified,
      title: titleMatch?.[1] || null,
      author: authorMatch?.[1] || null,
      creator: creatorMatch?.[1] || null,
    };

    return {
      success: true,
      data: metadata,
      display: {
        type: "card",
        content: {
          title: metadata.title || "PDF Document",
          description: `${metadata.sizeMB || "?"} MB | PDF ${metadata.pdfVersion || "?"}`,
          fields: [
            { label: "Author", value: metadata.author || "Unknown" },
            { label: "Created with", value: metadata.creator || "Unknown" },
            { label: "Last Modified", value: metadata.lastModified || "Unknown" },
          ],
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function summarizePdf(
  params: { url: string; maxLength?: number },
  context: ToolContext
): Promise<ToolResult> {
  // First extract the text
  const extractResult = await extractText({ url: params.url }, context);

  if (!extractResult.success) {
    return extractResult;
  }

  const text = extractResult.data?.text || "";

  if (text.length < 100) {
    return {
      success: false,
      error: "Could not extract enough text to summarize. PDF may be scanned or image-based.",
    };
  }

  // For now, return truncated text with note about AI summarization
  // In production, this would call an LLM to summarize
  const maxLength = params.maxLength || 500;
  const truncatedText = text.length > maxLength
    ? text.substring(0, maxLength) + "..."
    : text;

  return {
    success: true,
    data: {
      url: params.url,
      textLength: text.length,
      preview: truncatedText,
      note: "Full AI summarization available when integrated with chat context",
    },
    display: {
      type: "text",
      content: `**PDF Preview (${text.length} chars total):**\n\n${truncatedText}`,
    },
  };
}

export const pdfSkill: Skill = {
  id: "pdf",
  name: "PDF Processing",
  description: "Extract text and analyze PDF documents",
  version: "1.0.0",
  author: "Perpetual Core",

  category: "utility",
  tags: ["pdf", "document", "extract", "text"],

  icon: "📄",
  color: "#DC2626",

  tier: "free",
  isBuiltIn: true,

  // API key is optional - basic extraction works without it
  requiredEnvVars: [],

  tools: [
    {
      name: "extract_text",
      description: "Extract text content from a PDF document",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL of the PDF to extract text from",
          },
          pages: {
            type: "string",
            description: "Page range to extract (e.g., '1-5' or '1,3,5')",
          },
        },
        required: ["url"],
      },
      execute: extractText,
    },
    {
      name: "get_metadata",
      description: "Get metadata from a PDF (title, author, page count, etc.)",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL of the PDF",
          },
        },
        required: ["url"],
      },
      execute: extractMetadata,
    },
    {
      name: "summarize",
      description: "Extract and summarize PDF content",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL of the PDF to summarize",
          },
          maxLength: {
            type: "number",
            description: "Maximum length of summary (default 500 chars)",
          },
        },
        required: ["url"],
      },
      execute: summarizePdf,
    },
  ],

  systemPrompt: `You can process PDF documents. When users share PDFs:
- Use extract_text to get the full text content
- Use get_metadata for document info
- Use summarize for quick previews
For better extraction of scanned PDFs, PDF_CO_API_KEY can be configured.`,
};
