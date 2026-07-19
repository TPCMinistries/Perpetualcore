import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkRateLimit, rateLimiters } from "@/lib/rate-limit";
import { getDevelopmentIdentity } from "@/lib/development-intelligence/identity";
import { HDI_MEDIA_BUCKET, mediaExtension } from "@/lib/development-intelligence/media";
import { mediaIngestionRequestSchema } from "@/lib/development-intelligence/schemas";
import {
  beginMediaIngestion,
  finalizeMediaIngestion,
} from "@/lib/development-intelligence/store";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    const input = mediaIngestionRequestSchema.parse(await req.json());
    const secret = process.env.HDI_SOURCE_HASH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error("HDI_SOURCE_HASH_SECRET must be configured with at least 32 characters");
    }
    const sourceHash = createHmac("sha256", secret)
      .update(`media-upload:${randomUUID()}`)
      .digest("hex");
    const extension = mediaExtension(input.contentType);
    const ingestion = await beginMediaIngestion(
      identity,
      input,
      sourceHash,
      extension
    );

    const { data, error } = await createAdminClient()
      .storage
      .from(HDI_MEDIA_BUCKET)
      .createSignedUploadUrl(ingestion.storagePath, { upsert: false });
    if (error || !data) {
      await finalizeMediaIngestion(
        identity,
        ingestion.ingestionId,
        "failed",
        "signed_upload_failed"
      );
      throw new Error(`Unable to authorize media upload: ${error?.message || "unknown error"}`);
    }

    return NextResponse.json(
      {
        ingestionId: ingestion.ingestionId,
        sessionId: ingestion.sessionId,
        bucket: HDI_MEDIA_BUCKET,
        path: ingestion.storagePath,
        token: data.token,
        expiresInSeconds: 7_200,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid media request", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("Development Intelligence media initialization error:", error);
    return NextResponse.json(
      { error: "Unable to initialize secure media upload" },
      { status: 500 }
    );
  }
}
