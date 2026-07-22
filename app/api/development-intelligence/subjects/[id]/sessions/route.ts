import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  developmentResourceIdSchema,
  linkSubjectSessionSchema,
} from "@/lib/development-intelligence/profile-schemas";
import {
  linkSubjectSession,
  ProfileOperationError,
} from "@/lib/development-intelligence/profile-store";

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
    const subjectId = developmentResourceIdSchema.parse(id);
    const input = linkSubjectSessionSchema.parse(await req.json());
    const result = await linkSubjectSession(identity, subjectId, input);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid session link", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof ProfileOperationError && error.status !== 500) {
      const message = error.status === 404 ? "Not found" : "Session cannot be linked";
      return NextResponse.json({ error: message }, { status: error.status });
    }
    console.error("Development Intelligence session link error:", error);
    return NextResponse.json(
      { error: "Unable to link session to development profile" },
      { status: 500 }
    );
  }
}
