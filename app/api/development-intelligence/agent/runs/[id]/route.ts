import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { developmentResourceIdSchema } from "@/lib/development-intelligence/profile-schemas";
import { getAgentRunDetail } from "@/lib/development-intelligence/agentic/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const runId = developmentResourceIdSchema.parse(id);
    const run = await getAgentRunDetail(identity, runId);
    if (!run) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      run,
      rawTranscriptStored: false,
      autonomousActionsEnabled: false,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid agent run ID" }, { status: 400 });
    }
    console.error("Development Intelligence agent run detail error:", error);
    return NextResponse.json(
      { error: "Unable to load agent run" },
      { status: 500 }
    );
  }
}
