import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { analyzeDevelopmentTranscript } from "@/lib/development-intelligence/analyzer";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import {
  asMediaAnalysisInput,
  HDI_MAX_MEDIA_BYTES,
  transcribeDevelopmentMedia,
} from "@/lib/development-intelligence/media";
import { mediaProcessRequestSchema } from "@/lib/development-intelligence/schemas";
import {
  claimMediaIngestion,
  finalizeMediaIngestion,
  persistMediaAnalysis,
} from "@/lib/development-intelligence/store";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function safeErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return "processing_failed";
  if (error.message.includes("No speech")) return "no_speech";
  if (error.message.includes("25 MB")) return "file_too_large";
  if (error.message.includes("download")) return "download_failed";
  if (error.message.includes("transcription")) return "transcription_failed";
  return "processing_failed";
}

export async function POST(req: NextRequest) {
  let claimed:
    | Awaited<ReturnType<typeof claimMediaIngestion>>
    | undefined;
  let identity: Awaited<ReturnType<typeof getDevelopmentIdentity>> = null;
  let ingestionId: string | undefined;
  try {
    identity = await getDevelopmentIdentity();
    if (!identity) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(
      req,
      rateLimiters.developmentAnalysis,
      identity.userId
    );
    if (rateLimitResponse) return rateLimitResponse;

    const input = mediaProcessRequestSchema.parse(await req.json());
    ingestionId = input.ingestionId;
    claimed = await claimMediaIngestion(identity, input.ingestionId);
    const storage = createAdminClient().storage.from(claimed.storageBucket);
    const { data: mediaBlob, error: downloadError } = await storage.download(
      claimed.storagePath
    );
    if (downloadError || !mediaBlob) {
      throw new Error(`Unable to download staged media: ${downloadError?.message || "unknown error"}`);
    }
    if (
      mediaBlob.size !== claimed.byteSize ||
      mediaBlob.size > HDI_MAX_MEDIA_BYTES
    ) {
      throw new Error("HDI media size did not match the authorized upload");
    }

    const transcription = await transcribeDevelopmentMedia({
      bytes: await mediaBlob.arrayBuffer(),
      contentType: claimed.contentType,
      fileName: `authorized-meeting.${claimed.storagePath.split(".").pop() || "webm"}`,
    });
    const analysisInput = asMediaAnalysisInput({
      title: claimed.title,
      lens: claimed.lens,
      occurredAt: claimed.occurredAt,
      transcript: transcription.transcript,
      segments: transcription.segments,
      participantLabels: transcription.participantLabels,
    });
    const run = await analyzeDevelopmentTranscript(analysisInput);

    // Deletion is a hard gate: no durable evidence report is written while the
    // temporary source object still exists.
    const { error: deleteError } = await storage.remove([claimed.storagePath]);
    if (deleteError) {
      throw new Error(`Unable to delete staged media: ${deleteError.message}`);
    }

    const analysisId = await persistMediaAnalysis(
      identity,
      claimed.sessionId,
      analysisInput,
      run
    );
    try {
      await finalizeMediaIngestion(identity, input.ingestionId, "completed");
    } catch (finalizeError) {
      // The report exists and the media deletion gate passed. Keep the user-facing
      // result successful while surfacing lifecycle repair loudly to operations.
      console.error("HDI completed media finalization needs repair:", finalizeError);
    }

    return NextResponse.json(
      {
        analysisId,
        analysis: run.output,
        transcription: {
          model: transcription.model,
          durationMs: transcription.durationMs,
          speakerCount: transcription.participantLabels.length,
        },
        rawMediaStored: false,
        rawTranscriptStored: false,
        humanReviewRequired: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid media processing request", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence media processing error:", error);
    if (identity && ingestionId && claimed) {
      const storage = createAdminClient().storage.from(claimed.storageBucket);
      const { error: deleteError } = await storage.remove([claimed.storagePath]);
      if (deleteError) {
        console.error("HDI staged media cleanup failed:", deleteError.message);
      } else {
        try {
          await finalizeMediaIngestion(
            identity,
            ingestionId,
            "failed",
            safeErrorCode(error)
          );
        } catch (finalizeError) {
          console.error("HDI media failure finalization failed:", finalizeError);
        }
      }
    }
    return NextResponse.json(
      { error: "Unable to process the authorized media" },
      { status: 500 }
    );
  }
}
