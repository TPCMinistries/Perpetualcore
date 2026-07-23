import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  answerEnterpriseQuestion,
  enterpriseQuestionSchema,
} from "@/lib/development-intelligence/agentic/enterprise";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(
      req,
      rateLimiters.developmentAnalysis,
      identity.userId
    );
    if (rateLimitResponse) return rateLimitResponse;

    const input = enterpriseQuestionSchema.parse(await req.json());
    const result = await answerEnterpriseQuestion(identity, input);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid enterprise question", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence enterprise question error:", error);
    return NextResponse.json(
      { error: "Unable to answer the enterprise question" },
      { status: 500 }
    );
  }
}
