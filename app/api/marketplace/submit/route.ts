import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitSkillForReview } from "@/lib/skills/marketplace/review-pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST - Submit a skill for marketplace security review
 *
 * Body: { skillId: string, manifest: Record<string, any> }
 * Auth required.
 * Runs automated security scan, creates submission record.
 *
 * Returns: { submissionId, status, scanResult }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { skillId, manifest } = body;

    // Validate required fields
    if (!skillId || typeof skillId !== "string") {
      return NextResponse.json(
        { error: "skillId is required" },
        { status: 400 }
      );
    }

    if (!manifest || typeof manifest !== "object") {
      return NextResponse.json(
        { error: "manifest is required and must be an object" },
        { status: 400 }
      );
    }

    // Verify the skill/item exists and belongs to the user
    const { data: item } = await supabase
      .from("marketplace_items")
      .select("id, creator_id, status")
      .eq("id", skillId)
      .single();

    if (!item) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    if (item.creator_id !== user.id) {
      return NextResponse.json(
        { error: "You can only submit your own skills for review" },
        { status: 403 }
      );
    }

    // Check for existing pending submission
    const { data: existingSubmission } = await supabase
      .from("skill_submissions")
      .select("id, status")
      .eq("skill_id", skillId)
      .eq("submitter_id", user.id)
      .in("status", ["pending_review"])
      .maybeSingle();

    if (existingSubmission) {
      return NextResponse.json(
        {
          error:
            "This skill already has a pending submission. Please wait for the current review to complete.",
          existingSubmissionId: existingSubmission.id,
        },
        { status: 409 }
      );
    }

    // Run security scan and create submission
    const { submissionId, scanResult } = await submitSkillForReview(
      user.id,
      skillId,
      manifest
    );

    // Determine human-readable status
    const status = scanResult.passed ? "pending_review" : "auto_rejected";
    const statusMessage = scanResult.passed
      ? "Your skill passed automated security checks and is now pending human review. This typically takes 24-48 hours."
      : `Your skill did not pass automated security checks (score: ${scanResult.score}/100). Please address the issues and resubmit.`;

    return NextResponse.json({
      submissionId,
      status,
      statusMessage,
      scanResult: {
        passed: scanResult.passed,
        score: scanResult.score,
        checks: scanResult.checks.map((c) => ({
          name: c.name,
          passed: c.passed,
          severity: c.severity,
          message: c.message,
        })),
        recommendations: scanResult.recommendations,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to submit skill for review";
    console.error("Skill submission error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
