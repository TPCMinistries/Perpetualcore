import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PressHttpError } from "./auth";

export function pressErrorResponse(error: unknown): NextResponse {
  if (error instanceof PressHttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request", issues: error.issues }, { status: 400 });
  }
  console.error("[Press API]", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
