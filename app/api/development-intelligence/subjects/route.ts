import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  createSubjectSchema,
  subjectListQuerySchema,
} from "@/lib/development-intelligence/profile-schemas";
import {
  createSubject,
  listSubjects,
  ProfileOperationError,
} from "@/lib/development-intelligence/profile-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const query = subjectListQuerySchema.parse({
      limit: req.nextUrl.searchParams.get("limit") || undefined,
      status: req.nextUrl.searchParams.get("status") || undefined,
    });
    return NextResponse.json({ subjects: await listSubjects(identity, query) });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid subject query", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof ProfileOperationError && error.status === 409) {
      return NextResponse.json(
        { error: "A development profile with that reference already exists" },
        { status: 409 }
      );
    }
    console.error("Development Intelligence subject list error:", error);
    return NextResponse.json(
      { error: "Unable to load development profiles" },
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

    const input = createSubjectSchema.parse(await req.json());
    const subject = await createSubject(identity, input);
    return NextResponse.json({ subject }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid development profile", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence subject creation error:", error);
    return NextResponse.json(
      { error: "Unable to create development profile" },
      { status: 500 }
    );
  }
}
