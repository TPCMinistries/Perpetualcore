import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  createPlaybookSchema,
  playbookListQuerySchema,
} from "@/lib/development-intelligence/agentic/contracts";
import {
  createAgentPlaybook,
  listAgentPlaybooks,
} from "@/lib/development-intelligence/agentic/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const query = playbookListQuerySchema.parse({
      limit: req.nextUrl.searchParams.get("limit") || undefined,
      status: req.nextUrl.searchParams.get("status") || undefined,
    });
    return NextResponse.json({
      playbooks: await listAgentPlaybooks(identity, query),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid playbook query", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence playbook list error:", error);
    return NextResponse.json(
      { error: "Unable to load agent playbooks" },
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
      rateLimiters.strict,
      identity.userId
    );
    if (rateLimitResponse) return rateLimitResponse;
    const input = createPlaybookSchema.parse(await req.json());
    return NextResponse.json(
      { playbook: await createAgentPlaybook(identity, input) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid agent playbook", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence playbook creation error:", error);
    return NextResponse.json(
      { error: "Unable to create agent playbook" },
      { status: 500 }
    );
  }
}
