import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { agenticPlanRequestSchema } from "@/lib/development-intelligence/agentic/contracts";
import { generateAgenticPlan } from "@/lib/development-intelligence/agentic/planner";
import {
  createAgentRun,
  getAgentPlaybook,
} from "@/lib/development-intelligence/agentic/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

    const input = agenticPlanRequestSchema.parse(await req.json());
    if (input.playbookId) {
      const playbook = await getAgentPlaybook(identity, input.playbookId);
      if (!playbook) {
        return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
      }
    }

    const planned = await generateAgenticPlan(input);
    const runId = await createAgentRun(identity, input, planned);
    return NextResponse.json(
      {
        runId,
        plan: planned.plan,
        provenance: {
          model: planned.model,
          responseId: planned.responseId,
          durationMs: planned.durationMs,
        },
        rawTranscriptStored: false,
        humanReviewRequired: true,
        autonomousActionsEnabled: false,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid agentic planning request", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence agent planning error:", error);
    return NextResponse.json(
      { error: "Unable to generate an agentic analysis plan" },
      { status: 500 }
    );
  }
}
