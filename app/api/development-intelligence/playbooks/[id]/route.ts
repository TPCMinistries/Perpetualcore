import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { developmentResourceIdSchema } from "@/lib/development-intelligence/profile-schemas";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { getAgentPlaybook } from "@/lib/development-intelligence/agentic/store";

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
    const playbookId = developmentResourceIdSchema.parse(id);
    const playbook = await getAgentPlaybook(identity, playbookId);
    if (!playbook) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ playbook });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid playbook ID" }, { status: 400 });
    }
    console.error("Development Intelligence playbook detail error:", error);
    return NextResponse.json(
      { error: "Unable to load agent playbook" },
      { status: 500 }
    );
  }
}
