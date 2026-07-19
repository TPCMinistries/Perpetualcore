import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import {
  analysisListQuerySchema,
  analysisRequestSchema,
} from "@/lib/development-intelligence/schemas";
import { analyzeDevelopmentTranscript } from "@/lib/development-intelligence/analyzer";
import type { AnalysisRun } from "@/lib/development-intelligence/analyzer";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  beginAnalysisSession,
  listAnalyses,
  markAnalysisSessionFailed,
  persistAnalysis,
} from "@/lib/development-intelligence/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  try {
    const identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = analysisListQuerySchema.parse({
      limit: req.nextUrl.searchParams.get("limit") || undefined,
      lens: req.nextUrl.searchParams.get("lens") || undefined,
      reviewStatus: req.nextUrl.searchParams.get("reviewStatus") || undefined,
    });

    const analyses = await listAnalyses(identity, query);
    return NextResponse.json({ analyses });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid query", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence list error:", error);
    return NextResponse.json(
      { error: "Unable to load development analyses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await checkRateLimit(
      req,
      rateLimiters.developmentAnalysis,
      identity.userId
    );
    if (rateLimitResponse) return rateLimitResponse;

    const input = analysisRequestSchema.parse(await req.json());
    const sessionId = await beginAnalysisSession(identity, input);
    let run: AnalysisRun;
    try {
      run = await analyzeDevelopmentTranscript(input);
    } catch (error) {
      await markAnalysisSessionFailed(identity, sessionId);
      throw error;
    }
    let analysisId: string;
    try {
      analysisId = await persistAnalysis(identity, sessionId, input, run);
    } catch (error) {
      await markAnalysisSessionFailed(identity, sessionId);
      throw error;
    }

    return NextResponse.json(
      {
        analysisId,
        analysis: run.output,
        rawTranscriptStored: false,
        humanReviewRequired: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid analysis request", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence analysis error:", error);
    const message =
      error instanceof Error && error.message.includes("hdi_")
        ? "Development Intelligence database migration has not been applied"
        : "Unable to complete development analysis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
