import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  agentRunReviewStatusSchema,
  agentRunStatusSchema,
} from "@/lib/development-intelligence/agentic/contracts";
import {
  getAgentRunSummary,
  listAgentRuns,
} from "@/lib/development-intelligence/agentic/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const runListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    status: agentRunStatusSchema.optional(),
    reviewStatus: agentRunReviewStatusSchema.optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    const identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const query = runListQuerySchema.parse({
      limit: req.nextUrl.searchParams.get("limit") || undefined,
      status: req.nextUrl.searchParams.get("status") || undefined,
      reviewStatus: req.nextUrl.searchParams.get("reviewStatus") || undefined,
    });
    const [runs, summary] = await Promise.all([
      listAgentRuns(identity, query),
      getAgentRunSummary(identity),
    ]);
    return NextResponse.json({ runs, summary });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid agent run query", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence agent run list error:", error);
    return NextResponse.json(
      { error: "Unable to load agent runs" },
      { status: 500 }
    );
  }
}
