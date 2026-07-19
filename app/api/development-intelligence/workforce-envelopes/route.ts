import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  persistWorkforceEnvelope,
  verifyWorkforceEnvelopeSignature,
  workforceEnvelopeSchema,
} from "@/lib/development-intelligence/workforce-envelope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 100_000;
const REPLAY_WINDOW_SECONDS = 300;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    const timestamp = request.headers.get("x-hdi-timestamp") || "";
    const eventId = request.headers.get("x-hdi-event-id") || "";
    const signature = request.headers.get("x-hdi-signature") || "";
    const timestampSeconds = Number(timestamp);
    if (
      !Number.isInteger(timestampSeconds) ||
      Math.abs(Math.floor(Date.now() / 1_000) - timestampSeconds) > REPLAY_WINDOW_SECONDS
    ) {
      return NextResponse.json({ error: "Expired request" }, { status: 401 });
    }
    if (!verifyWorkforceEnvelopeSignature({ rawBody, timestamp, eventId, signature })) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const envelope = workforceEnvelopeSchema.parse(JSON.parse(rawBody) as unknown);
    if (envelope.eventId !== eventId) {
      return NextResponse.json({ error: "Event identifier mismatch" }, { status: 400 });
    }
    const analysisId = await persistWorkforceEnvelope(envelope);
    return NextResponse.json(
      {
        accepted: true,
        analysisId,
        rawMediaStored: false,
        rawTranscriptStored: false,
        humanReviewRequired: true,
      },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid workforce envelope" }, { status: 400 });
    }
    console.error("HDI workforce envelope error:", error);
    return NextResponse.json({ error: "Unable to accept workforce envelope" }, { status: 500 });
  }
}
