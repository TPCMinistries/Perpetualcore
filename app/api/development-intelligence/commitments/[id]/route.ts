import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  developmentResourceIdSchema,
  updateCommitmentSchema,
} from "@/lib/development-intelligence/profile-schemas";
import {
  ProfileOperationError,
  updateCommitmentStatus,
} from "@/lib/development-intelligence/profile-store";

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
    const commitmentId = developmentResourceIdSchema.parse(id);
    const input = updateCommitmentSchema.parse(await req.json());
    await updateCommitmentStatus(identity, commitmentId, input);
    return NextResponse.json({ success: true, status: input.status });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid commitment update", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof ProfileOperationError && error.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Development Intelligence commitment update error:", error);
    return NextResponse.json(
      { error: "Unable to update commitment" },
      { status: 500 }
    );
  }
}
