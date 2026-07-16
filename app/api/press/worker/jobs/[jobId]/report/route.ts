import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { PressHttpError, requireWorkerAuthorization } from "@/lib/press/auth";
import { createPressAdminClient } from "@/lib/press/db";
import { pressErrorResponse } from "@/lib/press/http";
import {
  probeResultSchema, renderResultSchema, reportJobSchema,
  scoreClipsResultSchema, transcriptionResultSchema,
} from "@/lib/press/schemas";
import { asJob } from "@/lib/press/service";
import type { PressJob } from "@/lib/press/types";

async function applyCompletedResult(job: PressJob, result: Record<string, unknown>) {
  const admin = createPressAdminClient();
  const now = new Date().toISOString();
  if (job.job_type === "probe_media" && job.asset_id) {
    const parsed = probeResultSchema.parse(result);
    const derivedKinds = [
      ...(parsed.width && parsed.height
        ? [
            { kind: "proxy", fileName: "review-proxy.mp4", mimeType: "video/mp4" },
            { kind: "poster", fileName: "poster.jpg", mimeType: "image/jpeg" },
          ]
        : []),
      { kind: "waveform", fileName: "waveform.json", mimeType: "application/json" },
    ] as const;
    const derivedAssets = derivedKinds.map((artifact) => {
      const id = derivedAssetId(job.asset_id!, artifact.kind);
      return {
        id,
        project_id: job.project_id,
        organization_id: job.organization_id,
        kind: artifact.kind,
        bucket: "press-assets",
        storage_path: `${job.organization_id}/${job.project_id}/${id}/${artifact.fileName}`,
        original_filename: artifact.fileName,
        mime_type: artifact.mimeType,
        file_size: 0,
        checksum: null,
        duration_seconds: parsed.durationSeconds ?? null,
        status: "processing",
        metadata: { derived_from_asset_id: job.asset_id, generated_by: "press-local-worker-v1" },
        updated_at: now,
      };
    });
    const { error: derivedError } = await admin.from("press_assets").upsert(derivedAssets, { onConflict: "id" });
    if (derivedError) throw derivedError;
    await admin.from("press_assets").update({
      status: "processing", duration_seconds: parsed.durationSeconds ?? null,
      metadata: { ...parsed.metadata, width: parsed.width, height: parsed.height, codec: parsed.codec },
      updated_at: now,
    }).eq("id", job.asset_id).eq("organization_id", job.organization_id);
    await admin.from("press_jobs").upsert({
      organization_id: job.organization_id, project_id: job.project_id, asset_id: job.asset_id,
      render_id: null, job_type: "transcribe_media", status: "pending", priority: 50,
      attempts: 0, max_attempts: 3, progress: 0,
      payload: {
        assetId: job.asset_id,
        derivedAssets: derivedAssets.map((asset) => ({ assetId: asset.id, kind: asset.kind })),
      },
      result: {},
      error_message: null, lease_owner: null, lease_expires_at: null,
      idempotency_key: `transcribe_media:${job.asset_id}`,
    }, { onConflict: "idempotency_key", ignoreDuplicates: true });
    await admin.from("press_projects").update({ status: "transcribing", updated_at: now })
      .eq("id", job.project_id).eq("organization_id", job.organization_id);
  } else if (job.job_type === "transcribe_media" && job.asset_id) {
    const parsed = transcriptionResultSchema.parse(result);
    const expectedDerived = Array.isArray(job.payload.derivedAssets)
      ? job.payload.derivedAssets
          .map((value) => value && typeof value === "object" ? value as Record<string, unknown> : {})
          .filter((value) => typeof value.assetId === "string" && typeof value.kind === "string")
      : [];
    for (const artifact of parsed.derivedArtifacts) {
      const expected = expectedDerived.find(
        (value) => value.assetId === artifact.assetId && value.kind === artifact.kind,
      );
      if (!expected) throw new PressHttpError(409, "Worker reported an unreserved derived asset");
      const { data: reserved, error: reservedError } = await admin.from("press_assets")
        .select("bucket, storage_path, mime_type")
        .eq("id", artifact.assetId)
        .eq("organization_id", job.organization_id)
        .maybeSingle();
      if (reservedError) throw reservedError;
      if (
        !reserved
        || reserved.bucket !== artifact.bucket
        || reserved.storage_path !== artifact.path
        || reserved.mime_type !== artifact.mimeType
      ) {
        throw new PressHttpError(409, "Derived asset output does not match its reserved destination");
      }
      const { error: artifactError } = await admin.from("press_assets").update({
        status: "uploaded",
        file_size: artifact.fileSize,
        checksum: artifact.checksum,
        updated_at: now,
      }).eq("id", artifact.assetId).eq("organization_id", job.organization_id);
      if (artifactError) throw artifactError;
    }
    const { data: transcriptRows, error } = await admin.rpc("press_replace_transcript", {
      p_project_id: job.project_id,
      p_asset_id: job.asset_id,
      p_full_text: parsed.fullText,
      p_language: parsed.language ?? "",
      p_segments: parsed.segments.map((segment, position) => ({
        position,
        start_ms: segment.startMs,
        end_ms: segment.endMs,
        speaker: segment.speaker ?? null,
        text: segment.text,
        confidence: segment.confidence ?? null,
      })),
    });
    if (error) throw error;
    const transcriptId = String(transcriptRows ?? "");
    if (!transcriptId) throw new Error("Transcript RPC returned no transcript");
    await admin.from("press_jobs").upsert({
      organization_id: job.organization_id, project_id: job.project_id, asset_id: job.asset_id,
      render_id: null, job_type: "score_clips", status: "pending", priority: 40,
      attempts: 0, max_attempts: 3, progress: 0,
      payload: { assetId: job.asset_id, transcriptId }, result: {}, error_message: null,
      lease_owner: null, lease_expires_at: null, idempotency_key: `score_clips:${transcriptId}`,
    }, { onConflict: "idempotency_key", ignoreDuplicates: true });
  } else if (job.job_type === "score_clips") {
    const parsed = scoreClipsResultSchema.parse(result);
    if (parsed.clips.length) {
      const { error } = await admin.from("press_clips").insert(parsed.clips.map((clip) => ({
        project_id: job.project_id, organization_id: job.organization_id,
        generation_run_id: job.generation_run_id, version: 1,
        start_ms: clip.startMs, end_ms: clip.endMs, title: clip.title,
        hook: clip.hook ?? null, summary: clip.summary ?? null, score: clip.score,
        scores: clip.scores, status: "proposed", rejection_reason: null,
        reviewed_by: null, reviewed_at: null,
      })));
      if (error) throw error;
    }
    await admin.from("press_projects").update({ status: "review", updated_at: now })
      .eq("id", job.project_id).eq("organization_id", job.organization_id);
    if (job.generation_run_id) {
      await admin.from("press_generation_runs").update({
        status: "review", output_count: parsed.clips.length, error_message: null, updated_at: now,
      }).eq("id", job.generation_run_id).eq("organization_id", job.organization_id);
    }
  } else if (job.job_type === "render_clip" && job.render_id) {
    const parsed = renderResultSchema.parse(result);
    const { data: reservedRender, error: reservedError } = await admin.from("press_renders")
      .select("output_bucket, output_path").eq("id", job.render_id)
      .eq("organization_id", job.organization_id).maybeSingle();
    if (reservedError) throw reservedError;
    if (!reservedRender || reservedRender.output_bucket !== parsed.outputBucket || reservedRender.output_path !== parsed.outputPath) {
      throw new PressHttpError(409, "Render output does not match the reserved destination");
    }
    await admin.from("press_renders").update({
      status: "completed", output_bucket: parsed.outputBucket, output_path: parsed.outputPath, updated_at: now,
    }).eq("id", job.render_id).eq("organization_id", job.organization_id);
    const { data: render } = await admin.from("press_renders").select("clip_id")
      .eq("id", job.render_id).maybeSingle();
    if (render?.clip_id) {
      await admin.from("press_clips").update({ status: "rendered", updated_at: now })
        .eq("id", String(render.clip_id)).eq("organization_id", job.organization_id);
    }
    const { count } = await admin.from("press_renders").select("id", { count: "exact", head: true })
      .eq("project_id", job.project_id).in("status", ["queued", "rendering"]);
    if ((count ?? 0) === 0) {
      await admin.from("press_projects").update({ status: "ready", updated_at: now })
        .eq("id", job.project_id).eq("organization_id", job.organization_id);
    }
  }
}

function derivedAssetId(sourceAssetId: string, kind: string) {
  const hex = createHash("sha256").update(`${sourceAssetId}:${kind}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const value = hex.join("");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    requireWorkerAuthorization(request.headers.get("authorization"));
    const input = reportJobSchema.parse(await request.json());
    const admin = createPressAdminClient();
    const heartbeatAt = new Date().toISOString();
    const { data, error } = await admin.from("press_jobs").select("*").eq("id", (await params).jobId).maybeSingle();
    if (error) throw error;
    if (!data) throw new PressHttpError(404, "Press job not found");
    const job = asJob(data);
    if (job.status !== "processing" || job.lease_owner !== input.workerId) {
      return NextResponse.json({ error: "Worker does not own this job lease" }, { status: 409 });
    }
    const { error: heartbeatError } = await admin.from("press_worker_heartbeats").upsert({
      worker_id: input.workerId,
      last_seen_at: heartbeatAt,
      current_job_id: input.status === "processing" ? job.id : null,
      metadata: { lastReportedStatus: input.status },
    }, { onConflict: "worker_id" });
    if (heartbeatError) throw heartbeatError;
    if (input.status === "completed") await applyCompletedResult(job, input.result ?? {});
    const terminalFailure = input.status === "failed" && job.attempts >= job.max_attempts;
    const updates: Record<string, unknown> = {
      status: terminalFailure ? "dead" : input.status,
      progress: input.status === "completed" ? 100 : (input.progress ?? job.progress),
      result: input.result ?? job.result, error_message: input.errorMessage ?? null,
      updated_at: new Date().toISOString(),
    };
    if (input.status !== "processing") {
      updates.lease_owner = null; updates.lease_expires_at = null;
    } else {
      updates.lease_expires_at = new Date(Date.now() + 300_000).toISOString();
    }
    const { data: updated, error: updateError } = await admin.from("press_jobs").update(updates)
      .eq("id", job.id).eq("lease_owner", input.workerId).select("*").single();
    if (updateError) throw updateError;
    if (terminalFailure) {
      await admin.from("press_projects").update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", job.project_id).eq("organization_id", job.organization_id);
      if (job.asset_id) {
        await admin.from("press_assets").update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", job.asset_id).eq("organization_id", job.organization_id);
      }
      if (job.render_id) {
        await admin.from("press_renders").update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", job.render_id).eq("organization_id", job.organization_id);
      }
      if (job.generation_run_id) {
        await admin.from("press_generation_runs").update({
          status: "failed", error_message: input.errorMessage ?? "Generation failed", updated_at: new Date().toISOString(),
        }).eq("id", job.generation_run_id).eq("organization_id", job.organization_id);
      }
    }
    return NextResponse.json({ job: asJob(updated) });
  } catch (error) { return pressErrorResponse(error); }
}
