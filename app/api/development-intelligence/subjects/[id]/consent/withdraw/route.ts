import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  developmentResourceIdSchema,
  withdrawLongitudinalConsentSchema,
} from "@/lib/development-intelligence/profile-schemas";
import {
  ProfileOperationError,
  withdrawLongitudinalConsent,
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
    const input = withdrawLongitudinalConsentSchema.parse(await req.json());
    await withdrawLongitudinalConsent(identity, subjectId, input);
    return NextResponse.json({
      success: true,
      consentStatus: "withdrawn",
      status: "archived",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Explicit withdrawal confirmation is required", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof ProfileOperationError && error.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Development Intelligence consent withdrawal error:", error);
    return NextResponse.json(
      { error: "Unable to withdraw longitudinal consent" },
      { status: 500 }
    );
  }
}
