import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  agenticAnalyzeRequestSchema,
  type AgenticPlan,
  type AgenticPlanRequest,
} from "@/lib/development-intelligence/agentic/contracts";
import {
  orchestrateAgenticAnalysis,
  type AgenticOrchestrationRun,
} from "@/lib/development-intelligence/agentic/orchestrator";
import {
  AgenticStoreError,
  completeAgentRun,
  createAgentRun,
  failAgentRun,
  getAgentPlaybook,
  getAgentRun,
  startAgentRun,
} from "@/lib/development-intelligence/agentic/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(req: NextRequest) {
  let activeRunId: string | null = null;
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

    const input = agenticAnalyzeRequestSchema.parse(await req.json());
    let plan: AgenticPlan | undefined = input.plan;
    let goal = input.goal;
    let context = input.context || {};

    if (input.runId) {
      const storedRun = await getAgentRun(identity, input.runId);
      if (!storedRun) {
        return NextResponse.json({ error: "Agent run not found" }, { status: 404 });
      }
      if (storedRun.status !== "planned") {
        return NextResponse.json(
          { error: "Only a planned agent run can be analyzed" },
          { status: 409 }
        );
      }
      activeRunId = storedRun.id;
      plan = storedRun.plan;
      goal = storedRun.goal;
      context = storedRun.context;
    } else if (input.playbookId) {
      const playbook = await getAgentPlaybook(identity, input.playbookId);
      if (!playbook) {
        return NextResponse.json({ error: "Agent playbook not found" }, { status: 404 });
      }
      if (playbook.status !== "active") {
        return NextResponse.json(
          { error: "Activate this playbook before running it" },
          { status: 409 }
        );
      }
      plan = playbook.plan;
    }

    if (!plan) {
      return NextResponse.json(
        { error: "An inspectable analysis plan is required" },
        { status: 400 }
      );
    }

    if (!activeRunId) {
      const planRequest: AgenticPlanRequest = {
        goal,
        context,
        preferredSpecialists: [],
        requestedExclusions: [],
        ...(input.playbookId ? { playbookId: input.playbookId } : {}),
      };
      activeRunId = await createAgentRun(identity, planRequest, {
        plan,
        model: input.playbookId ? "saved-playbook" : "operator-provided-plan",
        responseId: input.playbookId || "operator-provided-plan",
        durationMs: 0,
      });
    }

    await startAgentRun(identity, activeRunId);
    let run: AgenticOrchestrationRun;
    try {
      run = await orchestrateAgenticAnalysis({ ...input, goal, context, plan });
      await completeAgentRun(
        identity,
        activeRunId,
        {
          synthesis: run.synthesis,
          specialistReports: run.specialistReports,
          failedSpecialists: run.failedSpecialists,
          trace: {
            completedSpecialists: run.specialistReports.map(
              (report) => report.specialist
            ),
            failedSpecialists: run.failedSpecialists,
            model: run.model,
            responseIds: run.responseIds,
            promptVersion: run.promptVersion,
            schemaVersion: run.schemaVersion,
          },
        },
        run.durationMs
      );
    } catch (error) {
      try {
        await failAgentRun(identity, activeRunId);
      } catch (statusError) {
        console.error("Unable to mark HDI agent run failed:", statusError);
      }
      throw error;
    }

    return NextResponse.json(
      {
        runId: activeRunId,
        synthesis: run.synthesis,
        specialistReports: run.specialistReports,
        failedSpecialists: run.failedSpecialists,
        model: run.model,
        promptVersion: run.promptVersion,
        schemaVersion: run.schemaVersion,
        durationMs: run.durationMs,
        rawTranscriptStored: false,
        humanReviewRequired: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid agentic analysis request", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof AgenticStoreError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Development Intelligence agentic analysis error:", error);
    return NextResponse.json(
      { error: "Unable to complete the agentic analysis" },
      { status: 500 }
    );
  }
}
