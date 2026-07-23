import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { developmentResourceIdSchema } from "@/lib/development-intelligence/profile-schemas";
import { versionPlaybookSchema } from "@/lib/development-intelligence/agentic/contracts";
import { versionAgentPlaybook } from "@/lib/development-intelligence/agentic/store";

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
    const sourceId = developmentResourceIdSchema.parse(id);
    const changes = versionPlaybookSchema.parse(await req.json());
    return NextResponse.json(
      { playbook: await versionAgentPlaybook(identity, sourceId, changes) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid playbook version", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence playbook versioning error:", error);
    return NextResponse.json(
      { error: "Unable to create agent playbook version" },
      { status: 500 }
    );
  }
}
