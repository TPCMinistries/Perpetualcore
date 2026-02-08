/**
 * POST /api/agent/browse
 * Perform browser automation actions via Browserless.io.
 * Requires authentication. Supports screenshot, scrape, pdf, click, navigate, and extract.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeBrowserAction } from "@/lib/browser";
import type { BrowserActionType } from "@/lib/browser/types";

/** Valid browser action types */
const VALID_ACTIONS: BrowserActionType[] = [
  "screenshot",
  "scrape",
  "pdf",
  "click",
  "navigate",
  "extract",
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

    const { action, url, selector, waitFor, javascript } = body;

    // Validate required fields
    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action as BrowserActionType)) {
      return NextResponse.json(
        {
          error: `Invalid action: "${action}". Supported actions: ${VALID_ACTIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 }
      );
    }

    // Validate action-specific requirements
    if (action === "click" && !selector) {
      return NextResponse.json(
        { error: "Selector is required for the click action" },
        { status: 400 }
      );
    }

    if (action === "extract" && !javascript) {
      return NextResponse.json(
        { error: "JavaScript code is required for the extract action" },
        { status: 400 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    // Execute the browser action
    const result = await executeBrowserAction(
      {
        action: action as BrowserActionType,
        url,
        selector: selector || undefined,
        waitFor: waitFor || undefined,
        javascript: javascript || undefined,
      },
      {
        userId: user.id,
        organizationId: profile?.organization_id || "",
        conversationId: body.conversationId || undefined,
      }
    );

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (error: any) {
    console.error("[API] browse error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
