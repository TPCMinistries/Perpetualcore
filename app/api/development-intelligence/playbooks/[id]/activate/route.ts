import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { developmentResourceIdSchema } from "@/lib/development-intelligence/profile-schemas";
import { activateAgentPlaybook } from "@/lib/development-intelligence/agentic/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
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
    const playbookId = developmentResourceIdSchema.parse(id);
    return NextResponse.json({
      playbook: await activateAgentPlaybook(identity, playbookId),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid playbook ID" }, { status: 400 });
    }
    console.error("Development Intelligence playbook activation error:", error);
    return NextResponse.json(
      { error: "Unable to activate agent playbook" },
      { status: 500 }
    );
  }
}
