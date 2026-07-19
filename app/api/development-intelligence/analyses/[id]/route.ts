import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  getAnalysis,
  reviewAnalysis,
} from "@/lib/development-intelligence/store";
import { humanReviewSchema } from "@/lib/development-intelligence/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

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
    const analysisId = idSchema.parse(id);
    const result = await getAnalysis(identity, analysisId);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid analysis ID" }, { status: 400 });
    }
    console.error("Development Intelligence detail error:", error);
    return NextResponse.json(
      { error: "Unable to load development analysis" },
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
    const { id } = await context.params;
    const analysisId = idSchema.parse(id);
    const review = humanReviewSchema.parse(await req.json());
    await reviewAnalysis(identity, analysisId, review);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid review request", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence review error:", error);
    return NextResponse.json(
      { error: "Unable to save human review" },
      { status: 500 }
    );
  }
}
