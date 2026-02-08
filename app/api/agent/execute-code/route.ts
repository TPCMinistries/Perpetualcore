/**
 * POST /api/agent/execute-code
 * Execute code in a sandboxed E2B environment.
 * Requires authentication. Supports Python, JavaScript, TypeScript, Bash, and R.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeCode } from "@/lib/execution";
import type { ExecutionLanguage } from "@/lib/execution/types";

/** Valid languages that can be executed */
const VALID_LANGUAGES: ExecutionLanguage[] = [
  "python",
  "javascript",
  "typescript",
  "bash",
  "r",
];

export async function POST(request: Request) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { language, code, timeout, stdin } = body;

    // Validate required fields
    if (!language || typeof language !== "string") {
      return NextResponse.json(
        { error: "Missing required field: language" },
        { status: 400 }
      );
    }

    if (!VALID_LANGUAGES.includes(language as ExecutionLanguage)) {
      return NextResponse.json(
        {
          error: `Invalid language: "${language}". Supported languages: ${VALID_LANGUAGES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Missing required field: code" },
        { status: 400 }
      );
    }

    if (code.trim().length === 0) {
      return NextResponse.json(
        { error: "Code cannot be empty" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    // Execute the code
    const result = await executeCode(
      {
        language: language as ExecutionLanguage,
        code,
        timeout: timeout ? Number(timeout) : undefined,
        stdin: stdin || undefined,
      },
      {
        userId: user.id,
        organizationId: profile?.organization_id || "",
        conversationId: body.conversationId || undefined,
      }
    );

    return NextResponse.json({
      success: result.status === "completed",
      result,
    });
  } catch (error: any) {
    console.error("[API] execute-code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
