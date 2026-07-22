import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  developmentResourceIdSchema,
  updateSubjectSchema,
} from "@/lib/development-intelligence/profile-schemas";
import {
  getSubject,
  ProfileOperationError,
  updateSubject,
} from "@/lib/development-intelligence/profile-store";

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
    const subjectId = developmentResourceIdSchema.parse(id);
    const result = await getSubject(identity, subjectId);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 });
    }
    console.error("Development Intelligence subject detail error:", error);
    return NextResponse.json(
      { error: "Unable to load development profile" },
      { status: 500 }
    );
  }
}

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
    const subjectId = developmentResourceIdSchema.parse(id);
    const input = updateSubjectSchema.parse(await req.json());
    return NextResponse.json({ subject: await updateSubject(identity, subjectId, input) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid profile update", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof ProfileOperationError && error.status === 404) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Development Intelligence subject update error:", error);
    return NextResponse.json(
      { error: "Unable to update development profile" },
      { status: 500 }
    );
  }
}
