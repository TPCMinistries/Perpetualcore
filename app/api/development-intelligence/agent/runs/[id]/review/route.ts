import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { developmentResourceIdSchema } from "@/lib/development-intelligence/profile-schemas";
import { humanReviewSchema } from "@/lib/development-intelligence/schemas";
import {
  AgenticStoreError,
  getAgentRunDetail,
  reviewAgentRun,
} from "@/lib/development-intelligence/agentic/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(
      req,
      rateLimiters.strict,
      identity.userId
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await context.params;
    const runId = developmentResourceIdSchema.parse(id);
    const review = humanReviewSchema.parse(await req.json());
    await reviewAgentRun(identity, runId, review);
    const run = await getAgentRunDetail(identity, runId);
    return NextResponse.json({ success: true, run });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid agent run review", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof AgenticStoreError) {
      return NextResponse.json(
        {
          error:
            error.status === 404
              ? "Agent run not found"
              : error.status === 409
                ? "Agent run is no longer pending review"
                : "Unable to save agent run review",
        },
        { status: error.status }
      );
    }
    console.error("Development Intelligence agent run review error:", error);
    return NextResponse.json(
      { error: "Unable to save agent run review" },
      { status: 500 }
    );
  }
}
